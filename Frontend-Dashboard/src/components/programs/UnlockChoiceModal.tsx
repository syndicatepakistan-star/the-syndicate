"use client";

import { createPortal } from "react-dom";
import { Lock, ShoppingBag, Sparkles, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import type { PlanOfferDef } from "@/components/programs/planOfferCatalog";
import {
  VAULT_MODAL_BODY_CLASS,
  VAULT_MODAL_OVERLAY_CLASS,
  VAULT_MODAL_PANEL_CLASS,
  VAULT_MODAL_TOP_BAR_CLASS,
} from "@/components/programs/ReadMoreText";
import { findPackOfferForModule, type UnlockChoiceTarget } from "@/lib/unlockCart";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";
import { formatPrice } from "@/lib/currency";

type Props = {
  target: UnlockChoiceTarget | null;
  busy?: boolean;
  onClose: () => void;
  onUnlockThisOnly: () => void;
  onAddMore: () => void;
  onUnlockPack?: (offer: PlanOfferDef) => void;
};

export function UnlockChoiceModal({
  target,
  busy = false,
  onClose,
  onUnlockThisOnly,
  onAddMore,
  onUnlockPack,
}: Props) {
  useModalScrollLock(!!target);

  if (!target || typeof document === "undefined") return null;

  const isPlan = target.kind === "plan";
  const title = isPlan ? target.offer.title : target.title.trim() || target.playlist.title;
  const displayPrice = isPlan ? target.offer.displayPrice : formatPrice(String(target.playlist.price ?? "0"));
  const teaser = isPlan ? target.offer.teaser : target.teaser ?? "Level 1 program playlist access.";
  const accent = isPlan ? target.offer.accent : "cyan";
  const packOffer = isPlan ? findPackOfferForModule(target.offer) : null;

  const accentBorder =
    accent === "cyan"
      ? "border-cyan-300/55 shadow-[0_0_48px_rgba(34,211,238,0.22)]"
      : accent === "pink"
        ? "border-fuchsia-300/55 shadow-[0_0_48px_rgba(217,70,239,0.22)]"
        : accent === "green"
          ? "border-emerald-300/55 shadow-[0_0_48px_rgba(16,185,129,0.22)]"
          : "border-amber-300/55 shadow-[0_0_48px_rgba(245,158,11,0.24)]";

  return createPortal(
    <div className={VAULT_MODAL_OVERLAY_CLASS} role="dialog" aria-modal="true" aria-labelledby="unlock-choice-title">
      <div
        className={cn(
          VAULT_MODAL_PANEL_CLASS,
          accentBorder,
          "max-w-[min(96vw,34rem)]"
        )}
      >
        <div className={cn(VAULT_MODAL_TOP_BAR_CLASS, "flex items-start justify-between gap-3")}>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/80">Unlock protocol</p>
            <h2 id="unlock-choice-title" className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-white sm:text-xl">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/72">
              Unlock this program now, or add more to your unlock bucket and pay once at checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 bg-black/50 text-white/70 transition hover:border-white/35 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn(VAULT_MODAL_BODY_CLASS, "space-y-4")}>
          <div className="rounded-xl border border-white/10 bg-black/45 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-white/55">Selected program</span>
              <span className="rounded-md border border-cyan-300/35 bg-cyan-950/30 px-2.5 py-1 font-mono text-sm font-black text-cyan-100">
                {displayPrice}
              </span>
            </div>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-white/62">{teaser}</p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onUnlockThisOnly}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 font-mono text-xs font-black uppercase tracking-[0.14em] transition",
              "border-amber-300/70 bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(76,45,5,0.92))] text-amber-100",
              "shadow-[0_0_24px_rgba(245,158,11,0.28)] hover:shadow-[0_0_36px_rgba(245,158,11,0.42)]",
              busy && "cursor-wait opacity-70"
            )}
          >
            <Lock className="h-4 w-4" />
            {busy ? "Opening checkout…" : "Unlock this only"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onAddMore}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 font-mono text-xs font-black uppercase tracking-[0.14em] transition",
              "border-cyan-300/55 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(6,26,42,0.95))] text-cyan-100",
              "shadow-[0_0_22px_rgba(34,211,238,0.2)] hover:shadow-[0_0_34px_rgba(34,211,238,0.34)]",
              busy && "cursor-wait opacity-70"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            Add more — build unlock bucket
          </button>

          {packOffer && onUnlockPack ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onUnlockPack(packOffer)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.13em] transition",
                "border-fuchsia-300/40 bg-fuchsia-950/20 text-fuchsia-100/92 hover:border-fuchsia-300/60 hover:bg-fuchsia-950/30",
                busy && "cursor-wait opacity-70"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Full vault pack — {packOffer.displayPrice}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
