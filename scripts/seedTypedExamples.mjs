/**
 * Additive seed: one editorial example of each non-news content type.
 *
 * Drops a book, a podcast, a video, a PDF/file, a quote, a stat and a link
 * into the feed for today's date so the per-type card + reader UIs are visible
 * without hand-authoring them in the admin.
 *
 * ADDITIVE — uses deterministic ids `typed-<type>` so re-runs overwrite the
 * same docs (idempotent), and every doc carries `seed: "typed"` for easy
 * bulk-delete. The real and dummy news articles are left untouched.
 *
 * Usage (gcloud ADC required):
 *   node scripts/seedTypedExamples.mjs                 # defaults to 2026-06-06
 *   DATE=2026-06-08 node scripts/seedTypedExamples.mjs
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "debrief-3ef06";
const COLLECTION = "articles";
const DATE = process.env.DATE || "2026-06-06";

// Times are descending across the day so the typed items rotate through the
// lead/hero slots in the editorial feed.
const at = (h, m = 0) => `${DATE}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`;

const items = [
  {
    id: "typed-book",
    title: "The Psychology of Money",
    summary: "Tidlösa lektioner om välstånd, girighet och lycka — varför beteende slår intelligens i pengar.",
    content: "<p>Morgan Housels samlade essäer om hur människor faktiskt fattar finansiella beslut, inte hur de borde göra det enligt teorin.</p>",
    tag: "INSPIRATION",
    tagStyle: "bg-[#b8a30e] text-[#1a1818]",
    type: "book",
    source: "Penguin",
    author: "Morgan Housel",
    genre: "Ekonomi",
    time: "320 sid",
    c1: "#9c3322",
    c2: "#6e2417",
    date: at(20),
  },
  {
    id: "typed-quote",
    title: "Du blir inte ersatt av en AI. Du blir ersatt av någon som använder AI.",
    summary: "Sagt på GTC. Spreds snabbt — inte för att det är nytt, utan för att det äntligen formulerades enkelt.",
    content: "<p>Citatet sammanfattar hela årets debatt om arbete och automation i en mening.</p>",
    tag: "AI",
    tagStyle: "bg-blue-500 text-white",
    type: "quote",
    source: "Jensen Huang, Nvidia",
    date: at(18),
  },
  {
    id: "typed-stat",
    title: "kan automatiseras med dagens teknik — inte morgondagens",
    summary: "Inte en framtidsprognos. Andelen bygger på verktyg som finns och används redan i dag.",
    content: "<p>McKinsey-analysen är genererad demo-text för att visa hur en sifferbrief ser ut i läsvyn.</p>",
    tag: "AI",
    tagStyle: "bg-blue-500 text-white",
    type: "stat",
    source: "McKinsey",
    big: "31%",
    unit: "av arbetstiden",
    date: at(16),
  },
  {
    id: "typed-pdf",
    title: "World Energy Outlook 2026 — sammanfattning",
    summary: "Det globala energiskiftet i siffror: investeringar, kapacitet och var efterfrågan växer.",
    content: "<p>Grunddatat bakom hälften av veckans energinyheter. Den här artikeln är genererad demo-text för att fylla flödet.</p>",
    tag: "TECH",
    tagStyle: "bg-[#7dd3fc] text-[#0c4a6e]",
    type: "document",
    source: "IEA",
    fname: "iea-world-energy-outlook-2026.pdf",
    filetype: "PDF",
    filesize: "4,2 MB",
    pages: "48",
    date: at(14),
  },
  {
    id: "typed-video",
    title: "Varför halvledar-kartan ritas om — och vad det betyder för Europa",
    summary: "Hur exportkontroller, kapacitet och efterfrågan möts under 2026.",
    content: "<p>Halvledare är flaskhalsen för allt från AI till bilar. Den här artikeln är genererad demo-text.</p>",
    tag: "TECH",
    tagStyle: "bg-[#7dd3fc] text-[#0c4a6e]",
    type: "youtube",
    source: "Stratechery",
    channel: "Ben Thompson",
    dur: "18:24",
    externalId: "dQw4w9WgXcQ",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    date: at(12),
  },
  {
    id: "typed-podcast",
    title: "Bygg ett team som tänker i system, inte i uppgifter",
    summary: "En operativ chef om att gå från brandsläckning till struktur — och misstagen på vägen.",
    content: "<p>Skalning misslyckas sällan på strategi, oftast på hur beslut delegeras. Demo-text för att fylla flödet.</p>",
    tag: "STARTUP",
    tagStyle: "bg-[#f4a261] text-[#1a1818]",
    type: "podcast",
    source: "Lenny's Podcast",
    show: "Lenny's Podcast",
    ep: "Avs. 218",
    dur: "52:10",
    date: at(10),
  },
  {
    id: "typed-link",
    title: "Originalstudien bakom veckans mest delade AI-tråd",
    summary: "Hela pappret, inte sammanfattningen. För dig som vill se metoden själv.",
    content: "<p>De flesta delar tråden. Få läser källan. Den här gör skillnad i ett samtal. Demo-text.</p>",
    tag: "AI",
    tagStyle: "bg-blue-500 text-white",
    type: "link",
    source: "arxiv.org",
    domain: "arxiv.org",
    url: "https://arxiv.org",
    date: at(8),
  },
];

const db = getFirestore(initializeApp({ projectId: PROJECT_ID }));

console.log(`\nSeeding typed examples → Firestore (${PROJECT_ID}) for ${DATE}\n`);
const batch = db.batch();
for (const { id, ...data } of items) {
  batch.set(db.collection(COLLECTION).doc(id), { ...data, seed: "typed" });
  console.log(`  ${data.type.padEnd(10)} → ${id}  ${data.title.slice(0, 50)}`);
}
await batch.commit();
console.log(`\n✓ Done. Added/updated ${items.length} typed examples on ${DATE}.\n`);
process.exit(0);
