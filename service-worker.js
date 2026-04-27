const CACHE_NAME = "auraceylon-v13";

const APP_SHELL = [
  "./",
  "./index.html",
  "./products.html",
  "./product-details.html",
  "./cart.html",
  "./checkout.html",
  "./about.html",
  "./contact.html",
  "./offline.html",
  "./manifest.json",

  "./css/base.css",
  "./css/home.css",
  "./css/products.css",
  "./css/cart.css",
  "./css/responsive.css",
  "./css/offline.css",

  "./js/main.js",
  "./js/products.js",
  "./js/cart.js",
  "./js/checkout.js",
  "./js/ui.js",
  "./js/pwa.js",

  "./assets/logo.jpg",
  "./assets/banner.jpg",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
        });
    })
  );
});
