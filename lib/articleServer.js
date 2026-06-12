/**
 * Server-side article access via the Firestore REST API.
 *
 * The `articles` collection is world-readable (see firestore.rules), so the
 * REST endpoint serves documents without auth — which lets server code
 * (generateMetadata, sitemap) read articles without firebase-admin or a
 * service account. Do NOT import this from client components.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "debrief-3ef06";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Unwrap Firestore's typed REST values ({ stringValue: "x" } → "x").
function decodeValue(v) {
  if (v == null || typeof v !== "object") return v;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}

export function decodeFields(fields = {}) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

const docId = (name) => name.split("/").pop();

/** Fetch a single article by doc id. Returns null when missing/unavailable. */
export async function fetchArticle(id) {
  try {
    const res = await fetch(`${BASE}/articles/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return { id: docId(json.name), ...decodeFields(json.fields) };
  } catch {
    return null;
  }
}

/** List articles (id, date, title) for the sitemap. Follows pagination. */
export async function listArticles(max = 500) {
  const out = [];
  let pageToken = "";
  try {
    while (out.length < max) {
      const url = `${BASE}/articles?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const json = await res.json();
      for (const d of json.documents || []) {
        const f = decodeFields(d.fields);
        out.push({ id: docId(d.name), date: f.date, title: f.title });
      }
      pageToken = json.nextPageToken;
      if (!pageToken || !(json.documents || []).length) break;
    }
  } catch {
    /* network-less builds: return what we have */
  }
  return out.slice(0, max);
}

export function stripHtml(s = "") {
  return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(s = "", n = 160) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;
}
