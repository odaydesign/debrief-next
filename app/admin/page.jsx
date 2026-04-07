"use client";

import { useRouter } from 'next/navigation';
import AdminDashboardView from "@/views/AdminDashboardView";

export default function AdminPage() {
  const router = useRouter();

  const handleNewPost = () => {
    router.push('/admin/editor');
  };

  const handleEditPost = (article) => {
    router.push(`/admin/editor/${article._id}`);
  };

  return (
    <AdminDashboardView
      onNewPost={handleNewPost}
      onEditPost={handleEditPost}
    />
  );
}
