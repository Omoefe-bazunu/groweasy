// const CACHE_NAME = "groweasy-cache-v2"; // ✅ Bumped to v2 to force update

// // ✅ Only cache paths we are 100% sure exist
// const urlsToCache = [
//   "/",
//   "/dashboard",
//   "/businesstools",
//   "/favicon.png",
//   "/manifest.json",
// ];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       console.log("Opened cache");
//       return Promise.all(
//         urlsToCache.map((url) => {
//           return cache
//             .add(url)
//             .catch((err) => console.error(`Failed to cache: ${url}`, err));
//         }),
//       );
//     }),
//   );
// });

// // ✅ Listen for the "SKIP_WAITING" message to update the app immediately
// self.addEventListener("message", (event) => {
//   if (event.data && event.data.type === "SKIP_WAITING") {
//     self.skipWaiting();
//   }
// });

// /**
//  * ✅ NETWORK-FIRST STRATEGY
//  * This is crucial for your deployment. It tells the app:
//  * 1. Try to get the latest version from the internet first.
//  * 2. If the internet is available, update the cache and show the new page.
//  * 3. If there is no internet, only then show the cached version.
//  */
// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     fetch(event.request)
//       .then((response) => {
//         // If the request is successful, clone it and put it in the cache
//         return caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, response.clone());
//           return response;
//         });
//       })
//       .catch(() => {
//         // If the network fails (no internet), fall back to the cache
//         return caches.match(event.request);
//       }),
//   );
// });

self.addEventListener("install", () => {
  // Force this new "empty" worker to take over immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => {
        // ✅ Delete all GrowEasy caches to force live web loading
        return Promise.all(names.map((name) => caches.delete(name)));
      })
      .then(() => {
        // Take control of all open tabs immediately
        return self.clients.claim();
      }),
  );
});
