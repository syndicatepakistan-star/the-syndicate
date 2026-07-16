"use client";

import { useState } from "react";
import {
  CyberChamferFrame,
  CyberInsetPanel,
  type CyberFrameAccent,
} from "@/components/cyber/CyberChamferFrames";
import { persistSimpleAuthSession, resolveClientApiUrl } from "@/lib/portal-api";
import { clearStreamPlaylistsCache } from "@/lib/streaming-api";
import { clearVaultPlaylistMapCache } from "@/lib/vaultPlaylistMap";
import { markDashboardCheckoutReturn } from "@/lib/dashboardShellScroll";
import {
  clearUnlockCartStorage,
  resolvePlanOfferBySlug,
  resolvePlanOfferByTitle,
} from "@/lib/unlockCart";
import { dashboardProgramsHref } from "@/lib/dashboardRoutes";
import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

export type UnlockedProgramItem = {
  title: string;
  image?: string;
  amount?: string;
  plan?: string | null;
  playlist_id?: number | null;
  already_owned?: boolean;
};

const ITEM_NEONS: readonly CyberFrameAccent[] = ["cyan", "pink", "lime", "violet", "amber"];

function resolveCoverImage(item: UnlockedProgramItem): string {
  const direct = typeof item.image === "string" ? item.image.trim() : "";
  if (direct) return direct;
  const plan = typeof item.plan === "string" ? item.plan.trim() : "";
  if (plan) {
    const offer = resolvePlanOfferBySlug(plan as CheckoutOfferKey);
    if (offer?.imageSrc?.trim()) return offer.imageSrc.trim();
  }
  const byTitle = resolvePlanOfferByTitle(item.title);
  if (byTitle?.imageSrc?.trim()) return byTitle.imageSrc.trim();
  return "";
}

type ClaimProps = {
  sessionId: string;
  unlockedItems: UnlockedProgramItem[];
  amountPaid?: number | null;
  currency?: string;
  onClaimed: (nextUrl: string) => void;
};

type SendOtpPayload = {
  message?: string;
  error?: string;
  detail?: string;
  email?: string;
  mode?: "login" | "signup";
  already_owned_items?: UnlockedProgramItem[];
  claimable_items?: UnlockedProgramItem[];
};

type VerifyPayload = {
  message?: string;
  error?: string;
  detail?: string;
  token?: string;
  email?: string;
  redirect_url?: string;
  user?: { id: number; username: string; email: string };
  referral_ids?: {
    complete?: string;
    single?: string;
    pawn?: string;
    king?: string;
    exclusive?: string;
  };
  selected_plan?: string | null;
  playlist_id?: number | null;
};

function payloadError(data: { error?: string; detail?: string }, fallback: string): string {
  if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data.detail === "string" && data.detail.trim()) return data.detail.trim();
  return fallback;
}

async function postJson<T extends { error?: string; detail?: string }>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = resolveClientApiUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = {} as T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    const lower = text.trim().toLowerCase();
    if (lower.includes("<!doctype") || lower.includes("<html")) {
      data = {
        error:
          res.status === 404
            ? "Claim API route not found. Restart the Django server so new checkout claim endpoints load."
            : "Server returned an unexpected HTML response.",
      } as T;
    }
  }
  return { ok: res.ok, status: res.status, data };
}

