"use client";

import { useQuery, api } from "@/lib/db";
import { useMain, formatArticles } from "@/lib/MainContext";
import ArchiveView from "@/views/ArchiveView";

export default function ArchivePage() {
  const { interactions, openArticle, toggleBookmark } = useMain();

  const allArticles = useQuery(api.articles.getAll);
  const articles = formatArticles(allArticles, interactions);

  return (
    <ArchiveView
      articles={articles}
      setActiveArticle={openArticle}
      toggleBookmark={toggleBookmark}
    />
  );
}
