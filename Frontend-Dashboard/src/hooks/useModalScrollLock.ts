"use client";

import { useEffect } from "react";
import { lockModalScroll } from "@/lib/modalScrollLock";

/** Lock document body scroll while `active` is true (safe for nested modals). */
export function useModalScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return lockModalScroll();
  }, [active]);
}
