"use client";

import { useState } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUnlockActivation } from "@/components/programs/UnlockActivationContext";
import {
  LEVEL1_CATEGORY_PACKS,
  type Level1CategoryPackKey,
} from "@/lib/level1CategoryPacks";
import {
  lazyStartPlanCheckout,
  lazyToastError,
  lazyToastSuccess,
} from "@/lib/lazyUnlockCheckout";

type Level1CategoryUnlockAllButtonProps = {
  category: Level1CategoryPackKey;
  /** Compact layout under split (mobile) headings. */
  compact?: boolean;
  className?: string;
  /** Hide when the buyer already owns every program in the category. */
  alreadyUnlocked?: boolean;
  postAuthNext?: string;
  onUnlocked?: () => void | Promise<void>;
};

export function Level1CategoryUnlockAllButton({
  category,
  compact = false,
  className,
  alreadyUnlocked = false,
  postAuthNext = "/programs",
  onUnlocked,
}: Level1CategoryUnlockAllButtonProps) {
  const pack = LEVEL1_CATEGORY_PACKS[category];
  const { formatPrice } = useCurrency();
  const { ensureUnlockReady } = useUnlockActivation();
  const [busy, setBusy] = useState(false);

  if (alreadyUnlocked) return null;

  const unlockLabel = formatPrice(pack.unlockAllUsd);
  const separateLabel = formatPrice(pack.separateTotalUsd);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await ensureUnlockReady();
      const result = await lazyStartPlanCheckout({
        plan: pack.plan,
        billing: "monthly",
        amount: pack.checkoutAmount,
        postAuthNext,
      });
      if (result.status === "checkout" || result.status === "auth_required") return;
      if (result.status === "already_unlocked") {
        await lazyToastSuccess(
          result.message || `Already purchased — all ${pack.shortLabel} programs`,
          { icon: "✓", duration: 3200 },
        );
        await onUnlocked?.();
        return;
      }
      if (result.status === "error") {
        // Technical not-found messages are suppressed inside lazyToastError.
        await lazyToastError(result.message);
        await onUnlocked?.();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start checkout.";
      await lazyToastError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-col items-center gap-1.5", className)}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleClick()}
        className={cn(
          "hero-hamburger-pulse level1-unlock-all-btn",
          "inline-flex items-center justify-center rounded-lg border border-amber-300/70 bg-black/80",
          "font-mono font-black uppercase tracking-[0.14em] text-amber-100",
          "shadow-[0_0_16px_rgba(251,191,36,0.35)]",
          "transition hover:border-amber-200 hover:bg-black hover:text-amber-50",
          "disabled:cursor-wait disabled:opacity-70",
          compact
            ? "min-h-[36px] px-3 py-1.5 text-[10px] sm:min-h-[40px] sm:px-4 sm:text-[11px]"
            : "min-h-[44px] px-5 py-2.5 text-[12px] sm:min-h-[48px] sm:px-6 sm:text-[13px]",
        )}
        aria-label={`${pack.buttonLead} ${unlockLabel} (${separateLabel} if bought separately)`}
      >
        {busy ? "Opening…" : "Unlock All"}
      </button>
      <p
        className={cn(
          "max-w-[22rem] text-center font-mono font-normal normal-case tracking-normal text-white/80",
          compact
            ? "text-[11px] leading-snug sm:text-[12px] md:text-[13px]"
            : "text-[13px] leading-snug sm:text-[14px] md:text-[15px]",
        )}
      >
        {pack.buttonLead}{" "}
        <span className="whitespace-nowrap font-semibold text-amber-200">{unlockLabel}</span>
        <span className="block text-white/55">
          ({separateLabel} if bought separately)
        </span>
      </p>
    </div>
  );
}
