/**
 * Harvest ledger: remembers which source URLs have already been turned into
 * drafts, so daily runs never write the same story twice.
 *
 * Two backends behind one interface:
 *  - Firestore (`harvest` collection, doc id = url hash) when an Admin SDK
 *    db handle is provided — the durable option for scheduled runs.
 *  - A local JSON file (newsroom/.ledger.json, gitignored) otherwise, which
 *    is enough for local testing.
 */
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { newsroomRoot } from "./config.mjs";

/** Canonicalize before hashing so tracking params don't defeat dedupe. */
export function urlKey(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return createHash("sha1").update(url).digest("hex");
  }
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  for (const p of [...u.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|ref$|ref_)/i.test(p)) u.searchParams.delete(p);
  }
  const s = u.toString().replace(/\/+$/, "");
  return createHash("sha1").update(s).digest("hex");
}

class LocalLedger {
  constructor() {
    this.path = join(newsroomRoot, ".ledger.json");
    this.data = existsSync(this.path) ? JSON.parse(readFileSync(this.path, "utf8")) : {};
  }
  async has(url) {
    return Boolean(this.data[urlKey(url)]);
  }
  async add(url, meta = {}) {
    this.data[urlKey(url)] = { url, at: new Date().toISOString(), ...meta };
    writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }
}

class FirestoreLedger {
  constructor(db) {
    this.col = db.collection("harvest");
  }
  async has(url) {
    return (await this.col.doc(urlKey(url)).get()).exists;
  }
  async add(url, meta = {}) {
    await this.col.doc(urlKey(url)).set({ url, at: new Date().toISOString(), ...meta });
  }
}

export function openLedger(db) {
  return db ? new FirestoreLedger(db) : new LocalLedger();
}
