"use client";

import { useQuery, api } from "@/lib/db";
import { useMain, formatArticles } from "@/lib/MainContext";
import FeedView from "@/views/FeedView";

export default function FeedPage() {
  const { interactions, openArticle } = useMain();

  // getDaily returns every article, newest first — the source for the river.
  const raw = useQuery(api.articles.getDaily, {});
  const articles = formatArticles(raw, interactions);
  const loading = raw === undefined;

  return (
    <FeedView
      articles={articles}
      loading={loading}
      setActiveArticle={openArticle}
    />
  );
}
