/**
 * Publish stage: turn a written draft into an `articles` document.
 *
 * Drafts are written with `status: "draft"` — the app's public feed filters
 * them out (lib/db.js) and the sitemap skips them; the admin dashboard shows
 * them with an UTKAST badge for review. Promotion to the live feed is a
 * status flip (see newsroom/promote.mjs).
 *
 * Real writes use the Firebase Admin SDK (ADC, bypasses the write-locked
 * rules — same pattern as scripts/*.mjs). Dry runs write JSON files to
 * newsroom/out/ instead so the whole pipeline can be tested without
 * credentials.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { newsroomRoot } from "./config.mjs";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "debrief-3ef06";

/** Lazy so --dry-run works without firebase-admin installed. */
export async function getAdminDb() {
  const { initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(initializeApp({ projectId: PROJECT_ID }));
}

/** Map a written draft onto the app's article document shape. */
export function toArticleDoc(agent, pick, written) {
  // Stable palette pick per source URL so re-generations look the same.
  const palette = agent.palette?.length
    ? agent.palette[[...pick.url].reduce((a, c) => a + c.charCodeAt(0), 0) % agent.palette.length]
    : { bgColor: "bg-[#2a2726]", textColor: "text-[#f6f4f1]" };

  const media = Array.isArray(written.media) ? written.media : [];
  const image = media.find((m) => m.type === "image")?.url || "";

  return {
    title: written.title,
    summary: written.summary || "",
    content: written.contentHtml,
    tag: agent.tag,
    tagStyle: agent.tagStyle,
    bgColor: palette.bgColor,
    textColor: palette.textColor,
    buttonText: agent.buttonText || "LÄS ARTIKELN",
    image,
    date: new Date().toISOString(),
    type: "news",
    status: "draft",
    agent: agent.id,
    source: { name: pick.sourceName, url: pick.url },
    media,
    imageQuery: written.imageQuery || "",
    generatedAt: new Date().toISOString(),
  };
}

export async function publishDraft(db, doc) {
  const ref = await db.collection("articles").add(doc);
  return ref.id;
}

export function writeDryRun(doc) {
  const outDir = join(newsroomRoot, "out");
  mkdirSync(outDir, { recursive: true });
  const slug = doc.title.toLowerCase().replace(/[^a-z0-9åäö]+/gi, "-").slice(0, 60);
  const path = join(outDir, `${doc.agent}-${slug || "draft"}.json`);
  writeFileSync(path, JSON.stringify(doc, null, 2));
  return path;
}
