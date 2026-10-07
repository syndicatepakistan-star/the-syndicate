"use client";

import { useEffect } from "react";

/** Registers device cache worker late — never competes with first-load LCP/TBT. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* optional — site still works without SW */
      });
    };

    const path = window.location.pathname || "";
    const isHome = path === "/" || path === "";
    const isMarketingHeavy =
      isHome || path === "/programs" || path.startsWith("/programs/") || path === "/quiz" || path.startsWith("/quiz/");
    const delayMs = isMarketingHeavy ? 12000 : 4000;

    let idleId: number | undefined;
    const timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(register, { timeout: 3000 });
      } else {
        register();
      }
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}
