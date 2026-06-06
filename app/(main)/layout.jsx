"use client";

import { MainProvider, useMain } from "@/lib/MainContext";
import ArticleOverlay from "@/components/ArticleOverlay";
import BottomNav from "@/components/BottomNav";
import AccountButton from "@/components/AccountButton";
import ThemeToggle from "@/components/ThemeToggle";

function MainLayoutInner({ children }) {
  const { activeArticle, isOverlayOpen, closeOverlay } = useMain();

  return (
    <div
      className="min-h-screen bg-bg text-ink font-sans relative"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 28px)" }}
    >
      {/* Main Content Area */}
      <div
        className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOverlayOpen
            ? 'scale-[0.97] opacity-60 rounded-3xl overflow-hidden pointer-events-none origin-top'
            : 'scale-100 opacity-100'
        }`}
      >
        <main style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 110px)" }}>
          {children}
        </main>
      </div>

      {/* Floating controls */}
      <ThemeToggle />
      <AccountButton />

      {/* Floating Navigation */}
      <BottomNav />

      {/* Article Overlay */}
      <ArticleOverlay
        card={activeArticle}
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
      />
    </div>
  );
}

export default function MainLayout({ children }) {
  return (
    <MainProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </MainProvider>
  );
}
