/**
 * One-time importer: Convex snapshot (small-gazelle-643) → Firestore (debrief-3ef06).
 *
 * Reads scripts/seed-data/articles.jsonl (exported from Convex) and writes the
 * docs to Firestore using the SAME document id as Convex's `_id`, so the ids
 * stay stable. Uses the Firebase Admin SDK via Application Default Credentials,
 * which bypasses security rules (articles are otherwise write-locked).
 *
 * REPLACE mode: the articles collection is cleared before import.
 *
 * Only `articles` is migrated. The export's notes/userInteractions were tied to
 * the pre-auth `mock-user-123` and would be orphaned under the real-auth,
 * owner-only model, so they are intentionally skipped.
 *
 * Usage (gcloud ADC must be available):
 *   node scripts/importToFirestore.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "seed-data");
const PROJECT_ID = "debrief-3ef06";
const COLLECTION = "articles";
const CHUNK = 400; // Firestore batch limit is 500

const readJsonl = (path) =>
  readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

const db = getFirestore(initializeApp({ projectId: PROJECT_ID }));

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  let cleared = 0;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = db.batch();
    snap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
    await batch.commit();
    cleared += Math.min(CHUNK, snap.docs.length - i);
  }
  return cleared;
}

async function importCollection(name) {
  const docs = readJsonl(join(DATA_DIR, `${name}.jsonl`));
  const removed = await clearCollection(name);
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    for (const d of docs.slice(i, i + CHUNK)) {
      const { _id, _creationTime, ...rest } = d;
      batch.set(db.collection(name).doc(_id), rest);
    }
    await batch.commit();
  }
  console.log(`  ${name}: cleared ${removed}, imported ${docs.length}`);
}

console.log(`\nImporting Convex snapshot → Firestore (${PROJECT_ID})  [REPLACE mode]\n`);
await importCollection(COLLECTION);
console.log("\n✓ Done. Firestore articles replaced.\n");
process.exit(0);
