#!/usr/bin/env node
/**
 * Promote (or reject) a newsroom draft after review.
 *
 *   node newsroom/promote.mjs --list                # show pending drafts
 *   node newsroom/promote.mjs --id <articleId>      # draft → published
 *   node newsroom/promote.mjs --id <articleId> --reject   # delete the draft
 *
 * Uses the Firebase Admin SDK via ADC, like the other scripts.
 */
import { getAdminDb } from "./lib/publish.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const db = await getAdminDb();

if (flag("list")) {
  const snap = await db.collection("articles").where("status", "==", "draft").get();
  if (snap.empty) console.log("Inga utkast väntar.");
  for (const d of snap.docs) {
    const a = d.data();
    console.log(`${d.id}  [${a.agent || "?"}] ${a.title}\n    källa: ${a.source?.url || "-"}`);
  }
  process.exit(0);
}

const id = opt("id");
if (!id) {
  console.error("Usage: node newsroom/promote.mjs --list | --id <articleId> [--reject]");
  process.exit(1);
}

const ref = db.collection("articles").doc(id);
const snap = await ref.get();
if (!snap.exists) {
  console.error(`articles/${id} finns inte`);
  process.exit(1);
}

if (flag("reject")) {
  await ref.delete();
  console.log(`✗ Utkast raderat: ${snap.data().title}`);
} else {
  await ref.update({ status: "published", publishedAt: new Date().toISOString() });
  console.log(`✓ Publicerad: ${snap.data().title}`);
}
