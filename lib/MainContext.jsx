"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthContext } from "@/lib/AuthContext";

const MainContext = createContext(null);

export function useMain() {
  const context = useContext(MainContext);
  if (!context) throw new Error("useMain must be used within MainProvider");
  return context;
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
      author: 'Debrief AI'
    };
  });
}

export function MainProvider({ children }) {
  // Real identity from Firebase Auth (anonymous-by-default). Until the first
  // anonymous sign-in resolves, fbUser is null and Convex queries below "skip".
  const { user: fbUser, loading: authLoading, isAnonymous, signInWithGoogle, signOut } = useAuthContext();
  const user = fbUser ? { id: fbUser.uid } : null;
  const [activeArticle, setActiveArticle] = useState(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Shared queries
  const interactions = useQuery(api.articles.getUserInteractions, user ? { userId: user.id } : "skip");
  const bundles = useQuery(api.bundles.getBundles, user ? { userId: user.id } : "skip");

  // Shared mutations
  const markReadMutation = useMutation(api.articles.markRead);
  const toggleBookmarkMutation = useMutation(api.articles.toggleBookmark);

  const handleOpenArticle = useCallback((article) => {
    if (!article) {
      setIsOverlayOpen(false);
      setTimeout(() => setActiveArticle(null), 800);
      return;
    }
    setActiveArticle(article);
    setTimeout(() => setIsOverlayOpen(true), 20);

    if (user) {
      markReadMutation({ userId: user.id, articleId: article.id });
    }
  }, [user, markReadMutation]);

  const handleCloseOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setTimeout(() => setActiveArticle(null), 800);
  }, []);

  const toggleBookmark = useCallback((id, collectionId = 'all') => {
    if (!user) return;
    // We just call the mutation — real-time Convex will update the UI
    toggleBookmarkMutation({
      userId: user.id,
      articleId: id,
      isBookmarked: true, // Toggle is handled by the mutation
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
    interactions,
    bundles,
    openArticle: handleOpenArticle,
    closeOverlay: handleCloseOverlay,
    toggleBookmark,
  };

  return (
    <MainContext.Provider value={value}>
      {children}
    </MainContext.Provider>
  );
}
