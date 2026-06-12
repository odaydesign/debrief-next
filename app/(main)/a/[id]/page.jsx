import ArticleStandalone from "@/views/ArticleStandalone";
import { fetchArticle, stripHtml, truncate } from "@/lib/articleServer";

// Per-article Open Graph / Twitter metadata, fetched server-side via the
// Firestore REST API (articles are world-readable). Rendered at request time —
// no build-time Firestore dependency.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const a = await fetchArticle(id);
  if (!a) return { title: "Artikeln hittades inte", robots: { index: false } };

  const description = truncate(stripHtml(a.summary || a.description || a.content || ""), 160);
  return {
    title: a.title,
    description,
    alternates: { canonical: `/a/${id}` },
    openGraph: {
      type: "article",
      locale: "sv_SE",
      url: `/a/${id}`,
      title: a.title,
      description,
      ...(a.date && { publishedTime: a.date }),
      ...(a.image && { images: [a.image] }),
    },
    twitter: {
      card: a.image ? "summary_large_image" : "summary",
      title: a.title,
      description,
    },
  };
}

export default async function ArticlePage({ params }) {
  const { id } = await params;
  return <ArticleStandalone id={id} />;
}
