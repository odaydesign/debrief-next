/**
 * Additive seed: fill empty recent days (and a few days forward) with
 * brand-matched dummy articles in debrief-3ef06 Firestore.
 *
 * The real seed data stops at 2026-05-13, leaving the feed's "today" + recent
 * week empty. This generates `type: "news"` articles (the dominant type) for a
 * configurable date range, reusing the real data's tags, tag styles, bg/text
 * color pairs, images and button labels so the dummy cards look native.
 *
 * ADDITIVE — existing articles are left untouched. Docs use deterministic ids
 * `dummy-YYYYMMDD-N` and carry a `seed: "dummy"` marker, so a re-run is
 * idempotent (overwrites the same ids) and the set is trivial to bulk-delete.
 *
 * Usage (gcloud ADC must be available):
 *   node scripts/seedDummyArticles.mjs            # default range
 *   START=2026-05-14 END=2026-06-02 node scripts/seedDummyArticles.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "debrief-3ef06";
const COLLECTION = "articles";
const CHUNK = 400;

// Date range (inclusive). Defaults: fill the gap after the real data through a
// few days past "today" (2026-05-29).
const START = process.env.START || "2026-05-14";
const END = process.env.END || "2026-06-02";

// ── Deterministic PRNG (mulberry32) so re-runs produce the identical set ──────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260529);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randint = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

// ── Derive look-and-feel pools from the real data ────────────────────────────
const real = readFileSync(join(__dirname, "seed-data", "articles.jsonl"), "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l))
  .filter((d) => (d.type || "news") === "news");

const images = [...new Set(real.map((d) => d.image).filter(Boolean))];
const bgTextPairs = [
  ...new Map(
    real
      .filter((d) => d.bgColor && d.textColor)
      .map((d) => [`${d.bgColor}|${d.textColor}`, { bgColor: d.bgColor, textColor: d.textColor }])
  ).values(),
];
// tag -> styles actually seen with that tag in the real data
const stylesByTag = {};
for (const d of real) {
  if (!d.tag || !d.tagStyle) continue;
  (stylesByTag[d.tag] ||= new Set()).add(d.tagStyle);
}
for (const k of Object.keys(stylesByTag)) stylesByTag[k] = [...stylesByTag[k]];

// ── Editorial corpus per tag: [title, summary] ────────────────────────────────
const CORPUS = {
  AI: [
    ["GPT-6: Vad Vi Faktiskt Vet", "Läckta detaljer antyder ett enormt kontextfönster och bättre multimodal förmåga. Vi skiljer fakta från spekulation."],
    ["Open Source-modellerna Kommer Ikapp", "Llama och Mistral minskar gapet till de stängda jättarna snabbare än någon förutspådde."],
    ["AI-agenter Tar Över Rutinarbetet", "Företag rapporterar markanta produktivitetslyft när autonoma agenter sköter det repetitiva."],
    ["EU:s Nästa Drag Kring AI-reglering", "Nya regler kan tvinga fram transparens om träningsdata. Branschen håller andan."],
    ["Små Modeller, Stora Resultat", "Distillerade modeller kör nu lokalt på mobilen med förvånansvärt hög precision."],
    ["Är Hallucinationerna På Väg Bort?", "Nya retrieval-tekniker minskar felaktiga svar dramatiskt — men inte helt."],
    ["Röst-AI Når Mänsklig Nivå", "Realtidsöversättning och naturligt tal suddar ut gränsen mellan människa och maskin."],
    ["Kapplöpningen Om Datacenter Eskalerar", "Efterfrågan på GPU:er driver rekordinvesteringar i infrastruktur världen över."],
    ["AI I Sjukvården: Tidigare Diagnos", "Bildanalys upptäcker tecken på sjukdom månader före traditionella metoder."],
    ["Kostnaden För Intelligens Faller", "Pris per token har rasat kraftigt på två år. Vad betyder det för startups?"],
  ],
  DESIGN: [
    ["Variabla Typsnitt Tar Över Webben", "En enda fontfil, oändliga vikter. Designers omfamnar den nyvunna flexibiliteten."],
    ["Färgtrender 2026: Dämpat Och Jordnära", "Bort med neon — naturnära paletter dominerar nästa års gränssnitt."],
    ["Designsystem Som Faktiskt Skalar", "Hur de bästa teamen håller konsekvens över hundratals komponenter."],
    ["Mikrointeraktioner Som Gör Skillnad", "De små detaljerna som får ett gränssnitt att kännas levande."],
    ["Brutalism Möter Minimalism", "En ny våg av webbdesign bryter reglerna — med avsikt."],
    ["Tillgänglighet Är Inte Valfritt", "Varför inkluderande design är bra för alla, och för affärerna."],
    ["Mörkt Läge Som Standard", "Allt fler produkter levererar mörkt läge först. Här är varför."],
    ["Typografi Som Berättar", "Redaktionell design återvänder till digitala produkter."],
    ["Animationer Med Mening", "Rörelse som vägleder användaren istället för att distrahera."],
    ["Designern Som Produktledare", "Gränsen mellan design och strategi suddas allt mer ut."],
  ],
  DEV: [
    ["Rust Fortsätter Erövra Systemprogrammeringen", "Fler stora projekt byter till Rust för säkerhet och prestanda."],
    ["TypeScript 6.0: Det Här Är Nytt", "Snabbare kompilering och smartare typinferens i senaste releasen."],
    ["Är Microservices Övervärderade?", "Pendeln svänger tillbaka mot monoliter för många team."],
    ["Edge Computing För Utvecklare", "Kör koden närmare användaren — en praktisk genomgång."],
    ["Testning Som Faktiskt Fungerar", "Strategier för tester du litar på, utan att drunkna i dem."],
    ["WebAssembly Når Mognad", "Wasm öppnar dörren för helt nya språk i webbläsaren."],
    ["Git-arbetsflöden Som Skalar", "Hur stora team håller historiken ren och deployer säkra."],
    ["Databasen Är Inte Bara Postgres", "När du bör välja något annat — och när du inte bör."],
    ["Observability Bortom Loggarna", "Spårning, mätvärden och loggar i en enhetlig bild."],
    ["Den Återvunna Kraften I SQL", "Varför rådatabaskunskap är mer värdefullt än någonsin."],
  ],
  TECH: [
    ["Kvantdatorer Lämnar Labbet", "De första kommersiella tillämpningarna börjar ge verkligt värde."],
    ["Satelliter Ger Internet Överallt", "Lågbanekonstellationer förändrar uppkopplingen på landsbygden."],
    ["Batteriteknik Slår Nya Rekord", "Ny kemi lovar nästan dubbel räckvidd för elbilar."],
    ["Chip-kriget Hårdnar", "Geopolitiken bakom dagens halvledarproduktion."],
    ["Robotik Flyttar In I Hemmet", "Hushållsrobotar går från gimmick till verklig nytta."],
    ["Förstärkt Verklighet Får Sitt Genombrott", "Lättare glasögon och bättre mjukvara driver adoptionen."],
    ["Cybersäkerhet I En AI-värld", "Både angripare och försvarare beväpnar sig med AI."],
    ["Hållbar Teknik På Allvar", "Energieffektiva datacenter blir snabbt branschstandard."],
    ["Rymdekonomin Tar Fart", "Privata aktörer gör rymden till en marknad."],
    ["Digital Identitet Omdefinieras", "Lösenordslösa inloggningar blir äntligen verklighet."],
  ],
  STARTUP: [
    ["Finansieringsklimatet Vänder", "Investerare öppnar plånboken igen — men med nya krav."],
    ["Bootstrappa Eller Ta In Kapital?", "Grundare delar sina erfarenheter av båda vägarna."],
    ["Den Nya Vågen Av AI-startups", "Var pengarna flödar under 2026."],
    ["Produkt–marknadsanpassning På Riktigt", "Hur du vet att du faktiskt hittat den."],
    ["Att Anställa De Första Tio", "Misstagen som sänker tidiga team — och hur du undviker dem."],
    ["Från Idé Till MVP På 30 Dagar", "En grundares snabbguide till att börja."],
    ["Prissättning Som Driver Tillväxt", "Konsten att ta betalt rätt från första början."],
    ["Solo-grundaren Bygger Miljonbolag", "Enpersonsföretag når nya höjder med AI-verktyg."],
    ["B2B Slår B2C I Avkastning", "Varför investerare allt oftare föredrar företagskunder."],
    ["Kundlojalitet Från Dag Ett", "Tillväxt börjar med dem du redan har."],
  ],
  INSPIRATION: [
    ["Konsten Att Säga Nej", "Hur de mest produktiva skyddar sin tid och fokus."],
    ["Långsamt Är Smidigt", "Varför hastighet utan riktning ofta är rent slöseri."],
    ["Bygg Vanor Som Håller", "Små förändringar som ger stora resultat över tid."],
    ["Kreativitet Är En Muskel", "Träna den med rätt rutiner och vila."],
    ["Djupt Arbete I En Distraherad Värld", "Så återerövrar du din koncentration."],
    ["Misslyckandena Som Lärde Mig Mest", "Reflektioner från en lång och spretig karriär."],
    ["Hitta Mening I Hantverket", "Glädjen i att göra en sak ordentligt."],
    ["Mindre Möten, Mer Görande", "Praktiska sätt att återta din kalender."],
    ["Skriv För Att Tänka Klarare", "Pennan som verktyg för bättre beslut."],
    ["Vila Är Produktivt", "Argumenten för att medvetet göra mindre."],
  ],
  EVENT: [
    ["Designkonferensen 2026: Programmet Släppt", "Tre dagar av talks, workshops och nätverkande i Stockholm."],
    ["Hackathon För Klimatlösningar", "48 timmar, obegränsade idéer. Anmälan är nu öppen."],
    ["AI Summit Kommer Till Norden", "Branschledare samlas för att diskutera vägen framåt."],
    ["Meetup: Frontend På Frammarsch", "Månadsträff för webbutvecklare — alla nivåer välkomna."],
    ["Startup-mässan Öppnar Portarna", "Möt investerare och grundare under samma tak."],
    ["Workshop: Bygg Med AI-verktyg", "Praktisk handledning för team som vill komma igång."],
    ["Produktledardagen", "En heldag tillägnad dem som bygger produkter."],
    ["Demo Day: Nästa Generations Bolag", "Tjugo startups presenterar på tio minuter var."],
    ["Webbtillgänglighetens Vecka", "Seminarier och samtal om inkluderande design."],
    ["Devs & Drinks: Nätverkskväll", "Lättsam mingel för hela teknikbranschen."],
  ],
};
const TAGS = Object.keys(CORPUS);
const BUTTONS = {
  AI: ["LÄS ANALYS", "LÄS MER"],
  DESIGN: ["SE PORTFOLIOS", "SE EXEMPEL"],
  DEV: ["LÄS GUIDE", "SE EXEMPEL"],
  TECH: ["LÄS MER", "LÄS RAPPORT"],
  STARTUP: ["LÄS RAPPORT", "LÄS FALLSTUDIE"],
  INSPIRATION: ["LÄS ESSÄ", "LÄS KRÖNIKAN"],
  EVENT: ["BOKA BILJETT", "VISA SCHEMA"],
};
const FALLBACK_STYLE = {
  AI: "bg-blue-500 text-white",
  DESIGN: "bg-[#fbbf24] text-[#78350f]",
  DEV: "bg-[#50c878] text-[#1a1818]",
  TECH: "bg-[#7dd3fc] text-[#0c4a6e]",
  STARTUP: "bg-[#f4a261] text-[#1a1818]",
  INSPIRATION: "bg-[#b8a30e] text-[#1a1818]",
  EVENT: "bg-[#e85d4e] text-white",
};

const eachDate = (start, end) => {
  const out = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
};

// Per-tag rotating cursor so titles spread out instead of repeating immediately.
const cursor = Object.fromEntries(TAGS.map((t) => [t, Math.floor(rand() * CORPUS[t].length)]));
const nextEntry = (tag) => {
  const list = CORPUS[tag];
  const e = list[cursor[tag] % list.length];
  cursor[tag] += 1;
  return e;
};

function buildArticle(dateStr, j) {
  const tag = pick(TAGS);
  const [title, summary] = nextEntry(tag);
  const styles = stylesByTag[tag] && stylesByTag[tag].length ? stylesByTag[tag] : [FALLBACK_STYLE[tag]];
  const tagStyle = pick(styles);
  const pair = bgTextPairs.length ? pick(bgTextPairs) : { bgColor: "bg-[#f6f4f1]", textColor: "text-[#2a2726]" };
  // Descending times within the day so item 0 sorts as the day's lead.
  const hour = Math.max(6, 20 - j * 2);
  const minute = randint(0, 59);
  const date = `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
  return {
    title,
    summary,
    content: `<p>${summary}</p><p>Den här artikeln är genererad demo-text för att fylla flödet med representativt innehåll. Den speglar tonen i en typisk Debrief-sammanfattning utan att referera till verkliga källor.</p>`,
    tag,
    tagStyle,
    bgColor: pair.bgColor,
    textColor: pair.textColor,
    image: pick(images),
    buttonText: pick(BUTTONS[tag]),
    type: "news",
    date,
    seed: "dummy",
  };
}

const dates = eachDate(START, END);
const docs = [];
for (const dateStr of dates) {
  const count = randint(6, 9);
  for (let j = 0; j < count; j++) {
    docs.push({ id: `dummy-${dateStr.replace(/-/g, "")}-${j}`, data: buildArticle(dateStr, j) });
  }
}

const db = getFirestore(initializeApp({ projectId: PROJECT_ID }));

console.log(`\nSeeding dummy articles → Firestore (${PROJECT_ID})  [ADDITIVE]`);
console.log(`Range ${START} … ${END}  (${dates.length} days, ${docs.length} articles)\n`);

for (let i = 0; i < docs.length; i += CHUNK) {
  const batch = db.batch();
  for (const { id, data } of docs.slice(i, i + CHUNK)) {
    batch.set(db.collection(COLLECTION).doc(id), data);
  }
  await batch.commit();
}

// Quick per-day tally for sanity.
const byDay = {};
for (const { data } of docs) {
  const d = data.date.slice(0, 10);
  byDay[d] = (byDay[d] || 0) + 1;
}
for (const d of dates) console.log(`  ${d}: ${byDay[d]}`);
console.log(`\n✓ Done. Added/updated ${docs.length} dummy articles.\n`);
process.exit(0);
