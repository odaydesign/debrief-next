"use client";

/**
 * Firestore data layer.
 *
 * This module re-implements the small slice of the Convex client surface the
 * app relied on — `api` (path constants), `useQuery`, `useMutation`, plus a
 * `uploadFile` helper for Firebase Storage — so call sites only had to swap
 * their import lines, not their logic.
 *
 * Reads are real-time via `onSnapshot`. To dodge composite indexes we query a
 * single `where("userId","==",uid)` and do any extra filtering / sorting in JS.
 * Per-user docs use deterministic ids (`${uid}_${articleId}`) so writes are
 * idempotent upserts. Security is enforced by Firestore rules (owner == uid),
 * not by these client calls.
 */

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";

// Path constants mirroring the old Convex `api` object shape, so existing
// call sites (`api.articles.getAll`, `useMutation(api.notes.add)`, …) keep working.
export const api = {
  articles: {
    getDaily: "articles.getDaily",
    getAll: "articles.getAll",
    getAllTags: "articles.getAllTags",
    getBookmarked: "articles.getBookmarked",
    getUserInteractions: "articles.getUserInteractions",
    getRelated: "articles.getRelated",
    create: "articles.create",
    update: "articles.update",
    remove: "articles.remove",
    markRead: "articles.markRead",
    toggleBookmark: "articles.toggleBookmark",
  },
  notes: {
    getAll: "notes.getAll",
    getByArticle: "notes.getByArticle",
    add: "notes.add",
    remove: "notes.remove",
  },
  bundles: {
    getBundles: "bundles.getBundles",
    createBundle: "bundles.createBundle",
    deleteBundle: "bundles.deleteBundle",
    updateBundle: "bundles.updateBundle",
    removeArticleFromBundle: "bundles.removeArticleFromBundle",
  },
};

// Expose the Firestore doc id as BOTH `_id` (what most components read, a
// holdover from Convex) and `id` (used in a few spots). Doc id always wins.
const normalize = (d) => ({ ...d.data(), _id: d.id, id: d.id });

// Firestore rejects `undefined` field values — drop them before writing.
const stripUndefined = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
};

const byCreatedAtDesc = (a, b) =>
  (b.createdAt || "").localeCompare(a.createdAt || "");

// ---------------------------------------------------------------------------
// Real-time read subscriptions. Returns an unsubscribe function.
// ---------------------------------------------------------------------------
function subscribe(path, args, cb) {
  switch (path) {
    // Daily feed and full archive both return every article, newest first.
    // (The old getDaily ignored its `date` arg too — kept for parity.)
    case api.articles.getDaily:
    case api.articles.getAll: {
      const q = query(collection(db, "articles"), orderBy("date", "desc"));
      return onSnapshot(q, (snap) => cb(snap.docs.map(normalize)));
    }

    case api.articles.getAllTags: {
      const q = query(collection(db, "articles"));
      return onSnapshot(q, (snap) => {
        const tags = [
          ...new Set(snap.docs.map((d) => d.data().tag).filter(Boolean)),
        ].sort();
        cb(tags);
      });
    }

    case api.articles.getRelated: {
      const { articleId, tag, limit = 4 } = args || {};
      const q = query(collection(db, "articles"), orderBy("date", "desc"));
      return onSnapshot(q, (snap) => {
        const all = snap.docs.map(normalize).filter((a) => a._id !== articleId);
        const sameTag = tag ? all.filter((a) => a.tag === tag) : [];
        const rest = tag ? all.filter((a) => a.tag !== tag) : all;
        cb([...sameTag, ...rest].slice(0, limit));
      });
    }

    case api.articles.getUserInteractions: {
      const { userId } = args || {};
      const q = query(
        collection(db, "userInteractions"),
        where("userId", "==", userId)
      );
      return onSnapshot(q, (snap) => cb(snap.docs.map(normalize)));
    }

    // Bookmarked articles = join of (articles) × (this user's bookmarked
    // interactions). Two live subscriptions combined in JS.
    case api.articles.getBookmarked: {
      const { userId } = args || {};
      let articlesCache = [];
      let interactionsCache = [];
      const emit = () => {
        const ids = new Set(
          interactionsCache.filter((i) => i.isBookmarked).map((i) => i.articleId)
        );
        cb(articlesCache.filter((a) => ids.has(a._id)));
      };
      const unsubA = onSnapshot(
        query(collection(db, "articles"), orderBy("date", "desc")),
        (snap) => {
          articlesCache = snap.docs.map(normalize);
          emit();
        }
      );
      const unsubI = onSnapshot(
        query(collection(db, "userInteractions"), where("userId", "==", userId)),
        (snap) => {
          interactionsCache = snap.docs.map(normalize);
          emit();
        }
      );
      return () => {
        unsubA();
        unsubI();
      };
    }

    case api.bundles.getBundles: {
      const { userId } = args || {};
      const q = query(
        collection(db, "searchBundles"),
        where("userId", "==", userId)
      );
      return onSnapshot(q, (snap) => cb(snap.docs.map(normalize)));
    }

    case api.notes.getAll: {
      const { userId } = args || {};
      const q = query(collection(db, "notes"), where("userId", "==", userId));
      return onSnapshot(q, (snap) =>
        cb(snap.docs.map(normalize).sort(byCreatedAtDesc))
      );
    }

    case api.notes.getByArticle: {
      const { articleId, userId } = args || {};
      const q = query(collection(db, "notes"), where("userId", "==", userId));
      return onSnapshot(q, (snap) =>
        cb(
          snap.docs
            .map(normalize)
            .filter((n) => n.articleId === articleId)
            .sort(byCreatedAtDesc)
        )
      );
    }

    default:
      console.warn("[db] Unknown query path:", path);
      return () => {};
  }
}

