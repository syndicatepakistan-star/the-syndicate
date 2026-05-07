"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export type ArticleReaderState =
  | null
  | { kind: "pdf"; title: string; blobUrl: string }
  | { kind: "web"; title: string; url: string };

type Props = {
  state: ArticleReaderState;
  onClose: () => void;
};

export function MembershipArticleReader({ state, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (state) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onClose]);

  return (
    <AnimatePresence>
      {state ? (
        <motion.div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Article reader"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[rgba(250,204,21,0.38)] bg-[#070707] shadow-[0_0_80px_rgba(250,204,21,0.12)] sm:h-[min(92vh,900px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
              <div className="min-w-0 line-clamp-2 text-[12px] font-bold leading-snug text-white/92 sm:text-[13px]">{state.title}</div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/75 transition hover:border-[rgba(250,204,21,0.45)] hover:text-[color:var(--gold-neon)] sm:px-3 sm:py-1.5 sm:text-[10px]"
              >
                Close
              </button>
            </div>
            {state.kind === "web" ? (
              <p className="shrink-0 border-b border-white/8 px-3 py-2 text-[10px] leading-relaxed text-white/45 sm:px-4 sm:text-[11px]">
                Reading inside the dashboard. Some publishers block embedding; if the frame stays blank, their site only allows opening in a new window.
              </p>
            ) : null}
            <div className="relative min-h-0 flex-1 bg-black">
              {state.kind === "pdf" ? (
                <iframe
                  title={state.title}
                  src={state.blobUrl}
                  className="h-full w-full min-h-[60vh] border-0"
                />
              ) : (
                <iframe
                  title={state.title}
                  src={state.url}
                  className="h-full w-full min-h-[60vh] border-0"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
