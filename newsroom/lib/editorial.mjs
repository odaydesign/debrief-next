/**
 * Editorial stages — the two LLM calls in the pipeline.
 *
 * 1. selectCandidates(): the agent triages the harvested list against its
 *    mission and selection criteria, picking the few items worth writing up.
 * 2. writeArticle(): the agent reads the extracted source material and writes
 *    a Swedish draft according to its skills (newsroom/skills/*.md), returning
 *    structured JSON that maps 1:1 onto the app's article document.
 */
import { chatJSON } from "./llm.mjs";

export async function selectCandidates(agent, items, { limit } = {}) {
  const max = limit ?? agent.selection?.maxPerRun ?? 3;
  const list = items
    .slice(0, 60) // keep the prompt bounded
    .map((it, i) => `${i}. [${it.sourceName}] ${it.title}${it.summary ? ` — ${it.summary.slice(0, 200)}` : ""}`)
    .join("\n");

  const system =
    `Du är ${agent.name} på Debrief, en svensk daglig nyhetsbrief om tech.\n` +
    `Ditt uppdrag: ${agent.mission}\n\n` +
    `Urvalskriterier: ${agent.selection?.criteria || "Välj det med störst nyhetsvärde."}\n\n` +
    `Du får en numrerad lista med dagens skörd. Välj de ${max} mest värdefulla att skriva om ` +
    `(färre om inget håller måttet — hellre inget än fyllnad). ` +
    `Svara med ENBART JSON: [{"index": <nummer>, "relevance": <0-1>, "angle": "<vinkel på svenska, en mening>"}]`;

  const picks = await chatJSON({ system, user: list || "(tom lista)", temperature: 0.2, model: agent.model });
  if (!Array.isArray(picks)) return [];
  return picks
    .filter((p) => Number.isInteger(p.index) && items[p.index])
    .slice(0, max)
    .map((p) => ({ ...items[p.index], relevance: p.relevance, angle: p.angle }));
}

export async function writeArticle(agent, pick, page) {
  const mediaList = page.media.length
    ? page.media.map((m) => `- ${m.type}: ${m.url}`).join("\n")
    : "(ingen media hittad i källan)";

  const system =
    `Du är ${agent.name} på Debrief, en svensk daglig nyhetsbrief om tech.\n` +
    `Ditt uppdrag: ${agent.mission}\n\n` +
    `Följ dessa skills till punkt och pricka:\n\n${agent.skillsText}\n\n` +
    `Svara med ENBART JSON i exakt detta format:\n` +
    `{\n` +
    `  "title": "<rubrik>",\n` +
    `  "summary": "<ingress, 1-2 meningar>",\n` +
    `  "contentHtml": "<brödtext som HTML>",\n` +
    `  "imageQuery": "<engelsk bildsökning om källbild saknas, annars tom sträng>",\n` +
    `  "media": [{"type": "image|youtube|tweet", "url": "...", "credit": "..."}]\n` +
    `}\n` +
    `I "media" tar du bara med poster från källmaterialet som tillför något. Hitta aldrig på URL:er.`;

  const user =
    `KÄLLMATERIAL\n` +
    `Källa: ${pick.sourceName} (${page.siteName || "-"})\n` +
    `URL: ${pick.url}\n` +
    `Publicerad: ${pick.publishedAt || "okänt"}\n` +
    `Vald vinkel: ${pick.angle || "-"}\n\n` +
    `Originalrubrik: ${page.title || pick.title}\n` +
    `Beskrivning: ${page.description || pick.summary || "-"}\n\n` +
    `Media i källan:\n${mediaList}\n\n` +
    `Artikeltext (extraherad):\n${page.text || "(kunde inte extraheras — skriv utifrån rubrik och beskrivning, och håll dig extra kort och försiktig)"}`;

  const out = await chatJSON({ system, user, temperature: 0.5, maxTokens: 4096, model: agent.model });
  if (!out?.title || !out?.contentHtml) throw new Error("Writer returned incomplete article JSON");
  return out;
}
