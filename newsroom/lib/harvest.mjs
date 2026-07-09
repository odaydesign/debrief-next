/**
 * Harvest stage: pull candidate items from an agent's source index.
 *
 * Today this supports RSS 2.0 / Atom feeds (the `feeds` and `newsletters`
 * arrays — most newsletters expose an RSS feed). The `sites` and `x` arrays
 * are declared in the index but need dedicated adapters (crawler / X API);
 * they are ignored here with a note in the run log.
 *
 * Dependency-free: built-in fetch + a small tolerant XML picker. If a feed
 * needs more than this (broken XML, HTML-only sites), swap in a real parser
 * behind the same `harvestAgent()` interface.
 */

const FETCH_TIMEOUT_MS = 15000;
const UA = "DebriefNewsroom/0.1 (+https://debrief.example; content research bot)";

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*" },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

// ── Minimal XML helpers ──────────────────────────────────────────────────────
const decodeEntities = (s = "") =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

const stripTags = (s = "") => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// First <tag>…</tag> content inside a block (namespace-tolerant).
function pick(block, tag) {
  const m = block.match(new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)</(?:\\w+:)?${tag}>`, "i"));
  return m ? decodeEntities(m[1].trim()) : "";
}

// Atom links live in attributes: <link rel="alternate" href="…"/>
function pickAtomLink(block) {
  const links = [...block.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const alt = links.find((l) => /rel=["']alternate["']/i.test(l)) || links.find((l) => !/rel=/i.test(l));
  const m = alt && alt.match(/href=["']([^"']+)["']/i);
  return m ? decodeEntities(m[1]) : "";
}

function parseFeed(xml, sourceName) {
  const items = [];
  const rssItems = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const atomEntries = rssItems.length ? [] : [...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map((m) => m[0]);

  for (const block of rssItems) {
    items.push({
      title: stripTags(pick(block, "title")),
      url: pick(block, "link") || pick(block, "guid"),
      summary: stripTags(pick(block, "description") || pick(block, "encoded")).slice(0, 500),
      publishedAt: pick(block, "pubDate") || pick(block, "date"),
      sourceName,
    });
  }
  for (const block of atomEntries) {
    items.push({
      title: stripTags(pick(block, "title")),
      url: pickAtomLink(block) || pick(block, "id"),
      summary: stripTags(pick(block, "summary") || pick(block, "content")).slice(0, 500),
      publishedAt: pick(block, "published") || pick(block, "updated"),
      sourceName,
    });
  }
  return items.filter((i) => i.title && i.url);
}

const parseDate = (s) => {
  const t = Date.parse(s || "");
  return Number.isNaN(t) ? null : t;
};

/**
 * Fetch every feed in the agent's index and return fresh candidates,
 * newest first. Feed failures are collected, not fatal — one dead feed
 * must not take down the whole run.
 */
export async function harvestAgent(agent, { maxAgeDays } = {}) {
  const ageLimit = (maxAgeDays ?? agent.selection?.maxAgeDays ?? 3) * 24 * 3600 * 1000;
  const cutoff = Date.now() - ageLimit;
  const feeds = [...(agent.sources.feeds || []), ...(agent.sources.newsletters || [])];

  const results = await Promise.allSettled(
    feeds.map(async (f) => ({ feed: f, items: parseFeed(await fetchText(f.url), f.name) }))
  );

  const items = [];
  const errors = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value.items);
    else errors.push(String(r.reason?.message || r.reason));
  }

  const seen = new Set();
  const fresh = items
    .filter((i) => {
      const t = parseDate(i.publishedAt);
      if (t !== null && t < cutoff) return false;
      if (seen.has(i.url)) return false;
      seen.add(i.url);
      return true;
    })
    .sort((a, b) => (parseDate(b.publishedAt) || 0) - (parseDate(a.publishedAt) || 0));

  return {
    items: fresh,
    errors,
    skipped: {
      sites: (agent.sources.sites || []).length,
      x: (agent.sources.x || []).length,
    },
  };
}
