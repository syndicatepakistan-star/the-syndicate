"use client";



import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { prefetchMarketingRoutes } from "@/lib/marketing-nav-routes";

import { scheduleMarketingMediaWarmup } from "@/lib/mediaWarmCache";



function runWhenIdle(task: () => void, timeout = 3000): void {

  const ric = window.requestIdleCallback;

  if (ric) {

    ric(task, { timeout });

    return;

  }

  window.setTimeout(task, 200);

}



/** Prefetch marketing routes + warm shared media after critical paint. */

export default function RouteWarmup() {

  const router = useRouter();



  useEffect(() => {

    scheduleMarketingMediaWarmup();



    runWhenIdle(() => {

      prefetchMarketingRoutes(router);

    }, 3500);

  }, [router]);



  return null;

}


