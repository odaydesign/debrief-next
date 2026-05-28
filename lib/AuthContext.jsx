"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInAnonymously,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
} from "firebase/auth";

/**
 * Auth model: no login wall. Every visitor is signed in *anonymously* on first
 * load, so their notes / bookmarks / read-state are scoped to a real, stable
 * Firebase uid. They can optionally "Sign in with Google" to upgrade that
 * anonymous account (keeping the same uid + data) and persist across devices.
 *
 * A single provider owns the one onAuthStateChanged listener so both
 * MainContext (uid for Convex args) and the Convex auth adapter (ID token)
 * read identical state.
 */
const AuthContext = createContext(null);

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        // No session yet — create an anonymous one.
        try {
          await signInAnonymously(auth);
          // onAuthStateChanged fires again with the new user.
        } catch (e) {
          console.error("Anonymous sign-in failed:", e);
          setLoading(false);
        }
      }
    });
    return unsub;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const current = auth.currentUser;
    try {
      if (current?.isAnonymous) {
        // Upgrade the anonymous account → Google, preserving uid + data.
        await linkWithPopup(current, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e) {
      // That Google account already exists as its own user — just sign in.
      if (
        e.code === "auth/credential-already-in-use" ||
        e.code === "auth/email-already-in-use"
      ) {
        await signInWithPopup(auth, provider);
      } else if (
        e.code !== "auth/popup-closed-by-user" &&
        e.code !== "auth/cancelled-popup-request"
      ) {
        console.error("Google sign-in failed:", e);
        throw e;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    // onAuthStateChanged → null → a fresh anonymous session is created.
  }, []);

  const value = {
    user,
    loading,
    isAnonymous: user?.isAnonymous ?? true,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
