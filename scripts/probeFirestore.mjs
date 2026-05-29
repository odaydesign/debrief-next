/**
 * Read-only probe: how many articles already live in debrief-3ef06 Firestore?
 * Articles are publicly readable, so no auth is needed. Run from the repo root:
 *   node scripts/probeFirestore.mjs
 */
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBg2bK_PpPDT1gUc2FUBLUvF5wYzpxyaQ",
  authDomain: "debrief-3ef06.firebaseapp.com",
  projectId: "debrief-3ef06",
  storageBucket: "debrief-3ef06.firebasestorage.app",
  messagingSenderId: "1020404599093",
  appId: "1:1020404599093:web:bc3beca3912cd7c6bd647c",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const snap = await getDocs(collection(db, "articles"));
console.log(`articles in debrief-3ef06 Firestore: ${snap.size}`);
snap.docs.slice(0, 8).forEach((d) => {
  const a = d.data();
  console.log(`  ${d.id}  ${(a.date || "").slice(0, 10)}  ${a.title || "(no title)"}`);
});
process.exit(0);
