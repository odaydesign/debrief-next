/**
 * Read stage: fetch the source article and extract what the writing agent
 * needs — readable text, the page's own media (og:image, YouTube embeds,
 * X links) and basic metadata.
 *
 * Extraction is deliberately crude (strip tags from <article>/<main>/<body>).
 * If quality becomes a problem, swap in @mozilla/readability behind the same
 * `readPage()` interface.
 */

const FETCH_TIMEOUT_MS = 20000;
const UA = "DebriefNewsroom/0.1 (+https://debrief.example; content research bot)";
const MAX_TEXT_CHARS = 9000;

const decode = (s = "") =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

function meta(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i"
  );
  const m = html.match(re);
  return m ? decode(m[1] || m[2]) : "";
}

function extractText(html) {
  const scoped =
    html.match(/<article[\s>][\s\S]*?<\/article>/i)?.[0] ||
    html.match(/<main[\s>][\s\S]*?<\/main>/i)?.[0] ||
    html.match(/<body[\s>][\s\S]*?<\/body>/i)?.[0] ||
    html;
  return scoped
    .replace(/<(script|style|nav|header|footer|aside|form|noscript)[\s>][\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

function extractMedia(html) {
  const media = [];
  const ogImage = meta(html, "og:image");
  if (ogImage) media.push({ type: "image", url: ogImage, credit: "" });

  const yt = new Set(
    [...html.matchAll(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{6,})/g)].map((m) => m[1])
  );
  for (const id of [...yt].slice(0, 3)) {
    media.push({ type: "youtube", url: `https://www.youtube.com/watch?v=${id}` });
  }

  const tweets = new Set(
    [...html.matchAll(/https?:\/\/(?:twitter|x)\.com\/\w+\/status\/(\d+)/g)].map((m) => m[0])
  );
  for (const url of [...tweets].slice(0, 3)) media.push({ type: "tweet", url });

  return media;
}

export async function readPage(url) {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  const html = await res.text();
  return {
    url,
    title: meta(html, "og:title") || decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim(),
    description: meta(html, "og:description") || meta(html, "description"),
    siteName: meta(html, "og:site_name"),
    text: extractText(html),
    media: extractMedia(html),
  };
}
