"use client";

import { useState, useRef, useEffect } from "react";
import { useMain } from "@/lib/MainContext";
import { User, LogOut } from "lucide-react";

/**
 * Floating account control (top-right). Reflects the anonymous-by-default auth
 * model: guests can upgrade via Google (keeping their uid + data); signed-in
 * users see their identity and can sign out (which drops back to a fresh guest).
 */
export default function AccountButton() {
  const {
    authLoading,
    isAnonymous,
    displayName,
    photoURL,
    email,
    signInWithGoogle,
    signOut,
  } = useMain();

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (authLoading) return null;

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      setOpen(false);
    } catch {
      /* popup closed / handled in provider */
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const initial = (displayName || email || "G").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className="fixed top-5 right-5 z-[70]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Konto"
        className="w-10 h-10 rounded-full bg-card border border-line shadow-lg flex items-center justify-center overflow-hidden text-ink hover:bg-surface transition-colors active:scale-90"
      >
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoURL} alt="" className="w-full h-full object-cover" />
        ) : isAnonymous ? (
          <User size={18} strokeWidth={2} />
        ) : (
          <span className="text-sm font-semibold">{initial}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-64 rounded-2xl bg-card border border-line shadow-2xl p-4 text-ink">
          {isAnonymous ? (
            <>
              <p className="text-sm font-semibold">Gäst</p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Dina anteckningar och bokmärken sparas på den här enheten. Logga
                in för att spara dem permanent.
              </p>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="mt-3 w-full rounded-xl bg-accent text-accent-ink text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                Logga in med Google
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold truncate">
                {displayName || "Inloggad"}
              </p>
              {email && (
                <p className="text-xs text-muted mt-0.5 truncate">{email}</p>
              )}
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="mt-3 w-full rounded-xl bg-surface border border-line text-sm font-medium py-2.5 hover:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <LogOut size={15} /> Logga ut
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
