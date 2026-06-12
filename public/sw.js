/**
 * Debrief service worker — installability groundwork.
 *
 * Deliberately no `fetch` handler: nothing is cached, nothing can go stale.
 * The push-notification phase will add `push`/`notificationclick` handlers
 * here without any further plumbing.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
