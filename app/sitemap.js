import { listArticles } from "@/lib/articleServer";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap() {
  const staticEntries = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/archive`, changeFrequency: "daily", priority: 0.6 },
  ];

  let articleEntries = [];
  try {
    const articles = await listArticles(500);
    articleEntries = articles.map((a) => ({
      url: `${BASE}/a/${a.id}`,
      ...(a.date && { lastModified: new Date(a.date) }),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // Offline/keyless builds: ship the static entries only.
  }

  return [...staticEntries, ...articleEntries];
}
