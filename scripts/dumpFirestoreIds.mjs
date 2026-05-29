import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFileSync } from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyCBg2bK_PpPDT1gUc2FUBLUvF5wYzpxyaQ",
  authDomain: "debrief-3ef06.firebaseapp.com",
  projectId: "debrief-3ef06",
  storageBucket: "debrief-3ef06.firebasestorage.app",
  messagingSenderId: "1020404599093",
  appId: "1:1020404599093:web:bc3beca3912cd7c6bd647c",
};

const db = getFirestore(initializeApp(firebaseConfig));
const snap = await getDocs(collection(db, "articles"));
const ids = snap.docs.map((d) => d.id).sort();
writeFileSync("/tmp/fs_ids.txt", ids.join("\n") + "\n");
console.log("firestore article ids:", ids.length);
process.exit(0);
