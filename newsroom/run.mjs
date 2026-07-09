#!/usr/bin/env node
/**
 * Newsroom runner — executes one or all agents through the pipeline:
 *
 *   harvest → dedupe → select → read → write → enrich → publish (draft)
 *
 * Usage:
 *   node newsroom/run.mjs --list                  # show agents
 *   node newsroom/run.mjs --agent ai --dry-run    # full run, drafts to newsroom/out/
 *   node newsroom/run.mjs --agent ai              # publish drafts to Firestore (needs ADC)
 *   node newsroom/run.mjs --all --limit 2         # every agent, max 2 drafts each
 *
 * Env:
 *   OPENROUTER_API_KEY   required for select/write (without it the run stops
 *                        after harvest and prints the candidate list)
 *   OPENROUTER_MODEL     default model (agents may override via config)
 *   FIREBASE_PROJECT_ID  defaults to debrief-3ef06 (publish only)
 */
import { listAgentIds, loadAgent } from "./lib/config.mjs";
import { harvestAgent } from "./lib/harvest.mjs";
import { openLedger } from "./lib/ledger.mjs";
import { hasApiKey } from "./lib/llm.mjs";
import { selectCandidates, writeArticle } from "./lib/editorial.mjs";
import { readPage } from "./lib/extract.mjs";
import { getAdminDb, toArticleDoc, publishDraft, writeDryRun } from "./lib/publish.mjs";

// ── CLI args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

if (flag("list")) {
  for (const id of listAgentIds()) {
    const a = loadAgent(id);
    const feeds = (a.sources.feeds || []).length + (a.sources.newsletters || []).length;
    console.log(`${id.padEnd(10)} ${a.tag.padEnd(9)} ${feeds} källor${a.experimental ? "  (experimentell)" : ""} — ${a.mission.slice(0, 80)}…`);
  }
  process.exit(0);
}

const dryRun = flag("dry-run");
const limit = opt("limit") ? Number(opt("limit")) : undefined;
const maxAgeDays = opt("days") ? Number(opt("days")) : undefined;
const agentIds = flag("all") ? listAgentIds() : opt("agent") ? [opt("agent")] : [];

if (!agentIds.length) {
  console.error("Usage: node newsroom/run.mjs --agent <id> | --all [--dry-run] [--limit N] [--days N] [--list]");
  process.exit(1);
}

// ── Pipeline ─────────────────────────────────────────────────────────────────
async function runAgent(id, db, ledger) {
  const agent = loadAgent(id);
  console.log(`\n▶ ${agent.name} (${id})`);

  // 1. Harvest
  const { items, errors, skipped } = await harvestAgent(agent, { maxAgeDays });
  for (const e of errors) console.warn(`  ⚠ feed error: ${e}`);
  if (skipped.sites) console.log(`  ℹ ${skipped.sites} 'sites' källor kräver crawler-adapter — hoppas över`);
  if (skipped.x) console.log(`  ℹ ${skipped.x} X-konton kräver X-adapter — hoppas över`);
  console.log(`  harvested ${items.length} fresh items`);
  if (!items.length) return { agent: id, drafts: 0 };

  // 2. Dedupe against the ledger
  const unseen = [];
  for (const it of items) if (!(await ledger.has(it.url))) unseen.push(it);
  console.log(`  ${unseen.length} unseen after dedupe`);
  if (!unseen.length) return { agent: id, drafts: 0 };

  if (!hasApiKey()) {
    console.log("  OPENROUTER_API_KEY saknas — stannar efter harvest. Kandidater:");
    for (const it of unseen.slice(0, 15)) console.log(`   • [${it.sourceName}] ${it.title}`);
    return { agent: id, drafts: 0 };
  }

  // 3. Select
  const picks = await selectCandidates(agent, unseen, { limit });
  console.log(`  selected ${picks.length}: ${picks.map((p) => `"${p.title.slice(0, 50)}"`).join(", ") || "-"}`);

  // 4–7. Read → write → enrich → publish, one story at a time
  let drafts = 0;
  for (const pick of picks) {
    try {
      let page;
      try {
        page = await readPage(pick.url);
      } catch (e) {
        // Paywalled/blocked pages: fall back to feed metadata only.
        console.warn(`  ⚠ could not read ${pick.url} (${e.message}) — writing from feed summary`);
        page = { url: pick.url, title: pick.title, description: pick.summary, siteName: "", text: "", media: [] };
      }

      const written = await writeArticle(agent, pick, page);
      const doc = toArticleDoc(agent, pick, written);

      if (dryRun) {
        const path = writeDryRun(doc);
        console.log(`  ✓ draft (dry-run) → ${path}`);
      } else {
        const docId = await publishDraft(db, doc);
        await ledger.add(pick.url, { agent: id, articleId: docId });
        console.log(`  ✓ draft published: articles/${docId} — "${doc.title}"`);
      }
      drafts++;
    } catch (e) {
      console.error(`  ✗ failed on "${pick.title.slice(0, 60)}": ${e.message}`);
    }
  }
  return { agent: id, drafts };
}

const db = dryRun ? null : await getAdminDb();
const ledger = openLedger(db);

const summary = [];
for (const id of agentIds) {
  try {
    summary.push(await runAgent(id, db, ledger));
  } catch (e) {
    console.error(`✗ agent ${id} crashed: ${e.message}`);
    summary.push({ agent: id, drafts: 0, error: e.message });
  }
}

console.log(`\n── Klart ─────────────────────────────`);
for (const s of summary) console.log(`  ${s.agent.padEnd(10)} ${s.drafts} utkast${s.error ? `  (fel: ${s.error})` : ""}`);
