"use client";

import { useState } from "react";
import { CyberChamferFrame, type CyberFrameAccent } from "@/components/cyber/CyberChamferFrames";
import { persistSimpleAuthSession, resolveClientApiUrl } from "@/lib/portal-api";
import { clearStreamPlaylistsCache } from "@/lib/streaming-api";
import { clearVaultPlaylistMapCache } from "@/lib/vaultPlaylistMap";
import { markDashboardCheckoutReturn } from "@/lib/dashboardShellScroll";
import {
  clearUnlockCartStorage,
  resolvePlanOfferBySlug,
  resolvePlanOfferByTitle,
} from "@/lib/unlockCart";
import type { CheckoutOfferKey } from "@/components/programs/planOfferCatalog";
import { cn } from "@/components/dashboard/dashboardPrimitives";

const COVER_PX = 165;

export type UnlockedProgramItem = {
  title: string;
  image?: string;
  amount?: string;
  plan?: string | null;
  playlist_id?: number | null;
  already_owned?: boolean;
};

const ITEM_NEONS: readonly CyberFrameAccent[] = ["cyan", "pink", "lime", "violet", "amber"];

const ITEM_NEON_COPY: Record<
  CyberFrameAccent,
  { price: string; badge: string; imageBorder: string; placeholder: string; card: string }
