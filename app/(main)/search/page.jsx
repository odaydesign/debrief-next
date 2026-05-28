"use client";

import { useQuery, api } from "@/lib/db";
import { useMain, formatArticles } from "@/lib/MainContext";
import SearchView from "@/views/SearchView";

export default function SearchPage() {
  const { user, interactions, openArticle } = useMain();

  const allArticles = useQuery(api.articles.getAll);
  const articles = formatArticles(allArticles, interactions);

  return (
    <SearchView
      articles={articles}
      activeArticle={null}
      setActiveArticle={openArticle}
      user={user}
    />
  );
}
