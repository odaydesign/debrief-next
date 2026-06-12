"use client";

import { useEffect } from "react";

// Registers the (handler-free) service worker — PWA groundwork for the
// upcoming push-notification phase. Production only.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* registration is best-effort */
    });
  }, []);
  return null;
}
