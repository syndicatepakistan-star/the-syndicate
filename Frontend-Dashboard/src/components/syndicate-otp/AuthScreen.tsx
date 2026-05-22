"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import LuxuryRedirectOverlay from "@/components/syndicate-otp/LuxuryRedirectOverlay";
import { getAffiliateAttribution } from "@/lib/affiliateAttribution";
import { trackLead } from "@/lib/affiliateApi";
import {
  getApiDisplayHint,
  getAuthorizationHeader,
  persistSimpleAuthSession,
  resolveClientApiUrl,
} from "@/lib/portal-api";
import {
  resolvePostOtpAppRedirect,
  syndicateOtpLoginHref,
  syndicateOtpSignupHref,
  syndicateOtpVerifyHref
} from "@/lib/syndicate-otp-paths";

type AuthMode = "login" | "signup" | "otp";
type OtpFlow = "login" | "signup";

type AuthScreenProps = {
  mode: AuthMode;
  prefilledEmail?: string;
  prefilledPlaylistId?: string;
  selectedPlan?: string;
  selectedBilling?: string;
  selectedAmount?: string;
  otpFlow?: OtpFlow;
  postLoginNext?: string;
  selectedTicket?: string;
};

type ApiPayload = {
  message?: string;
  error?: string;
  detail?: string;
  redirect_url?: string;
  token?: string;
  signup_token?: string;
  checkout_url?: string;
  session_id?: string;
  otp_required?: boolean;
  email?: string;
  code?: string;
  referral_ids?: {
    complete?: string;
    single?: string;
    pawn?: string;
    king?: string;
    exclusive?: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
  };
};

function apiErrorMessage(data: ApiPayload, fallback: string): string {
  const fromError = (data.error || "").toString().trim();
  if (fromError) return fromError;
  const fromDetail = (data.detail || "").toString().trim();
  if (fromDetail) return fromDetail;
  const fromMessage = (data.message || "").toString().trim();
  if (fromMessage) return fromMessage;
  return fallback;
}

const DASHBOARD_FALLBACK =
  process.env.NEXT_PUBLIC_POST_LOGIN_REDIRECT_URL ?? "http://localhost:3000/dashboard";

