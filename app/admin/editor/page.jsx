"use client";

import { useRouter } from 'next/navigation';
import EditorView from "@/views/EditorView";

export default function NewEditorPage() {
  const router = useRouter();

  const handlePublish = () => {
    router.push('/admin');
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  return (
    <EditorView
      articleToEdit={null}
      onPublish={handlePublish}
      onCancel={handleCancel}
    />
  );
}
