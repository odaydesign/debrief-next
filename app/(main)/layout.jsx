"use client";

import { MainProvider, useMain } from "@/lib/MainContext";
import ArticleOverlay from "@/components/ArticleOverlay";
import BottomNav from "@/components/BottomNav";

function MainLayoutInner({ children }) {
  const { activeArticle, isOverlayOpen, closeOverlay } = useMain();

  return (
    <div className="min-h-screen bg-[#46423f] text-[#f6f4f1] font-sans selection:bg-[#50c878] selection:text-white pb-24 relative">
      {/* Main Content Area */}
      <div
        className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOverlayOpen
            ? 'scale-[0.97] opacity-60 rounded-3xl overflow-hidden pointer-events-none origin-top'
            : 'scale-100 opacity-100'
        }`}
      >
        <main className="pb-24">
          {children}
        </main>
      </div>

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
