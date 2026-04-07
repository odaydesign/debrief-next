"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