> = {
  cyan: {
    price: "text-cyan-200",
    badge: "text-cyan-200 border-cyan-400/55 bg-cyan-950/45",
    imageBorder: "border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.45)]",
    placeholder: "from-cyan-500/25 via-sky-500/10 to-transparent",
    card: "border-cyan-400/65 bg-cyan-950/25 shadow-[0_0_22px_rgba(34,211,238,0.22)]",
  },
  pink: {
    price: "text-pink-200",
    badge: "text-pink-200 border-pink-400/55 bg-pink-950/45",
    imageBorder: "border-pink-300/70 shadow-[0_0_16px_rgba(244,114,182,0.45)]",
    placeholder: "from-pink-500/25 via-fuchsia-500/10 to-transparent",
    card: "border-pink-400/65 bg-pink-950/25 shadow-[0_0_22px_rgba(244,114,182,0.22)]",
  },
  lime: {
    price: "text-lime-200",
    badge: "text-lime-200 border-lime-400/55 bg-lime-950/40",
    imageBorder: "border-lime-300/70 shadow-[0_0_16px_rgba(163,230,53,0.4)]",
    placeholder: "from-lime-500/25 via-green-500/10 to-transparent",
    card: "border-lime-400/65 bg-lime-950/20 shadow-[0_0_22px_rgba(163,230,53,0.2)]",
  },
  violet: {
    price: "text-fuchsia-200",
    badge: "text-fuchsia-200 border-fuchsia-400/55 bg-fuchsia-950/45",
    imageBorder: "border-fuchsia-300/70 shadow-[0_0_16px_rgba(217,70,239,0.45)]",
    placeholder: "from-fuchsia-500/25 via-violet-500/10 to-transparent",
    card: "border-fuchsia-400/65 bg-fuchsia-950/25 shadow-[0_0_22px_rgba(217,70,239,0.22)]",
  },
  amber: {
    price: "text-amber-200",
    badge: "text-amber-200 border-amber-400/55 bg-amber-950/45",
    imageBorder: "border-amber-300/70 shadow-[0_0_16px_rgba(250,204,21,0.4)]",
    placeholder: "from-amber-500/25 to-transparent",
    card: "border-amber-400/65 bg-amber-950/25 shadow-[0_0_22px_rgba(250,204,21,0.2)]",
  },
  hero: {
    price: "text-cyan-200",
    badge: "text-violet-200 border-violet-400/55 bg-violet-950/45",
    imageBorder: "border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.35)]",
    placeholder: "from-cyan-500/20 via-violet-500/10 to-transparent",
    card: "border-cyan-400/55 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.18)]",
  },
  video: {
    price: "text-sky-200",
    badge: "text-sky-200 border-sky-400/55 bg-sky-950/45",
    imageBorder: "border-sky-300/70 shadow-[0_0_16px_rgba(56,189,248,0.4)]",
    placeholder: "from-sky-500/25 to-transparent",
    card: "border-sky-400/65 bg-sky-950/25 shadow-[0_0_22px_rgba(56,189,248,0.2)]",
  },
  separator: {
    price: "text-amber-200",
    badge: "text-amber-200 border-amber-400/55 bg-amber-950/45",
    imageBorder: "border-amber-300/70 shadow-[0_0_16px_rgba(250,204,21,0.35)]",
    placeholder: "from-amber-500/25 to-transparent",
    card: "border-amber-400/65 bg-amber-950/25 shadow-[0_0_22px_rgba(250,204,21,0.2)]",
  },
};

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
      setInfo(data.message || "Verification code sent. Check your email.");
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

      let nextUrl = "/dashboard/programs";
      if (typeof data.selected_plan === "string" && data.selected_plan.trim()) {
        nextUrl = `/dashboard/programs&plan_checkout=success&plan=${encodeURIComponent(data.selected_plan.trim())}`;
      }
      if (nextUrl.startsWith("/")) {
        nextUrl = `${window.location.origin}${nextUrl}`;
      }
      onClaimed(nextUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const controlClass = cn(
    "box-border rounded-md border-2 bg-[linear-gradient(180deg,rgba(6,12,20,0.96),rgba(2,6,12,0.99))] outline-none transition duration-200",
    "hover:-translate-y-0.5 hover:brightness-110",
    "focus-visible:brightness-110 focus-visible:shadow-[0_0_28px_rgba(34,211,238,0.45)]",
  );

  return (
    <div className="mt-4 flex w-full flex-col items-center gap-8 sm:mt-6 sm:gap-10">
      {/* Container 1 — SUCCESS-area claim block (taller) */}
      <CyberChamferFrame
        accent="cyan"
        chamfer={22}
        ringPaddingClass="p-[3px]"
        className="w-full max-w-[572px]"
        contentClassName="!p-0"
      >
        <div className="relative z-[1] flex min-h-[352px] flex-col items-center justify-center gap-7 px-8 py-14 text-center sm:min-h-[396px] sm:px-11 sm:py-[4.4rem]">
          <p className="max-w-[31rem] text-lg font-semibold leading-snug text-amber-100 [text-shadow:0_0_18px_rgba(251,191,36,0.28)] sm:text-xl md:text-2xl">
            Payment successful. Enter your email to unlock access.
          </p>

          <div className="flex w-full flex-col items-center gap-4">
            {step === "email" ? (
              <label className="flex flex-col items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    controlClass,
                    "px-3 text-center text-sm text-white placeholder:text-white/35 sm:text-base",
                    "border-cyan-400/60 hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.4)]",
                    "focus:border-cyan-200",
                  )}
                  style={{ width: 220, height: 52, maxWidth: "100%" }}
                  placeholder="you@email.com"
                  disabled={busy}
                />
              </label>
            ) : (
              <label className="flex flex-col items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Verification code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className={cn(
                    controlClass,
                    "px-3 text-center font-mono text-lg tracking-[0.35em] text-white placeholder:text-white/35",
                    "border-cyan-400/60 hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.4)]",
                    "focus:border-cyan-200",
                  )}
                  style={{ width: 220, height: 52, maxWidth: "100%" }}
                  placeholder="······"
                  disabled={busy}
                />
                <button
                  type="button"
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-300 transition hover:text-fuchsia-100 hover:[text-shadow:0_0_12px_rgba(232,121,249,0.65)]"
                  disabled={busy}
                  onClick={() => void sendOtp()}
                >
                  Resend code
                </button>
              </label>
            )}

            {info ? (
              <p className="max-w-md rounded-md border border-emerald-400/45 bg-emerald-950/30 px-4 py-2.5 font-mono text-xs text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.12)]">
                {info}
              </p>
            ) : null}
            {error ? (
              <p className="max-w-sm rounded-md border border-rose-500/40 bg-rose-950/30 px-3 py-2 font-mono text-xs uppercase tracking-[0.08em] text-rose-100">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void (step === "email" ? sendOtp() : verifyOtp())}
              className={cn(
                controlClass,
                "flex items-center justify-center px-3 font-mono text-[11px] font-black uppercase tracking-[0.1em] text-amber-50",
                "border-amber-300/75 bg-[linear-gradient(135deg,rgba(245,158,11,0.35),rgba(76,45,5,0.96))]",
                "hover:border-amber-200 hover:shadow-[0_0_32px_rgba(245,158,11,0.55)] hover:saturate-125",
                "active:translate-y-0 active:scale-[0.98]",
                busy && "cursor-wait opacity-70 hover:translate-y-0",
              )}
              style={{ width: 220, height: 52, maxWidth: "100%" }}
            >
              {busy ? "Please wait…" : step === "email" ? "Send code" : "Verify"}
            </button>
          </div>
        </div>
      </CyberChamferFrame>

      {/* Container 2 — unlocked items */}
      <CyberChamferFrame
        accent="amber"
        chamfer={16}
        decorSize="compact"
        ringPaddingClass="p-[3px]"
        className="w-[92vw] max-w-[92vw] sm:w-[72vw] sm:max-w-[72vw]"
        contentClassName="!p-0"
      >
        <div className="relative z-[1] space-y-5 px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200/95">
                The Syndicate
              </p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-[0.08em] text-white sm:text-2xl">
                Programs unlocked
              </h2>
            </div>
            {amountPaid != null && Number.isFinite(amountPaid) ? (
              <p className="shrink-0 font-mono text-sm font-bold uppercase tracking-[0.12em] text-cyan-200 sm:text-base">
                Paid {currency?.toUpperCase() || "USD"} {amountPaid.toFixed(2)}
              </p>
            ) : null}
          </div>

          <ul className="max-h-[min(59.4vh,39.6rem)] space-y-4 overflow-y-auto pr-0.5">
            {displayItems.map((item, index) => {
              const price = formatItemAmount(item.amount);
              const accent = ITEM_NEONS[index % ITEM_NEONS.length];
              const neon = ITEM_NEON_COPY[accent];
              const cover = resolveCoverImage(item);
              const alreadyOwned = Boolean(item.already_owned);
              return (
                <li
                  key={`${item.title}-${index}`}
                  className={cn(
                    "grid items-center gap-5 rounded-xl border-2 p-5 sm:p-[1.375rem]",
                    neon.card,
                    alreadyOwned && "opacity-70",
                  )}
                  style={{ gridTemplateColumns: `${COVER_PX}px minmax(0, 1fr)` }}
                >
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-lg border-2 bg-black/70",
                      neon.imageBorder,
                    )}
                    style={{ width: COVER_PX, height: COVER_PX, minWidth: COVER_PX, minHeight: COVER_PX }}
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt=""
                        width={COVER_PX}
                        height={COVER_PX}
                        className="block object-cover"
                        style={{ width: COVER_PX, height: COVER_PX }}
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-full w-full items-center justify-center bg-gradient-to-br px-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/55",
                          neon.placeholder,
                        )}
                      >
                        Syndicate
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col justify-center gap-2.5 pr-2">
                    <p className="text-base font-semibold leading-snug text-white sm:text-lg">
                      {item.title}
                    </p>
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-md border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]",
                        alreadyOwned
                          ? "border-emerald-400/40 bg-emerald-950/40 text-emerald-200/90"
                          : neon.badge,
                      )}
                    >
                      {alreadyOwned ? "Already owned" : "Lifetime unlock"}
                    </span>
                    {price && !alreadyOwned ? (
                      <p className={cn("font-mono text-sm font-bold", neon.price)}>{price}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CyberChamferFrame>
    </div>
  );
}
