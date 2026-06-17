"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useMutation, useQuery, api } from "@/lib/db";
import { useAuthContext } from "@/lib/AuthContext";

const MainContext = createContext(null);

export function useMain() {
  const context = useContext(MainContext);
  if (!context) throw new Error("useMain must be used within MainProvider");
  return context;
}

// Non-throwing variant — returns null outside a MainProvider (e.g. admin preview).
export function useMainOptional() {
  return useContext(MainContext);
}

const calculateReadTime = (text) => {
  if (!text) return '1 min läsning';
  const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min läsning`;
};

export function formatArticles(rawArticles, interactions) {
  if (!rawArticles) return [];
  return rawArticles.map(a => {
    const interaction = interactions?.find(i => i.articleId === a._id);
    return {
      ...a,
      id: a._id,
      date: new Date(a.date),
      isBookmarked: interaction?.isBookmarked || false,
      isRead: interaction?.isRead || false,
      readTime: calculateReadTime(a.content),
      author: a.author || 'Debrief AI'
    };
  });
}

export function MainProvider({ children }) {
  // Real identity from Firebase Auth (anonymous-by-default). Until the first
  // anonymous sign-in resolves, fbUser is null and Firestore queries below "skip".
  const { user: fbUser, loading: authLoading, isAnonymous, signInWithGoogle, signOut } = useAuthContext();
  const user = fbUser ? { id: fbUser.uid } : null;
  const [activeArticle, setActiveArticle] = useState(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  // Selected news-river category (null = "Senaste"/all). Set from the top nav,
  // read by the feed. Lives here so nav and feed can sync across routes.
  const [category, setCategory] = useState(null);

  // Shared queries
  const interactions = useQuery(api.articles.getUserInteractions, user ? { userId: user.id } : "skip");
  const bundles = useQuery(api.bundles.getBundles, user ? { userId: user.id } : "skip");

  // Shared mutations
  const markReadMutation = useMutation(api.articles.markRead);
  const toggleBookmarkMutation = useMutation(api.articles.toggleBookmark);

  // Whether we pushed a /a/[id] history entry for the open overlay. Closing
  // then goes through history.back() so URL and sheet state stay in sync.
  const pushedRef = useRef(false);

  const markArticleRead = useCallback((articleId) => {
    if (!user || !articleId) return;
    markReadMutation({ userId: user.id, articleId });
  }, [user, markReadMutation]);

  const closeOverlayState = useCallback(() => {
    setIsOverlayOpen(false);
    setTimeout(() => setActiveArticle(null), 800);
  }, []);

  const handleOpenArticle = useCallback((article) => {
    if (!article) {
      closeOverlayState();
      return;
    }
    setActiveArticle(article);
    setTimeout(() => setIsOverlayOpen(true), 20);

    // Give the article a shareable URL while reading. pushState is synced
    // with the App Router without remounting, so the sheet animation is kept.
    const id = article.id || article._id;
    if (id && typeof window !== 'undefined') {
      try {
        window.history.pushState({ debriefOverlay: id }, '', `/a/${id}`);
        pushedRef.current = true;
      } catch { /* ignore */ }
    }

    markArticleRead(id);
  }, [markArticleRead, closeOverlayState]);

  const handleCloseOverlay = useCallback(() => {
    if (pushedRef.current && window.location.pathname.startsWith('/a/')) {
      pushedRef.current = false;
      // The pathname effect below performs the actual close after back().
      window.history.back();
      return;
    }
    pushedRef.current = false;
    closeOverlayState();
  }, [closeOverlayState]);

  // The App Router syncs usePathname with both pushState and popstate, so this
  // covers hardware/browser back (mobile-native sheet dismissal) AND nav-link
  // navigation while the sheet is open.
  const pathname = usePathname();
  const overlayOpenRef = useRef(false);
  useEffect(() => { overlayOpenRef.current = isOverlayOpen; }, [isOverlayOpen]);
  useEffect(() => {
    if (overlayOpenRef.current && !pathname.startsWith('/a/')) {
      pushedRef.current = false;
      closeOverlayState();
    }
  }, [pathname, closeOverlayState]);

  const toggleBookmark = useCallback((id, collectionId = 'all') => {
    if (!user) return;
    // The mutation flips the stored isBookmarked; real-time Firestore updates the UI.
    toggleBookmarkMutation({
      userId: user.id,
      articleId: id,
      collectionId,
    });
  }, [user, toggleBookmarkMutation]);

  const value = {
    user,
    // Auth surface for account UI
    authLoading,
    isAnonymous,
    displayName: fbUser?.displayName ?? null,
    photoURL: fbUser?.photoURL ?? null,
    email: fbUser?.email ?? null,
    signInWithGoogle,
    signOut,
    activeArticle,
    isOverlayOpen,
    category,
    setCategory,
    interactions,
    bundles,
    openArticle: handleOpenArticle,
    closeOverlay: handleCloseOverlay,
    toggleBookmark,
    markArticleRead,
  };

  return (
    <MainContext.Provider value={value}>
      {children}
    </MainContext.Provider>
  );
}
