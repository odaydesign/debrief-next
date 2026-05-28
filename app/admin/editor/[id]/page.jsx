"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, api } from "@/lib/db";
import EditorView from "@/views/EditorView";

export default function EditEditorPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch the article to edit by getting all and finding the one
  const allArticles = useQuery(api.articles.getAll);
  const article = allArticles?.find(a => a._id === id) || null;

  const handlePublish = () => {
    router.push('/admin');
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  if (allArticles === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#50c878]" />
      </div>
    );
  }

  return (
    <EditorView
      articleToEdit={article}
      onPublish={handlePublish}
      onCancel={handleCancel}
    />
  );
}
