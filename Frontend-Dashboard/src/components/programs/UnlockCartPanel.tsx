"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Lock, ShoppingBag, Trash2, X } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { CyberChamferFrame, type CyberFrameAccent } from "@/components/cyber/CyberChamferFrames";
import { useUnlockCart } from "@/components/programs/UnlockCartContext";
import { cartItemKey } from "@/lib/unlockCart";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

type Props = {
  busy?: boolean;
  error?: string | null;
  onCheckout: () => void;
};

const ITEM_ACCENTS: readonly CyberFrameAccent[] = ["cyan", "pink", "lime", "violet"];

export function UnlockCartPanel({ busy = false, error = null, onCheckout }: Props) {
  const {
    items,
    count,
    totalLabel,
    removeByKey,
    clearCart,
    selectionMode,
    panelExpanded,
    setPanelExpanded,
    checkoutPulse,
  } = useUnlockCart();
  const { localizeLabel } = useCurrency();
  const panelRef = useRef<HTMLDivElement>(null);

  useModalScrollLock(panelExpanded && count > 0);

  useEffect(() => {
    if (checkoutPulse) setPanelExpanded(true);
  }, [checkoutPulse, setPanelExpanded]);

  useEffect(() => {
    if (!panelExpanded) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !panelRef.current) return;
      if (panelRef.current.contains(target)) return;
      setPanelExpanded(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelExpanded(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelExpanded, setPanelExpanded]);

  if (!count && !selectionMode) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {panelExpanded ? (
        <button
          type="button"
          aria-label="Minimize unlock bucket"
          className="fixed inset-0 z-[119] cursor-default bg-black/45 backdrop-blur-[2px]"
          onClick={() => setPanelExpanded(false)}
        />
      ) : null}

      <div
        ref={panelRef}
        className={cn(
          "fixed bottom-3 left-1/2 z-[120] w-[min(98vw,56rem)] -translate-x-1/2 transition-shadow duration-500 sm:bottom-5",
          "rounded-2xl border-2 bg-[#04060d]/97 backdrop-blur-md",
          checkoutPulse
            ? "border-amber-300/80 shadow-[0_0_56px_rgba(245,158,11,0.45),0_18px_40px_rgba(0,0,0,0.55)]"
            : "border-cyan-300/55 shadow-[0_0_48px_rgba(34,211,238,0.28),0_18px_40px_rgba(0,0,0,0.55)]",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-cyan-100 sm:h-12 sm:w-12",
              checkoutPulse
                ? "border-amber-300/55 bg-amber-950/35 text-amber-100"
                : "border-cyan-300/40 bg-cyan-950/30",
            )}
          >
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/85 sm:text-[11px]">
              Unlock bucket
            </p>
            <p className="truncate text-base font-semibold text-white sm:text-lg">
              {count} program{count === 1 ? "" : "s"} · {totalLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelExpanded(!panelExpanded)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 text-white/75 transition hover:border-white/35 hover:text-white"
            aria-label={panelExpanded ? "Collapse unlock bucket" : "Expand unlock bucket"}
          >
            {panelExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            disabled={busy || count === 0}
            onClick={onCheckout}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border-2 border-amber-300/70 px-3.5 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 sm:px-5 sm:text-xs",
              "bg-[linear-gradient(135deg,rgba(245,158,11,0.22),rgba(76,45,5,0.92))] shadow-[0_0_20px_rgba(245,158,11,0.24)]",
              checkoutPulse && "ring-2 ring-amber-300/70 ring-offset-2 ring-offset-[#04060d]",
              "disabled:cursor-not-allowed disabled:opacity-55",
            )}
          >
            <Lock className="h-3.5 w-3.5" />
            {busy ? "Checkout…" : "Checkout"}
          </button>
        </div>

        {panelExpanded ? (
          <div className="border-t border-white/10 px-4 py-4 sm:px-6 sm:py-5">
            <ul className="max-h-[min(62vh,38rem)] space-y-3 overflow-y-auto pr-1 sm:space-y-4">
              {items.map((item, index) => {
                const accent = ITEM_ACCENTS[index % ITEM_ACCENTS.length];
                return (
                  <li key={cartItemKey(item)}>
                    <CyberChamferFrame
                      accent={accent}
                      chamfer={14}
                      decorSize="compact"
                      ringPaddingClass="p-[3px]"
                      className="w-full"
                      innerClassName="p-3.5 sm:p-4"
                    >
                      <div className="relative z-[1] flex items-center gap-4 sm:gap-5">
                        <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-black/55 sm:h-[150px] sm:w-[150px]">
                          {item.imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageSrc}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 py-1">
                          <p className="line-clamp-3 text-sm font-semibold leading-snug text-white sm:text-base">
                            {item.title}
                          </p>
                          <p className="mt-2 font-mono text-xs text-cyan-200/85 sm:text-sm">
                            {localizeLabel(item.displayPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeByKey(cartItemKey(item))}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-rose-400/40 bg-rose-950/25 text-rose-200/90 transition hover:border-rose-300/60 hover:text-rose-100"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CyberChamferFrame>
                  </li>
                );
              })}
            </ul>
            {error ? (
              <p className="mt-3 rounded-md border border-rose-500/35 bg-rose-950/25 px-3 py-2 text-xs text-rose-100">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 transition hover:text-white/80 sm:text-[11px]"
              >
                Clear bucket
              </button>
              <button
                type="button"
                onClick={() => setPanelExpanded(false)}
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 transition hover:text-white/85 sm:text-[11px]"
              >
                <X className="h-3 w-3" />
                Minimize
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>,
    document.body,
  );
}
