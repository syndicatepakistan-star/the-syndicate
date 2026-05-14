"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LuxuryRedirectOverlay from "@/components/syndicate-otp/LuxuryRedirectOverlay";
import { persistSimpleAuthSession } from "@/lib/portal-api";
import { resolveClientApiUrl } from "@/lib/portal-api";
import { resolvePostOtpAppRedirect } from "@/lib/syndicate-otp-paths";
import { syndicateOtpSignupHref } from "@/lib/syndicate-otp-paths";
import { getAffiliateAttribution, saveAffiliateAttribution } from "@/lib/affiliateAttribution";
import { trackLead, trackSale } from "@/lib/affiliateApi";

const SYNDICATE_URL =
  process.env.NEXT_PUBLIC_POST_LOGIN_REDIRECT_URL ?? "https://the-syndicate.com/";

type CheckoutSuccessScreenProps = {
  sessionId: string;
};

type SuccessPayload = {
  message?: string;
  email?: string;
  error?: string;
  redirect_url?: string;
  token?: string;
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
  amount?: string | number;
  amount_paid?: string | number;
  total_amount?: string | number;
  price_paid?: string | number;
  currency?: string;
  affiliate_attribution?: {
    affiliate_id?: string;
    visitor_id?: string;
    plan_slug?: string;
    plan_label?: string;
  };
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const clean = value.replace(/[^0-9.]/g, "");
    if (!clean) return null;
    const num = Number(clean);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function looksLikeHtml(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html");
}

export default function CheckoutSuccessScreen({
  sessionId,
}: CheckoutSuccessScreenProps) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [luxuryOpen, setLuxuryOpen] = useState(false);
  const [luxuryHref, setLuxuryHref] = useState(SYNDICATE_URL);
  const [trackingDebug, setTrackingDebug] = useState<string | null>(null);

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
    ];

    class Particle {
      x = 0;
      y = 0;
      radius = 0;
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
        this.radius = Math.random() * 2 + 0.2;
        this.dx = (Math.random() - 0.5) * 0.25;
        this.dy = (Math.random() - 0.5) * 0.25;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.phase = Math.random() * Math.PI * 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update(t: number) {
        this.x += this.dx;
        this.y += this.dy;
        this.alpha = Math.sin(t * 0.001 + this.phase) * 0.2 + 0.3;
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw() {
        const { r, g, b } = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${r},${g},${b},${this.alpha})`;
        context.fill();
      }
    }

    const particles = Array.from({ length: 100 }, () => new Particle());
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      context.clearRect(0, 0, width, height);
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
    async function verifyPayment() {
      if (!sessionId) {
        setError("Missing checkout session.");
        setLoading(false);
        return;
      }
      try {
        const directBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
        const candidateUrls = [
          resolveClientApiUrl("/api/auth/checkout/success/"),
          typeof window !== "undefined"
            ? `${window.location.origin}/api/portal-proxy/auth/checkout/success/`
            : "",
          directBase ? `${directBase}/api/auth/checkout/success/` : "",
        ].filter(Boolean);

        let response: Response | null = null;
        let text = "";
        for (const url of candidateUrls) {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const body = await res.text();
          if (!looksLikeHtml(body)) {
            response = res;
            text = body;
            break;
          }
          response = res;
          text = body;
        }
        if (!response) {
          throw new Error("Checkout confirmation request failed.");
        }

        let data: SuccessPayload = {};
        try {
          data = text ? (JSON.parse(text) as SuccessPayload) : {};
        } catch {
          const snippet = text.replace(/\s+/g, " ").trim().slice(0, 140);
          throw new Error(
            snippet
              ? `Checkout confirmation returned non-JSON response: ${snippet}`
              : "Invalid response from checkout confirmation. Restart backend and try again.",
          );
        }

        if (!response.ok) {
          throw new Error(data.error || "Payment confirmation failed.");
        }

        setMessage(data.message || "Payment confirmed.");
        const t = typeof data.token === "string" ? data.token.trim() : "";
        if (t) {
          const loginEmail = (data.user?.email || data.email || "").trim();
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
        const nextUrl =
          typeof window !== "undefined"
            ? resolvePostOtpAppRedirect(data.redirect_url)
            : SYNDICATE_URL;

        const attribution = getAffiliateAttribution();
        const payloadAttr = data.affiliate_attribution;
        const payloadAffiliateId = (payloadAttr?.affiliate_id || "").trim();
        const payloadVisitorId = (payloadAttr?.visitor_id || "").trim();
        const planLabel = (payloadAttr?.plan_label || "").trim();
        const planSlug = (payloadAttr?.plan_slug || "").trim();
        const effectiveAttribution =
          (payloadAffiliateId && payloadVisitorId
            ? {
                affiliateId: payloadAffiliateId,
                visitorId: payloadVisitorId,
                offer: planLabel || attribution?.offer || "checkout-purchase",
                tier: planSlug || attribution?.tier,
                program: planLabel || attribution?.program,
                createdAt: Date.now(),
              }
            : null) ?? attribution;
        if (process.env.NODE_ENV !== "production" && effectiveAttribution) {
          setTrackingDebug(
            `debug tracking -> affiliate_id=${effectiveAttribution.affiliateId} | visitor_id=${effectiveAttribution.visitorId}`
          );
        }
        const checkoutAmount =
          toNumber(data.amount_paid) ??
          toNumber(data.total_amount) ??
          toNumber(data.price_paid) ??
          toNumber(data.amount);
        const buyerEmail = (data.user?.email || data.email || "").trim();
        if (effectiveAttribution && buyerEmail) {
          const purchaseAmountValue = checkoutAmount && checkoutAmount > 0 ? checkoutAmount : 0;
          const commissionRate = purchaseAmountValue >= 333 ? 0.3 : 0.15;
          try {
            // Auth-slot lead: fills "Sign up lead" if it wasn't already filled by the OTP flow,
            // and is idempotent on repeat purchases (the backend dedupes on (referral, visitor_id, kind)).
            await trackLead(
              effectiveAttribution.affiliateId,
              effectiveAttribution.visitorId,
              buyerEmail,
              { kind: "auth", label: "Sign up lead" }
            );
          } catch {
            // Keep going: sale + earnings should still be recorded even if lead call fails.
          }
          try {
            await trackSale(
              effectiveAttribution.affiliateId,
              effectiveAttribution.visitorId,
              buyerEmail,
              purchaseAmountValue.toFixed(2),
              {
                purchase_amount: purchaseAmountValue.toFixed(2),
                commission_rate: commissionRate,
                offer: effectiveAttribution.offer,
                tier: effectiveAttribution.tier,
                program: effectiveAttribution.program,
                currency: (typeof data.currency === "string" && data.currency.trim()) ? data.currency.trim().toLowerCase() : "usd",
              }
            );
            // IMPORTANT: keep the attribution alive in localStorage so subsequent purchases
            // by the same visitor (within the 30-day window) keep crediting this affiliate.
            // We refresh `createdAt` to slide the window forward on every successful sale.
            saveAffiliateAttribution({
              affiliateId: effectiveAttribution.affiliateId,
              visitorId: effectiveAttribution.visitorId,
              offer: effectiveAttribution.offer,
              tier: effectiveAttribution.tier,
              program: effectiveAttribution.program,
            });
          } catch {
            // Payment is already successful; keep UX flow even if affiliate sale sync fails.
          }
        }

        setLuxuryHref(nextUrl);
        window.history.replaceState({}, "", "/");
        window.setTimeout(() => setLuxuryOpen(true), 80);
        window.setTimeout(() => {
          if (typeof window !== "undefined") window.location.replace(nextUrl);
        }, 700);
      } catch (verificationError) {
        setError(
          verificationError instanceof Error
            ? verificationError.message
            : "Unable to verify checkout.",
        );
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="checkout-page-wrap checkout-page-wrap--entered">
      <LuxuryRedirectOverlay active={luxuryOpen} href={luxuryHref} delayMs={650} />

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

      <div className="login-container">
        <div className="login-box checkout-box">
          <div className="login-header">
            <span className="status-dot" />
            <h1 className="glitch" data-text="SUCCESS">
              SUCCESS
            </h1>
            <span className="status-dot" />
          </div>

          {loading ? <p className="form-message">VERIFYING PAYMENT...</p> : null}
          {!loading && message ? <p className="form-message">{message}</p> : null}
          {!loading && luxuryOpen ? (
            <p className="form-message">Preparing your arrival at the main site…</p>
          ) : null}
          {!loading && trackingDebug ? (
            <p className="mt-1 text-[11px] tracking-[0.05em] text-cyan-200/80">{trackingDebug}</p>
          ) : null}
          {!loading && error ? <p className="form-error">{error}</p> : null}

          {!loading && error ? (
            <Link className="cyber-btn checkout-login-btn" href={syndicateOtpSignupHref()}>
              <span className="cyber-btn__text">BACK TO SIGN UP</span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
