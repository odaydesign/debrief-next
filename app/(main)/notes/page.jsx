"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMain, formatArticles } from "@/lib/MainContext";
import NotesView from "@/views/NotesView";

export default function NotesPage() {
  const { interactions, openArticle } = useMain();

  const allArticles = useQuery(api.articles.getAll);
  const allNotes = useQuery(api.notes.getAll);

  const articles = formatArticles(allArticles, interactions);
  const notes = allNotes?.map(n => ({ ...n, id: n._id })) || [];

  return (
    <NotesView
      notes={notes}
      articles={articles}
      setActiveArticle={openArticle}
    />
  );
}