function formatItemAmount(amount?: string): string | null {
  const raw = (amount || "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw.startsWith("$") ? raw : `$${raw}`;
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

export function CheckoutClaimForm({
  sessionId,
  unlockedItems,
  amountPaid,
  currency,
  onClaimed,
}: ClaimProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [displayItems, setDisplayItems] = useState<UnlockedProgramItem[]>(unlockedItems);

  const sendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter your email to continue.");
      return;
    }
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const { ok, data } = await postJson<SendOtpPayload>("/api/auth/checkout/claim/send-otp/", {
        session_id: sessionId,
        email: trimmed,
      });
      if (!ok) {
        throw new Error(payloadError(data, "Could not send verification code."));
      }
      const owned = Array.isArray(data.already_owned_items) ? data.already_owned_items : [];
      const claimable = Array.isArray(data.claimable_items) ? data.claimable_items : [];
      if (owned.length || claimable.length) {
        const merged = [
          ...claimable.map((row) => ({ ...row, already_owned: false as const })),
          ...owned.map((row) => ({ ...row, already_owned: true as const })),
        ].filter((row) => typeof row.title === "string" && row.title.trim());
        if (merged.length) setDisplayItems(merged);
      }
      setEmail(trimmed);
      setStep("otp");
      setInfo(data.message || "Verification code sent. Check your email to unlock access.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send verification code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.trim();
    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { ok, data } = await postJson<VerifyPayload>("/api/auth/checkout/claim/verify-otp/", {
        session_id: sessionId,
        email: email.trim().toLowerCase(),
        otp: code,
      });
      if (!ok) {
        throw new Error(payloadError(data, "Verification failed."));
      }
      const token = typeof data.token === "string" ? data.token.trim() : "";
      if (!token) {
        throw new Error("Verification succeeded but no session token was returned.");
      }
      const loginEmail = (data.user?.email || data.email || email).trim();
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
      persistSimpleAuthSession(token, {
        email: loginEmail,
        userId: data.user?.id,
        referralIds,
      });
      clearStreamPlaylistsCache();
      clearVaultPlaylistMapCache();
      markDashboardCheckoutReturn();
      clearUnlockCartStorage();
      try {
        window.sessionStorage.setItem("plan_checkout_confirmed", "1");
        window.sessionStorage.setItem("playlist_checkout_confirmed", "1");
      } catch {
        // Ignore storage exceptions.
      }
      window.dispatchEvent(new Event("plan-checkout-confirmed"));
      window.dispatchEvent(new Event("playlist-checkout-confirmed"));

      const planSlug =
        typeof data.selected_plan === "string" && data.selected_plan.trim()
          ? data.selected_plan.trim()
          : "";
      const nextPath = dashboardProgramsHref(
        planSlug
          ? { plan_checkout: "success", plan: planSlug }
          : { plan_checkout: "success" },
      );
      onClaimed(`${window.location.origin}${nextPath}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const headline =
    step === "email"
      ? "Payment successful. Enter your email to unlock access."
      : "Enter the verification code we sent to your email.";
  const fieldLabel = step === "email" ? "Email" : "Verification code";

  return (
    <div className="relative mx-auto flex w-full max-w-[min(100%,56rem)] flex-col gap-6 px-1 sm:gap-8 sm:px-0">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.5rem]">
        <div className="absolute left-[-18%] top-[-10%] h-[220px] w-[220px] rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute right-[-14%] top-[12%] h-[240px] w-[240px] rounded-full bg-violet-500/16 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[30%] h-[200px] w-[200px] rounded-full bg-amber-400/12 blur-3xl" />
      </div>

      <CyberChamferFrame
        accent="hero"
        chamfer={22}
        className="w-full"
        innerClassName="cyber-frame-mobile-pad p-6 sm:p-9 lg:p-11"
      >
        <div className="relative z-[1] mx-auto flex w-full max-w-xl flex-col items-center text-center">
          <p
            className={cn(
              publicHeadingLightning("cyan"),
              "font-mono text-[10px] font-bold uppercase tracking-[0.28em] sm:text-xs",
            )}
          >
            Checkout confirmed
          </p>
          <h2
            className={cn(
              publicHeadingLightning("amber"),
              "mt-3 text-[clamp(1.35rem,3.6vw,2.35rem)] font-black uppercase leading-[1.05] tracking-[0.06em]",
            )}
          >
            {headline}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-100/85 sm:text-base">
            {step === "email"
              ? "We will send a one-time code to this inbox so your unlock attaches to the right account."
              : `Code sent to ${email}. Paste it below to open your vault.`}
          </p>

          <div className="mt-7 flex w-full flex-col items-center gap-4">
            <label className="flex w-full max-w-[20rem] flex-col items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/95">
                {fieldLabel}
              </span>
              {step === "email" ? (
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "box-border h-12 w-full rounded-md border-2 border-cyan-400/55 bg-[linear-gradient(180deg,rgba(6,12,20,0.96),rgba(2,6,12,0.99))] px-3 text-center text-sm text-white outline-none transition placeholder:text-white/35",
                    "hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]",
                    "focus-visible:border-cyan-200 focus-visible:shadow-[0_0_28px_rgba(34,211,238,0.45)]",
                    "sm:h-[3.25rem] sm:text-base",
                  )}
                  placeholder="you@email.com"
                  disabled={busy}
                />
              ) : (
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={cn(
                    "box-border h-12 w-full rounded-md border-2 border-cyan-400/55 bg-[linear-gradient(180deg,rgba(6,12,20,0.96),rgba(2,6,12,0.99))] px-3 text-center font-mono text-lg tracking-[0.35em] text-white outline-none transition placeholder:text-white/35",
                    "hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]",
                    "focus-visible:border-cyan-200 focus-visible:shadow-[0_0_28px_rgba(34,211,238,0.45)]",
                    "sm:h-[3.25rem]",
                  )}
                  placeholder="······"
                  disabled={busy}
                />
              )}
            </label>

            {step === "otp" ? (
              <button
                type="button"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-300 transition hover:text-fuchsia-100 hover:[text-shadow:0_0_12px_rgba(232,121,249,0.65)]"
                disabled={busy}
                onClick={() => void sendOtp()}
              >
                Resend code
              </button>
            ) : null}

            {info ? (
              <CyberInsetPanel variant="cyan" className="w-full max-w-md text-left">
                <p className="font-mono text-xs leading-relaxed text-emerald-100 sm:text-sm">{info}</p>
              </CyberInsetPanel>
            ) : null}
            {error ? (
              <CyberInsetPanel variant="blood" className="w-full max-w-md text-left">
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-rose-100">{error}</p>
              </CyberInsetPanel>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void (step === "email" ? sendOtp() : verifyOtp())}
              className={cn(
                "method-cta-btn method-cta-btn--join mt-1 inline-flex h-12 w-full max-w-[20rem] items-center justify-center px-4 font-mono text-[11px] font-black uppercase tracking-[0.14em]",
                "sm:h-[3.25rem] sm:text-xs",
                busy && "cursor-wait opacity-70",
              )}
            >
              {busy ? "Please wait…" : step === "email" ? "Send code" : "Verify & unlock"}
            </button>
          </div>
        </div>
      </CyberChamferFrame>

      <CyberChamferFrame
        accent="amber"
        chamfer={18}
        decorSize="compact"
        className="w-full"
        innerClassName="cyber-frame-mobile-pad p-5 sm:p-7 lg:p-8"
      >
        <div className="relative z-[1] space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div className="min-w-0 text-left">
              <p
                className={cn(
                  publicHeadingLightning("amber"),
                  "font-mono text-[10px] font-bold uppercase tracking-[0.24em]",
                )}
              >
                The Syndicate
              </p>
              <h3
                className={cn(
                  publicHeadingLightning("gold"),
                  "mt-1 text-[clamp(1.25rem,3.2vw,2rem)] font-black uppercase tracking-[0.08em]",
                )}
              >
                Programs unlocked
              </h3>
            </div>
            {amountPaid != null && Number.isFinite(amountPaid) ? (
              <p className="shrink-0 font-mono text-sm font-bold uppercase tracking-[0.12em] text-cyan-200 sm:text-base">
                Paid {currency?.toUpperCase() || "USD"} {amountPaid.toFixed(2)}
              </p>
            ) : null}
          </div>

          <ul className="max-h-[min(62vh,42rem)] space-y-4 overflow-y-auto pr-0.5">
            {displayItems.map((item, index) => {
              const price = formatItemAmount(item.amount);
              const accent = ITEM_NEONS[index % ITEM_NEONS.length];
              const cover = resolveCoverImage(item);
              const alreadyOwned = Boolean(item.already_owned);
              return (
                <li key={`${item.title}-${index}`}>
                  <CyberChamferFrame
                    accent={accent}
                    chamfer={14}
                    decorSize="compact"
                    className={cn("w-full", alreadyOwned && "opacity-75")}
                    innerClassName="!p-0"
                    contentClassName="!p-0"
                  >
                    <div className="grid gap-0 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]">
                      <div className="relative aspect-square w-full overflow-hidden bg-black/70 sm:aspect-auto sm:min-h-[9.5rem]">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[9.5rem] w-full items-center justify-center bg-gradient-to-br from-cyan-500/20 via-violet-500/10 to-transparent px-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/55">
                            Syndicate
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col justify-center gap-2.5 px-4 py-4 text-left sm:px-5 sm:py-5">
                        <p className="text-base font-semibold leading-snug text-white sm:text-lg">
                          {item.title}
                        </p>
                        <span
                          className={cn(
                            "inline-flex w-fit rounded-md border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
                            alreadyOwned
                              ? "border-emerald-400/40 bg-emerald-950/40 text-emerald-200/90"
                              : "border-cyan-400/45 bg-cyan-950/35 text-cyan-100",
                          )}
                        >
                          {alreadyOwned ? "Already owned" : "Lifetime unlock"}
                        </span>
                        {price && !alreadyOwned ? (
                          <p className="font-mono text-sm font-bold text-amber-200">{price}</p>
                        ) : null}
                      </div>
                    </div>
                  </CyberChamferFrame>
                </li>
              );
            })}
          </ul>
        </div>
      </CyberChamferFrame>
    </div>
  );
}
