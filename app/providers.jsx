"use client";

import { AuthProvider } from "@/lib/AuthContext";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

// App-wide client providers. Data now lives in Firestore (see lib/db.js), which
// reads Firebase Auth state directly, so the only global provider we need is
// AuthProvider (anonymous-by-default identity + Google upgrade).
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ServiceWorkerRegistrar />
      {children}
    </AuthProvider>
  );
}