/**
 * useQuery(path, args) — real-time read. Returns `undefined` while loading
 * (matching Convex), then the result. Pass the string `"skip"` as args to not
 * subscribe (e.g. before the user's identity has resolved).
 */
export function useQuery(path, args) {
  const skip = args === "skip";
  // Stable dependency key so the effect only re-subscribes on real arg changes.
  const argsKey = skip ? "skip" : JSON.stringify(args ?? null);
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (skip) {
      setData(undefined);
      return;
    }
    setData(undefined);
    const parsed = argsKey === "null" ? undefined : JSON.parse(argsKey);
    const unsub = subscribe(path, parsed, setData);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, argsKey, skip]);

  return data;
}

// ---------------------------------------------------------------------------
// Mutations (async, fire-and-forget from the caller's perspective).
// ---------------------------------------------------------------------------
const mutations = {
  [api.articles.create]: async (args) => {
    const refDoc = await addDoc(collection(db, "articles"), stripUndefined(args));
    return refDoc.id;
  },

  [api.articles.update]: async ({ id, ...fields }) => {
    await updateDoc(doc(db, "articles", id), stripUndefined(fields));
  },

  // Cascade: delete this article's interactions + notes, then the article.
  [api.articles.remove]: async ({ id }) => {
    const [interSnap, notesSnap] = await Promise.all([
      getDocs(query(collection(db, "userInteractions"), where("articleId", "==", id))),
      getDocs(query(collection(db, "notes"), where("articleId", "==", id))),
    ]);
    const batch = writeBatch(db);
    interSnap.forEach((d) => batch.delete(d.ref));
    notesSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "articles", id));
    await batch.commit();
  },

  [api.articles.markRead]: async ({ userId, articleId }) => {
    if (!userId) return;
    await setDoc(
      doc(db, "userInteractions", `${userId}_${articleId}`),
      { userId, articleId, isRead: true, readAt: new Date().toISOString() },
      { merge: true }
    );
  },

  // Real toggle: flip the stored isBookmarked rather than always setting true
  // (fixes the old MainContext bug where you couldn't un-bookmark).
  [api.articles.toggleBookmark]: async ({ userId, articleId, collectionId = "all" }) => {
    if (!userId) return;
    const refDoc = doc(db, "userInteractions", `${userId}_${articleId}`);
    const snap = await getDoc(refDoc);
    const current = snap.exists() ? !!snap.data().isBookmarked : false;
    const next = !current;
    await setDoc(
      refDoc,
      {
        userId,
        articleId,
        isBookmarked: next,
        collectionId,
        bookmarkedAt: next ? new Date().toISOString() : null,
      },
      { merge: true }
    );
  },

  [api.notes.add]: async ({ articleId, text, highlightText, color, userId }) => {
    const uid = userId ?? auth.currentUser?.uid ?? null;
    const refDoc = await addDoc(
      collection(db, "notes"),
      stripUndefined({
        articleId,
        userId: uid,
        text,
        highlightText,
        color,
        createdAt: new Date().toISOString(),
      })
    );
    return refDoc.id;
  },

  [api.notes.remove]: async ({ id }) => {
    await deleteDoc(doc(db, "notes", id));
  },

  [api.bundles.createBundle]: async ({ userId, name, tags }) => {
    const refDoc = await addDoc(collection(db, "searchBundles"), {
      userId,
      name,
      tags: tags ?? [],
      excludedArticles: [],
    });
    return refDoc.id;
  },

  [api.bundles.deleteBundle]: async ({ id }) => {
    await deleteDoc(doc(db, "searchBundles", id));
  },

  [api.bundles.updateBundle]: async ({ id, name, tags }) => {
    await updateDoc(doc(db, "searchBundles", id), stripUndefined({ name, tags }));
  },

  [api.bundles.removeArticleFromBundle]: async ({ bundleId, articleId }) => {
    const refDoc = doc(db, "searchBundles", bundleId);
    const snap = await getDoc(refDoc);
    if (!snap.exists()) return;
    const excluded = snap.data().excludedArticles ?? [];
    if (!excluded.includes(articleId)) {
      await updateDoc(refDoc, { excludedArticles: [...excluded, articleId] });
    }
  },
};

/**
 * useMutation(path) — returns a stable async function. Call it with the
 * mutation's args object, exactly like the Convex client did.
 */
export function useMutation(path) {
  return useCallback(
    (args) => {
      const fn = mutations[path];
      if (!fn) {
        console.warn("[db] Unknown mutation path:", path);
        return Promise.resolve();
      }
      return fn(args ?? {});
    },
    [path]
  );
}

/**
 * uploadFile(file) — upload to Firebase Storage and return the public download
 * URL. Replaces the 3-step Convex upload flow (generateUploadUrl → POST →
 * generateFileUrl) with a single call.
 */
export async function uploadFile(file) {
  const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(fileRef, file);
  return await getDownloadURL(snap.ref);
}
