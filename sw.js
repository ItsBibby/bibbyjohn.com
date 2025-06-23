// Service Worker for Bibby John's Personal Website

// Define a unique name for the cache.
const CACHE_NAME = 'bibbyjohn-offline-cache-v1';

// List the single URL we need for our one-page app to work offline.
// The '/' refers to the root index.html page.
const URLS_TO_CACHE = [
  '/'
];

/**
 * Install event listener.
 * This event is fired when the service worker is first installed.
 * We open a cache and add our essential file(s) to it.
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching essential files.');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

/**
 * Fetch event listener.
 * This event is fired for every network request the page makes.
 * It allows us to intercept the request and respond with our cached version if the user is offline.
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    // First, try to fetch the request from the network.
    fetch(event.request)
      .catch(() => {
        // If the network request fails (i.e., the user is offline),
        // we'll try to find a match in our cache.
        console.log('Service Worker: Network failed. Serving from cache.');
        return caches.match(event.request.url);
      })
  );
});

