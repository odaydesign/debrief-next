"use client";

import { useState } from 'react';
import { useQuery, api } from "@/lib/db";
import { useMain, formatArticles } from "@/lib/MainContext";
import BookmarkView from "@/views/BookmarkView";

export default function BookmarksPage() {
  const { user, interactions, bundles, openArticle } = useMain();
  const [bookmarkCollections, setBookmarkCollections] = useState([]);

  const bookmarkedArticles = useQuery(api.articles.getBookmarked, user ? { userId: user.id } : "skip");
  const allArticles = useQuery(api.articles.getAll);

  const articles = formatArticles(bookmarkedArticles, interactions);

  const createCollection = (name) => {
    const newId = name.toLowerCase().replace(/\s+/g, '-');
    setBookmarkCollections(prev => [...prev, { id: newId, name }]);
  };

  return (
    <BookmarkView
      articles={articles}
      allArticles={allArticles || []}
      activeArticle={null}
      setActiveArticle={openArticle}
      bookmarkCollections={bookmarkCollections}
      createCollection={createCollection}
      bundles={bundles}
    />
  );
}
