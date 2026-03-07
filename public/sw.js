const CACHE_NAME = "groweasy-cache-v1";

// ✅ Only cache paths we are 100% sure exist
const urlsToCache = [
  "/",
  "/dashboard",
  "/businesstools",
  "/favicon.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return Promise.all(
        urlsToCache.map((url) => {
          return cache
            .add(url)
            .catch((err) => console.error(`Failed to cache: ${url}`, err));
        }),
      );
    }),
  );
});

// ✅ Listen for the "SKIP_WAITING" message to update the app immediately
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
