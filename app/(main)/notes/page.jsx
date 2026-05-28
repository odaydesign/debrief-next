"use client";

import { useQuery, api } from "@/lib/db";
import { useMain, formatArticles } from "@/lib/MainContext";
import NotesView from "@/views/NotesView";

export default function NotesPage() {
  const { interactions, openArticle, user } = useMain();

  const allArticles = useQuery(api.articles.getAll);
  const allNotes = useQuery(api.notes.getAll, user?.id ? { userId: user.id } : "skip");

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
