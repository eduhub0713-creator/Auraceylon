const CACHE_NAME = "auraceylon-v14";

const APP_SHELL = [
  "/",
  "/index.html",
  "/products.html",
  "/product-details.html",
  "/cart.html",
  "/checkout.html",
  "/orders.html",
  "/profile.html",
  "/login.html",
  "/signup.html",
  "/forgot-password.html",
  "/about.html",
  "/contact.html",
  "/offline.html",
  "/manifest.json",

  "/css/base.css",
  "/css/home.css",
  "/css/products.css",
  "/css/cart.css",
  "/css/responsive.css",
  "/css/offline.css",

  "/js/firebase.js",
  "/js/main.js",
  "/js/products.js",
  "/js/cart.js",
  "/js/checkout.js",
  "/js/ui.js",
  "/js/pwa.js",

  "/assets/logo.jpg",
  "/assets/banner.jpg",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (
    requestUrl.hostname.includes("firebase") ||
    requestUrl.hostname.includes("googleapis") ||
    requestUrl.hostname.includes("gstatic")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        })
        .catch(() => caches.match("/offline.html"))
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      });
    })
  );
});
