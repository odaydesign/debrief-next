"use client";

import { useCallback, useMemo } from "react";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import { AuthProvider, useAuthContext } from "@/lib/AuthContext";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Adapter: maps Firebase auth state to the shape ConvexProviderWithAuth expects.
// fetchAccessToken returns the Firebase ID token (uid in its `sub` claim), which
// Convex validates against the issuer in convex/auth.config.ts.
function useConvexAuthFromFirebase() {
  const { user, loading } = useAuthContext();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      if (!user) return null;
      try {
        return await user.getIdToken(forceRefreshToken);
      } catch {
        return null;
      }
    },
    [user]
  );

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, user, fetchAccessToken]
  );
}

export function ConvexClientProvider({ children }) {
  // AuthProvider is outermost so its state is available to the Convex auth
  // adapter above and to MainContext deeper in the tree.
  return (
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuthFromFirebase}>
        {children}
      </ConvexProviderWithAuth>
    </AuthProvider>
  );
}
