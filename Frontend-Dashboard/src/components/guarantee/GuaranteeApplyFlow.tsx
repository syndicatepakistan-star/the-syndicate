"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CyberChamferFrame } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";
import { portalFetch } from "@/lib/portal-api";

type PurchaseItem = {
  key: string;
  kind: string;
  label: string;
  amount: string;
  currency: string;
};

const REQUEST_TYPES = ["Founder Audit", "Full Refund", "Full Replacement"] as const;

type Step = "email" | "otp" | "form" | "done";

const STORAGE_KEY = "syndicate_guarantee_apply_v1";

type PersistedFlow = {
  step: Step;
  email: string;
  guaranteeToken: string;
  memberName: string;
  purchases: PurchaseItem[];
  purchaseKey: string;
  requestType: (typeof REQUEST_TYPES)[number];
  message: string;
};

function readPersisted(): PersistedFlow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedFlow;
    if (!data || !data.step || !data.email) return null;
    if (data.step === "email" || data.step === "done") return null;
    return data;
  } catch {
    return null;
  }
}

function writePersisted(payload: PersistedFlow | null) {
  if (typeof window === "undefined") return;
  try {
    if (!payload || payload.step === "email" || payload.step === "done") {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

function dedupePurchases(list: PurchaseItem[]): PurchaseItem[] {
  const out: PurchaseItem[] = [];
  const keys = new Set<string>();
  const labels = new Set<string>();
  for (const item of list) {
    const key = (item.key || "").trim();
    const labelNorm = (item.label || "").trim().toLowerCase();
    if (!key || keys.has(key)) continue;
    if (labelNorm && labels.has(labelNorm)) continue;
    keys.add(key);
    if (labelNorm) labels.add(labelNorm);
    out.push(item);
  }
  return out;
}

const labelGold =
  "text-sm font-black uppercase tracking-[0.16em] text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]";
const labelCyan =
  "text-sm font-black uppercase tracking-[0.16em] text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]";
const labelViolet =
  "text-sm font-black uppercase tracking-[0.16em] text-violet-200 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]";
const labelFuchsia =
  "text-sm font-black uppercase tracking-[0.16em] text-fuchsia-200 drop-shadow-[0_0_10px_rgba(232,121,249,0.45)]";

const fieldCyan =
  "syndicate-select syndicate-select--status w-full rounded-xl border border-cyan-400/55 bg-[linear-gradient(180deg,rgba(10,28,24,0.96),rgba(6,14,12,0.99))] px-4 py-3.5 text-lg text-[#e8fff8] outline-none placeholder:text-cyan-100/35 focus:border-cyan-200/90 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]";
const fieldAmber =
  "w-full rounded-xl border border-amber-300/55 bg-[linear-gradient(180deg,rgba(30,22,8,0.96),rgba(10,8,4,0.99))] px-4 py-3.5 text-lg text-[#fff7d6] outline-none placeholder:text-amber-100/35 focus:border-amber-200/90 focus:shadow-[0_0_20px_rgba(251,191,36,0.35)]";
const fieldGold =
  "syndicate-select syndicate-select--category w-full rounded-xl border border-amber-300/55 bg-[linear-gradient(180deg,rgba(26,30,20,0.96),rgba(8,10,6,0.99))] px-4 py-3.5 text-lg text-[#fffbeb] outline-none focus:border-amber-200/90 focus:shadow-[0_0_20px_rgba(251,191,36,0.3)]";
const fieldViolet =
  "syndicate-select syndicate-select--mood w-full rounded-xl border border-violet-400/55 bg-[linear-gradient(180deg,rgba(31,31,50,0.96),rgba(12,12,24,0.99))] px-4 py-3.5 text-lg text-[#f0f2ff] outline-none focus:border-violet-300/90 focus:shadow-[0_0_20px_rgba(167,139,250,0.35)]";
const fieldFuchsia =
  "w-full rounded-xl border border-fuchsia-400/55 bg-[linear-gradient(180deg,rgba(32,10,28,0.96),rgba(12,4,14,0.99))] px-4 py-3.5 text-lg text-[#fdf4ff] outline-none placeholder:text-fuchsia-100/35 focus:border-fuchsia-300/90 focus:shadow-[0_0_20px_rgba(232,121,249,0.35)]";

const ctaAmber =
  "hamburger-attract w-full rounded-xl border border-amber-300/85 bg-[linear-gradient(135deg,rgba(245,200,20,0.18),rgba(20,14,4,0.95))] px-4 py-4 text-base font-black uppercase tracking-[0.12em] text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
const ctaCyan =
  "hamburger-attract w-full rounded-xl border border-cyan-300/85 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(4,16,20,0.95))] px-4 py-4 text-base font-black uppercase tracking-[0.12em] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.4)] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
const ctaFuchsia =
  "hamburger-attract w-full rounded-xl border border-fuchsia-300/85 bg-[linear-gradient(135deg,rgba(232,121,249,0.18),rgba(20,4,18,0.95))] px-4 py-4 text-base font-black uppercase tracking-[0.12em] text-fuchsia-100 shadow-[0_0_24px_rgba(232,121,249,0.4)] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

export function GuaranteeApplyFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [guaranteeToken, setGuaranteeToken] = useState("");
  const [memberName, setMemberName] = useState("");
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [purchaseKey, setPurchaseKey] = useState("");
  const [requestType, setRequestType] = useState<(typeof REQUEST_TYPES)[number]>("Full Refund");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const emailNorm = useMemo(() => email.trim().toLowerCase(), [email]);

  const applySaved = (saved: PersistedFlow) => {
    setEmail(saved.email);
    setStep(saved.step);
    setGuaranteeToken(saved.guaranteeToken);
    setMemberName(saved.memberName);
    const unique = dedupePurchases(saved.purchases || []);
    setPurchases(unique);
    const keyOk = unique.some((p) => p.key === saved.purchaseKey);
    setPurchaseKey(keyOk ? saved.purchaseKey : unique[0]?.key || "");
    setRequestType(saved.requestType);
    setMessage(saved.message);
    if (saved.step === "otp") {
      setSuccess("Enter the 6-digit code from your Gmail (check spam too).");
    }
  };

  useEffect(() => {
    const saved = readPersisted();
    if (saved) applySaved(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writePersisted({
      step,
      email: emailNorm,
      guaranteeToken,
      memberName,
      purchases,
      purchaseKey,
      requestType,
      message,
    });
  }, [ready, step, emailNorm, guaranteeToken, memberName, purchases, purchaseKey, requestType, message]);

  // Mobile browsers often discard in-memory React state when switching to Gmail; restore on return.
  useEffect(() => {
    const restore = () => {
      const saved = readPersisted();
      if (!saved) return;
      applySaved(saved);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") restore();
    };
    window.addEventListener("pageshow", restore);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", restore);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const resetToEmail = () => {
    setStep("email");
    setOtp("");
    setGuaranteeToken("");
    setMemberName("");
    setPurchases([]);
    setPurchaseKey("");
    setMessage("");
    setError(null);
    setSuccess(null);
    writePersisted(null);
  };

  const sendOtp = async () => {
    setError(null);
    setSuccess(null);
    if (!emailNorm || !emailNorm.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { ok, data } = await portalFetch<{ detail?: string; message?: string }>(
      "/api/auth/guarantee/send-otp/",
      {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email: emailNorm }),
      },
    );
    setBusy(false);
    if (!ok) {
      setError(data?.detail || "Could not send verification code.");
      return;
    }
    setOtp("");
    setStep("otp");
    setSuccess(data?.message || "Code sent. Check your Gmail inbox (and spam).");
  };

  const verifyOtp = async () => {
    setError(null);
    setSuccess(null);
    const code = otp.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    const { ok, data, status } = await portalFetch<{
      detail?: string;
      eligible?: boolean;
      guarantee_token?: string;
      member_name?: string;
      purchases?: PurchaseItem[];
      email?: string;
    }>("/api/auth/guarantee/verify-otp/", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email: emailNorm, otp: code }),
    });
    setBusy(false);
    if (!ok || !data?.eligible || !data.guarantee_token) {
      setError(
        data?.detail ||
          (status === 403
            ? "No paid pack or program found for this email."
            : status === 400
              ? "Invalid or expired code. Check Gmail and try again, or resend."
              : "Verification failed. Try again."),
      );
      return;
    }
    setGuaranteeToken(data.guarantee_token);
    setMemberName(data.member_name || "");
    const list = dedupePurchases(data.purchases || []);
    setPurchases(list);
    setPurchaseKey(list[0]?.key || "");
    setOtp("");
    setStep("form");
    setSuccess(null);
  };

  const submitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = message.trim();
    if (!purchaseKey) {
      setError("Select the pack or program this request is about.");
      return;
    }
    if (trimmed.length < 20) {
      setError("Please describe what went wrong (at least 20 characters).");
      return;
    }
    setBusy(true);
    const { ok, data } = await portalFetch<{ ok?: boolean; message?: string; detail?: string }>(
      "/api/auth/guarantee/apply/",
      {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          guarantee_token: guaranteeToken,
          request_type: requestType,
          purchase_key: purchaseKey,
          message: trimmed,
        }),
      },
    );
    setBusy(false);
    if (!ok) {
      setError(data?.detail || "Could not submit your request. Please try again.");
      return;
    }
    setSuccess(data?.message || "Request sent.");
    setStep("done");
    writePersisted(null);
  };

  return (
    <CyberChamferFrame
      accent={step === "form" ? "violet" : step === "otp" ? "amber" : step === "done" ? "lime" : "cyan"}
      chamfer={20}
      className="w-full"
      innerClassName="px-6 py-8 sm:px-10 sm:py-11 lg:px-14"
    >
      <p
        className={`${publicHeadingLightning(step === "form" ? "violet" : step === "otp" ? "amber" : "cyan")} text-center text-sm font-black uppercase tracking-[0.28em]`}
      >
        The Syndicate
      </p>
      <h1
        className={`guarantee-page-title ${publicHeadingLightning(step === "form" ? "violet" : step === "otp" ? "amber" : "cyan")} mt-3 text-center font-black uppercase`}
        style={{ fontSize: "32pt", lineHeight: 1.45, letterSpacing: "0.06em" }}
      >
        {step === "form" ? "Apply for refund" : step === "done" ? "Request sent" : "Verify yourself"}
      </h1>
      <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-[1.75] text-zinc-100/90 sm:text-xl">
        {step === "form"
          ? "Pick the purchase this is about, choose a request type, and describe what went wrong."
          : step === "done"
            ? "Our team will review your case at intelligence@the-syndicate.com."
            : "Enter the email you used to purchase. We send a one-time code to that Gmail — no password login."}
      </p>

      <div className="mx-auto mt-8 w-full max-w-3xl space-y-5">
        {step === "email" || step === "otp" ? (
          <label className="block space-y-2 text-left">
            <span className={labelCyan}>Purchase email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={step === "otp" || busy}
              placeholder="you@gmail.com"
              className={`${fieldCyan} disabled:opacity-70`}
            />
          </label>
        ) : null}

        {step === "email" ? (
          <button type="button" disabled={busy} onClick={() => void sendOtp()} className={ctaCyan}>
            {busy ? "Sending…" : "Send Gmail verification code"}
          </button>
        ) : null}

        {step === "otp" ? (
          <>
            <div className="rounded-xl border border-amber-300/45 bg-amber-950/30 px-4 py-3 text-center text-base text-amber-100/95 shadow-[0_0_18px_rgba(251,191,36,0.18)]">
              Code sent to <span className="font-semibold text-amber-50">{emailNorm}</span> — stay on this screen while you
              open Gmail. Your progress is saved.
            </div>
            <label className="block space-y-2 text-left">
              <span className={labelGold}>Verification OTP from Gmail</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className={`${fieldAmber} text-center text-2xl tracking-[0.35em] placeholder:tracking-normal`}
              />
            </label>
            <button type="button" disabled={busy} onClick={() => void verifyOtp()} className={ctaAmber}>
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendOtp()}
              className="w-full text-center text-base font-semibold text-cyan-200/95 underline-offset-2 hover:underline"
            >
              Resend code
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={resetToEmail}
              className="w-full text-center text-base text-white/55 hover:text-white/80"
            >
              Change email
            </button>
          </>
        ) : null}

        {step === "form" ? (
          <form onSubmit={(e) => void submitApply(e)} className="space-y-5 text-left">
            <p className="rounded-xl border border-emerald-400/50 bg-emerald-950/40 px-4 py-3 text-center text-base text-emerald-100/95 shadow-[0_0_18px_rgba(52,211,153,0.2)] sm:text-lg">
              Verified{memberName ? ` — ${memberName}` : ""} ({emailNorm})
            </p>

            <label className="block space-y-2">
              <span className={labelGold}>Purchase this is about</span>
              <select value={purchaseKey} onChange={(e) => setPurchaseKey(e.target.value)} className={fieldGold}>
                {purchases.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                    {p.amount ? ` — ${p.amount} ${p.currency}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className={labelViolet}>Request type</span>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as (typeof REQUEST_TYPES)[number])}
                className={fieldViolet}
              >
                {REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className={labelFuchsia}>What went wrong? (details)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                minLength={20}
                maxLength={4000}
                placeholder="Describe the issue so our team understands why you are applying…"
                className={`${fieldFuchsia} resize-y`}
              />
            </label>

            <button type="submit" disabled={busy} className={ctaFuchsia}>
              {busy ? "Sending…" : "Submit refund application"}
            </button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="space-y-4 text-center">
            <p className={`${publicHeadingLightning("lime")} text-2xl font-black uppercase tracking-[0.08em]`}>
              Request sent
            </p>
            <p className="text-lg leading-relaxed text-emerald-200">
              {success || "Your request was sent. Our team will review it shortly."}
            </p>
            <Link
              href="/syndicate-guarantee"
              className="inline-flex text-base font-semibold text-cyan-200 underline-offset-2 hover:underline"
            >
              Back to Guarantee
            </Link>
          </div>
        ) : null}

        {error ? <p className="text-center text-base text-rose-200">{error}</p> : null}
        {success && step !== "done" ? (
          <p className={`text-center text-base ${step === "otp" ? "text-amber-200/90" : "text-emerald-200/90"}`}>
            {success}
          </p>
        ) : null}

        {step !== "done" ? (
          <p className="pt-2 text-center">
            <Link href="/syndicate-guarantee" className="text-base text-white/50 hover:text-white/85">
              ← Back to Syndicate Guarantee
            </Link>
          </p>
        ) : null}
      </div>
    </CyberChamferFrame>
  );
}