export default function AuthScreen({
  mode,
  prefilledEmail = "",
  prefilledPlaylistId = "",
  selectedPlan = "",
  selectedBilling = "",
  selectedAmount = "",
  otpFlow = "login",
  postLoginNext = "",
  selectedTicket = "",
}: AuthScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState(prefilledEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: 6 }, () => ""),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [luxuryOpen, setLuxuryOpen] = useState(false);
  const [luxuryHref, setLuxuryHref] = useState(DASHBOARD_FALLBACK);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isSignup = mode === "signup";
  const isOtp = mode === "otp";
  const isSignupOtp = isOtp && otpFlow === "signup";
  const heading = isOtp ? "VERIFY" : isSignup ? "SIGN UP" : "LOGIN";
  const submitLabel = isOtp ? "Verify code" : isSignup ? "Sign up" : "Continue";
  const otpValue = otpDigits.join("");
  const normalizedPlan = selectedPlan.trim();
  const normalizedBilling = selectedBilling.trim();
  const normalizedAmount = selectedAmount.trim();
  const normalizedPostLoginNext = postLoginNext.trim();
  const normalizedTicket = selectedTicket.trim();
  const appendOfferParams = (baseHref: string) => {
    if (!normalizedPlan && !normalizedBilling && !normalizedAmount && !normalizedPostLoginNext && !normalizedTicket) return baseHref;
    const params = new URLSearchParams();
    if (normalizedPlan) params.set("plan", normalizedPlan);
    if (normalizedBilling) params.set("billing", normalizedBilling);
    if (normalizedAmount) params.set("amount", normalizedAmount);
    if (normalizedPostLoginNext) params.set("next", normalizedPostLoginNext);
    if (normalizedTicket) params.set("ticket", normalizedTicket);
    return `${baseHref}${baseHref.includes("?") ? "&" : "?"}${params.toString()}`;
  };

  const emailFieldMinCh = useMemo(() => {
    const len = email.trim().length || 10;
    return Math.min(56, Math.max(20, len + 4));
  }, [email]);

  const switchHrefBase = isSignup
    ? syndicateOtpLoginHref()
    : isOtp
          ? isSignupOtp
            ? syndicateOtpSignupHref(email.trim())
            : syndicateOtpLoginHref(email.trim(), normalizedPostLoginNext)
      : syndicateOtpSignupHref();
  const switchHref = appendOfferParams(switchHrefBase);
  const switchText = isSignup
    ? "Already a member? Log in"
    : isOtp
      ? isSignupOtp
        ? "Wrong email? Edit sign up"
        : "Wrong email? Back to login"
      : "Sign up";

  const requestBody = useMemo(() => {
    if (isOtp) {
      return { email: email.trim(), otp: otpValue, ticket: normalizedTicket || undefined };
    }
    return { email: email.trim(), ticket: normalizedTicket || undefined };
  }, [email, isOtp, otpValue, normalizedTicket]);

  useEffect(() => {
    const el = document.getElementById("syndicate-otp-mount");
    if (!el) return;
    el.classList.remove("page-login", "page-signup", "page-otp");
    el.classList.add(isOtp ? "page-otp" : isSignup ? "page-signup" : "page-login");
  }, [isOtp, isSignup]);

  useEffect(() => {
    setEmail(prefilledEmail);
  }, [prefilledEmail]);

  useEffect(() => {
    const canvas = document.getElementById("particles") as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const context = ctx;

    let width = 0;
    let height = 0;
    let rafId = 0;

    const colors = [
      { r: 212, g: 175, b: 55 },
      { r: 240, g: 208, b: 96 },
      { r: 156, g: 124, b: 28 },
      { r: 184, g: 149, b: 46 },
      { r: 245, g: 224, b: 138 },
      { r: 107, g: 83, b: 16 },
    ];

    class Particle {
      x = 0;
      y = 0;
      r = 0;
      dx = 0;
      dy = 0;
      alpha = 0;
      phase = 0;
      color = colors[0];

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.r = Math.random() * 2 + 0.3;
        this.dx = (Math.random() - 0.5) * 0.3;
        this.dy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.phase = Math.random() * Math.PI * 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update(time: number) {
        this.x += this.dx;
        this.y += this.dy;
        this.alpha = Math.sin(time * 0.001 + this.phase) * 0.25 + 0.35;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw() {
        const { r, g, b } = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(${r},${g},${b},${this.alpha})`;
        context.shadowColor = `rgb(${r},${g},${b})`;
        context.shadowBlur = this.r * 5;
        context.fill();
      }
    }

    const particles = Array.from({ length: 140 }, () => new Particle());

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.shadowBlur = 0;
      particles.forEach((particle) => {
        particle.update(time);
        particle.draw();
      });
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.08, defaults: { ease: "power3.out" } });

    tl.from(".hud-corner", {
      scale: 0,
      opacity: 0,
      duration: 0.14,
      stagger: 0.02,
      ease: "back.out(2)",
    });
    tl.fromTo(
      ".hud-border--top",
      { opacity: 0, scaleX: 0.2, transformOrigin: "left center" },
      { opacity: 0.95, scaleX: 1, duration: 0.22 },
      "-=0.06",
    );
    tl.fromTo(
      ".hud-border--right",
      { opacity: 0, scaleY: 0.2, transformOrigin: "center top" },
      { opacity: 0.9, scaleY: 1, duration: 0.18 },
      "-=0.04",
    );
    tl.fromTo(
      ".hud-border--bottom",
      { opacity: 0, scaleX: 0.2, transformOrigin: "right center" },
      { opacity: 0.95, scaleX: 1, duration: 0.2 },
      "-=0.02",
    );
    tl.fromTo(
      ".hud-border--left",
      { opacity: 0, scaleY: 0.2, transformOrigin: "center bottom" },
      { opacity: 0.9, scaleY: 1, duration: 0.2 },
      "-=0.04",
    );
    tl.to(
      ".hud-arc",
      {
        opacity: 1,
        duration: 0.22,
        stagger: 0.04,
        ease: "power2.inOut",
      },
      "-=0.09",
    );

    gsap.set(".hud-arc-path, .hud-arc-path--inner", {
      strokeDasharray: 2400,
      strokeDashoffset: 2400,
    });
    tl.to(
      ".hud-arc-path, .hud-arc-path--inner",
      {
        strokeDashoffset: 0,
        duration: 0.45,
        stagger: 0.03,
        ease: "power2.inOut",
      },
      "-=0.18",
    );

    tl.to(
      ".hud-bracket",
      {
        opacity: 1,
        duration: 0.2,
        stagger: 0.03,
      },
      "-=0.32",
    );

    gsap.set(".hud-bracket-path, .hud-bracket-path--inner", {
      strokeDasharray: 800,
      strokeDashoffset: 800,
    });
    tl.to(
      ".hud-bracket-path, .hud-bracket-path--inner",
      {
        strokeDashoffset: 0,
        duration: 0.38,
        stagger: 0.025,
      },
      "-=0.3",
    );

    tl.to(".login-box", { opacity: 1, duration: 0.22 }, "-=0.09");
    tl.to(
      ".input-group",
      { opacity: 1, x: 0, duration: 0.2, stagger: 0.045 },
      "-=0.06",
    );
    tl.to(".cyber-btn", { opacity: 1, y: 0, duration: 0.18 }, "-=0.06");
    tl.to(".auth-switch-link", { opacity: 1, y: 0, duration: 0.18 }, "-=0.1");
    tl.to(".diamond-mark", { opacity: 0.8, duration: 0.18 }, "-=0.15");

    gsap.to(".hud-border", {
      opacity: 0.55,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: { each: 0.08, from: "start" },
    });

    gsap.to(".hud-arc-path--glow, .hud-bracket-path--glow", {
      opacity: 0.35,
      duration: 1.25,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.06,
    });

    return () => {
      tl.kill();
      gsap.killTweensOf(
        ".hud-corner, .hud-border, .hud-arc, .hud-arc-path, .hud-arc-path--inner, .hud-arc-path--glow, .hud-bracket, .hud-bracket-path, .hud-bracket-path--inner, .hud-bracket-path--glow, .login-box, .input-group, .cyber-btn, .auth-switch-link, .diamond-mark",
      );
    };
  }, []);

  async function readApiPayload(response: Response) {
    const responseText = await response.text();
    if (!responseText) return {} as ApiPayload;

    try {
      return JSON.parse(responseText) as ApiPayload;
    } catch {
      const snippet = responseText.slice(0, 120).replace(/\s+/g, " ");
      const disallowed =
        response.status === 400 &&
        (snippet.includes("Bad Request") || snippet.toLowerCase().includes("disallowed"));
      throw new Error(
        disallowed
          ? "Django rejected the request host (HTTP 400). On Railway backend set DJANGO_ALLOWED_HOSTS and RAILWAY_PUBLIC_DOMAIN to your backend host (no https://), set CORS_ALLOWED_ORIGINS to your frontend https URL, then redeploy."
          : "Server returned non-JSON response. Make sure Django is running and API URL is correct.",
      );
    }
  }

  async function postJson(path: string, body: Record<string, string | undefined>) {
    let response: Response;
    const url = resolveClientApiUrl(path);
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (caught) {
      if (caught instanceof TypeError) {
        const hint = getApiDisplayHint();
        const isRailway =
          typeof url === "string" &&
          (url.includes(".up.railway.app") || url.includes(".railway.app"));
        const deployHint = isRailway
          ? "Check Railway backend variables: DJANGO_ALLOWED_HOSTS and RAILWAY_PUBLIC_DOMAIN must match your backend domain; CORS_ALLOWED_ORIGINS must include your frontend URL; redeploy backend after env changes."
          : "From the Backend folder run: .\\run_dev.ps1 — or: python manage.py runserver";
        throw new Error(
          `Cannot reach the API (${url || path}). ${hint}. ${deployHint}`,
        );
      }
      throw caught;
    }
    const data = await readApiPayload(response);
    return { response, data };
  }

  function handleOtpChange(index: number, value: string) {
    const normalized = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = normalized;
      return next;
    });

    if (normalized && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const nextDigits = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    setOtpDigits(nextDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isOtp && otpValue.length !== 6) {
        throw new Error("Please enter the 6-digit code.");
      }

      if (isSignup) {
        const { response, data } = await postJson("/api/auth/signup/", requestBody);
        if (!response.ok) {
          const normalizedErrorCode = (data.code || "").toString().trim().toUpperCase();
          const normalizedErrorText = (data.error || "").toString().trim().toLowerCase();
          const emailAlreadyExists =
            normalizedErrorCode === "USER_EXISTS" ||
            normalizedErrorCode === "EMAIL_EXISTS" ||
            normalizedErrorCode === "ALREADY_EXISTS" ||
            normalizedErrorText.includes("already registered") ||
            (normalizedErrorText.includes("already") && normalizedErrorText.includes("exist"));
          if (emailAlreadyExists) {
            const existingEmail = (data.email || email.trim()).trim();
            setMessage("Email already exists. Redirecting to login...");
            router.replace(appendOfferParams(syndicateOtpLoginHref(existingEmail)));
            return;
          }
          throw new Error(data.error || "Request failed");
        }
        const signupEmail = email.trim();
        const attribution = getAffiliateAttribution();
        if (attribution && signupEmail) {
          // Record the "Sign up lead" for the referring affiliate. This fills the auth slot
          // (the diagnosis slot is filled separately when the user submits the quiz email).
          void trackLead(attribution.affiliateId, attribution.visitorId, signupEmail, {
            kind: "auth",
            label: "Sign up lead",
          }).catch(() => {});
        }
        const directCheckoutUrl = typeof data.checkout_url === "string" ? data.checkout_url.trim() : "";
        if (directCheckoutUrl) {
          window.location.assign(directCheckoutUrl);
          return;
        }
        const signupToken = typeof data.signup_token === "string" ? data.signup_token.trim() : "";
        if (!signupToken) {
          throw new Error("Signup started, but checkout token is missing.");
        }
        setMessage(data.message || "Redirecting to secure checkout...");
        const checkoutAttribution = getAffiliateAttribution();
        const checkoutPayload: Record<string, string | undefined> = {
          signup_token: signupToken,
          return_base_url: typeof window !== "undefined" ? window.location.origin : undefined,
          playlist_id: prefilledPlaylistId || undefined,
          selected_plan: normalizedPlan || undefined,
          selected_billing: normalizedBilling || undefined,
          selected_amount: normalizedAmount || undefined,
          affiliate_id: checkoutAttribution?.affiliateId,
          visitor_id: checkoutAttribution?.visitorId,
        };
        const checkout = await postJson("/api/auth/checkout/create-session/", checkoutPayload);
        if (!checkout.response.ok) {
          throw new Error(checkout.data.error || "Could not create checkout session.");
        }
        const checkoutUrl = typeof checkout.data.checkout_url === "string" ? checkout.data.checkout_url.trim() : "";
        if (!checkoutUrl) {
          throw new Error("Checkout URL is missing.");
        }
        window.location.assign(checkoutUrl);
        return;
      }

      if (isOtp) {
        const endpoint = isSignupOtp
          ? "/api/auth/signup/verify-otp/"
          : "/api/auth/verify-login-otp/";
        const { response, data } = await postJson(endpoint, requestBody);
        if (!response.ok) {
          throw new Error(data.error || "Request failed");
        }
        setMessage(data.message || "Welcome back.");
        setOtpDigits(Array.from({ length: 6 }, () => ""));
        const t = typeof data.token === "string" ? data.token.trim() : "";
        if (t) {
          const loginEmail = (data.user?.email || email.trim()).trim();
          const authAttribution = getAffiliateAttribution();
          if (authAttribution && loginEmail) {
            // Record the auth-slot lead: "Sign up lead" if this OTP completes signup,
            // otherwise "Login lead" for existing-user logins via the referral link.
            void trackLead(authAttribution.affiliateId, authAttribution.visitorId, loginEmail, {
              kind: "auth",
              label: isSignupOtp ? "Sign up lead" : "Login lead",
            }).catch(() => {});
          }
          const rid = data.referral_ids;
          const referralIds =
            rid && typeof rid.complete === "string" && rid.complete.trim()
              ? {
                  complete: rid.complete.trim(),
                  single: rid.single?.trim() || rid.complete.trim(),
                  pawn: rid.pawn?.trim() || rid.single?.trim() || rid.complete.trim(),
                  king: rid.king?.trim() || rid.exclusive?.trim() || rid.complete.trim(),
                  exclusive: rid.exclusive?.trim() || rid.king?.trim() || rid.complete.trim(),
                }
              : undefined;
          persistSimpleAuthSession(
            t,
            loginEmail
              ? { email: loginEmail, userId: data.user?.id, referralIds }
              : undefined,
          );
        }
        if (!isSignupOtp && normalizedAmount) {
          const authHeader = getAuthorizationHeader();
          const otpCheckoutAttribution = getAffiliateAttribution();
          const checkoutResponse = await fetch(resolveClientApiUrl("/api/auth/checkout/create-session/"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
              return_base_url: typeof window !== "undefined" ? window.location.origin : undefined,
              selected_plan: normalizedPlan || undefined,
              selected_billing: normalizedBilling || undefined,
              selected_amount: normalizedAmount || undefined,
              affiliate_id: otpCheckoutAttribution?.affiliateId,
              visitor_id: otpCheckoutAttribution?.visitorId,
            }),
          });
          const checkoutData = (await checkoutResponse.json().catch(() => ({}))) as { checkout_url?: string };
          const checkoutUrl = typeof checkoutData.checkout_url === "string" ? checkoutData.checkout_url.trim() : "";
          if (checkoutResponse.ok && checkoutUrl) {
            window.location.assign(checkoutUrl);
            return;
          }
        }

      const nextUrl =
          normalizedPostLoginNext
            ? normalizedPostLoginNext
            : (typeof window !== "undefined"
              ? resolvePostOtpAppRedirect(data.redirect_url)
              : DASHBOARD_FALLBACK);
        setLuxuryHref(nextUrl);
        setLuxuryOpen(true);
        return;
      }

      let { response, data } = await postJson("/api/auth/otp-login/", requestBody);
      // Compatibility fallback for deployments that expose OTP login at `/api/auth/login/`.
      if (response.status === 404) {
        const retry = await postJson("/api/auth/login/", requestBody);
        response = retry.response;
        data = retry.data;
      }

      if (!response.ok) {
        if (response.status === 404 && data.code === "SIGNUP_REQUIRED") {
          const loginEmail = (data.email || email.trim()).trim();
          setMessage(apiErrorMessage(data, "No account found. Redirecting to signup..."));
          router.replace(syndicateOtpSignupHref(loginEmail));
          return;
        }
        // Some deployments return 404 without SIGNUP_REQUIRED code; show friendly guidance.
        if (response.status === 404) {
          throw new Error(apiErrorMessage(data, "You do not have any account. Please sign up."));
        }
        if (response.status === 400 || response.status === 401) {
          const msg = apiErrorMessage(data, "Request failed");
          const normalized = msg.toLowerCase();
          if (
            normalized.includes("no account") ||
            normalized.includes("sign up first") ||
            normalized.includes("signup required") ||
            normalized.includes("no active account")
          ) {
            throw new Error("You do not have any account. Please sign up.");
          }
          throw new Error(msg);
        }
        throw new Error(apiErrorMessage(data, "You do not have any account with this email. Please sign up."));
      }

      if (!data.otp_required) {
        throw new Error("Verification step not started. Please try again.");
      }
      setMessage(data.message || "Check your inbox for the code.");
      router.replace(
        appendOfferParams(
          syndicateOtpVerifyHref(data.email || email.trim(), "login")
        )
      );
    } catch (submitError) {
      const rawMessage = submitError instanceof Error ? submitError.message : "Something went wrong.";
      if (!isSignup && !isOtp) {
        const normalized = rawMessage.toLowerCase();
        if (
          normalized.includes("request failed") ||
          normalized.includes("login failed") ||
          normalized.includes("invalid json payload") ||
          normalized.includes("no account") ||
          normalized.includes("sign up")
        ) {
          setError("You do not have any account with this email.");
        } else {
          setError(rawMessage);
        }
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <LuxuryRedirectOverlay active={luxuryOpen} href={luxuryHref} delayMs={420} />

      <div className="scanline" />
      <div className="noise" />
      <canvas id="particles" />

      <div className="hud-frame">
        <div className="hud-corner hud-corner--tl" />
        <div className="hud-corner hud-corner--tr" />
        <div className="hud-corner hud-corner--bl" />
        <div className="hud-corner hud-corner--br" />
        <div className="hud-border hud-border--top" />
        <div className="hud-border hud-border--bottom" />
        <div className="hud-border hud-border--left" />
        <div className="hud-border hud-border--right" />
      </div>

      <div className="hud-arc hud-arc--top">
        <svg viewBox="0 0 900 80" preserveAspectRatio="none">
          <path className="hud-arc-path--glow" d="M 0,75 L 120,75 L 180,20 Q 200,5 230,5 L 670,5 Q 700,5 720,20 L 780,75 L 900,75" />
          <path className="hud-arc-path" d="M 0,75 L 120,75 L 180,20 Q 200,5 230,5 L 670,5 Q 700,5 720,20 L 780,75 L 900,75" />
          <path className="hud-arc-path--inner" d="M 40,68 L 140,68 L 195,22 Q 212,10 240,10 L 660,10 Q 688,10 705,22 L 760,68 L 860,68" />
        </svg>
      </div>

      <div className="hud-arc hud-arc--bottom">
        <svg viewBox="0 0 900 80" preserveAspectRatio="none">
          <path className="hud-arc-path--glow" d="M 0,5 L 120,5 L 180,60 Q 200,75 230,75 L 670,75 Q 700,75 720,60 L 780,5 L 900,5" />
          <path className="hud-arc-path" d="M 0,5 L 120,5 L 180,60 Q 200,75 230,75 L 670,75 Q 700,75 720,60 L 780,5 L 900,5" />
          <path className="hud-arc-path--inner" d="M 40,12 L 140,12 L 195,58 Q 212,70 240,70 L 660,70 Q 688,70 705,58 L 760,12 L 860,12" />
        </svg>
      </div>

      <div className="hud-bracket hud-bracket--left">
        <svg viewBox="0 0 80 420" preserveAspectRatio="none">
          <path className="hud-bracket-path--glow" d="M 75,0 L 10,0 Q 3,0 3,7 L 3,100" />
          <path className="hud-bracket-path" d="M 75,0 L 10,0 Q 3,0 3,7 L 3,100" />
          <path className="hud-bracket-path--inner" d="M 70,6 L 16,6 Q 9,6 9,13 L 9,90" />
          <path className="hud-bracket-path--glow" d="M 75,420 L 10,420 Q 3,420 3,413 L 3,320" />
          <path className="hud-bracket-path" d="M 75,420 L 10,420 Q 3,420 3,413 L 3,320" />
          <path className="hud-bracket-path--inner" d="M 70,414 L 16,414 Q 9,414 9,407 L 9,330" />
        </svg>
      </div>

      <div className="hud-bracket hud-bracket--right">
        <svg viewBox="0 0 80 420" preserveAspectRatio="none">
          <path className="hud-bracket-path--glow" d="M 5,0 L 70,0 Q 77,0 77,7 L 77,100" />
          <path className="hud-bracket-path" d="M 5,0 L 70,0 Q 77,0 77,7 L 77,100" />
          <path className="hud-bracket-path--inner" d="M 10,6 L 64,6 Q 71,6 71,13 L 71,90" />
          <path className="hud-bracket-path--glow" d="M 5,420 L 70,420 Q 77,420 77,413 L 77,320" />
          <path className="hud-bracket-path" d="M 5,420 L 70,420 Q 77,420 77,413 L 77,320" />
          <path className="hud-bracket-path--inner" d="M 10,414 L 64,414 Q 71,414 71,407 L 71,330" />
        </svg>
      </div>

      <div className="login-container">
        <div className="login-box">
          <img
            className="brand-logo"
            src="https://the-syndicate.com/wp-content/uploads/2024/01/the-syndicate-primary-logo-gold-leaf-600x240.png"
            alt="The Syndicate"
          />

          <div className="login-header">
            <span className="status-dot" />
            <h1 className="glitch" data-text={heading}>
              {heading}
            </h1>
            <span className="status-dot" />
          </div>

          <form className="login-form" autoComplete="on" onSubmit={handleSubmit}>
            <div className="input-group input-group--email">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div className="email-field-scroll">
                <input
                  className="cyber-input cyber-input--email"
                  type="email"
                  name="email"
                  placeholder="you@domain.com"
                  autoComplete="email"
                  required
                  readOnly={isOtp}
                  spellCheck={false}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  style={{ minWidth: `${emailFieldMinCh}ch`, width: `${emailFieldMinCh}ch` }}
                />
                <span className="input-line input-line--email-field" />
              </div>
            </div>

            {isOtp ? (
              <div className="input-group otp-group" onPaste={handleOtpPaste}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div className="otp-inputs">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={`otp-${index}`}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      className="otp-digit"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      required
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {error ? <p className="form-error">{error}</p> : null}
            {!error && message ? <p className="form-message">{message}</p> : null}

            {!isOtp && !isSignup ? (
              <p className="form-hint">
                No password — we email you a one-time code after we recognise your address.
              </p>
            ) : null}
            {isSignup && !isOtp ? (
              <p className="form-hint">
                Enter your email to continue directly to secure checkout.
              </p>
            ) : null}
            {isSignup && !isOtp && normalizedAmount ? (
              <p className="form-hint">
                Selected offer: {normalizedPlan || "membership"} ({normalizedBilling || "monthly"}) - ${normalizedAmount}
              </p>
            ) : null}

            <button className="cyber-btn hamburger-attract" type="submit" disabled={loading || luxuryOpen}>
              <span className="cyber-btn__text">
                {loading ? "PLEASE WAIT" : submitLabel.toUpperCase()}
              </span>
            </button>

            <Link className="auth-switch-link" href={switchHref}>
              {switchText}
            </Link>
          </form>
        </div>
      </div>

      <svg className="diamond-mark" width="24" height="24" viewBox="0 0 24 24">
        <polygon points="12,0 24,12 12,24 0,12" fill="none" stroke="#d4af37" strokeWidth="1.5" />
        <polygon points="12,4 20,12 12,20 4,12" fill="none" stroke="#9c7c1c" strokeWidth="1" />
        <polygon points="12,7 17,12 12,17 7,12" fill="#d4af3780" stroke="none" />
      </svg>
    </>
  );
}
