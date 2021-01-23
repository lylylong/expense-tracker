// assign a few global constants that we'll need later
const APP_PREFIX = "expense-tracker-";
const VERSION = "v1";
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = "data-cache-" + VERSION;

// define the files we'd like to cache
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/idb.js",
  "./js/index.js",
  "./icons/icon-72x72.png",
  "./icons/icon-96x96.png",
  "./icons/icon-128x128.png",
  "./icons/icon-144x144.png",
  "./icons/icon-152x152.png",
  "./icons/icon-192x192.png",
  "./icons/icon-384x384.png",
  "./icons/icon-512x512.png",
];

// install the service worker
self.addEventListener("install", function (evt) {
  // install process
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Files were pre-cached!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// intercept fetch requests
self.addEventListener("fetch", function (evt) {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(evt.request)
            .then((response) => {
              // if the response was ok so -- store the cloned one in the cache
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            })
            .catch((err) => {
              // get data from the cache when network request failed
              return cache.match(evt.request);
            });
        })
        .catch((err) => console.log(err))
    );
    return;
  }
  evt.respondWith(
    fetch(evt.request).catch(function () {
      return caches.match(evt.request).then(function (response) {
        if (response) {
          return response;
        } else if (evt.request.headers.get("accept").includes("text/html")) {
          return caches.match("/");
        }
      });
    })
  );
});

// add an event listener to the activate event
self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    // keys() returns all cache names
    // keyList is a parameter that contains all cache names
    caches.keys().then((keyList) => {
      let cacheKeeplist = keyList.filter(function (key) {
        return key.indexOf(APP_PREFIX);
      });
      cacheKeeplist.push(CACHE_NAME);
      // returns a Promise that resolves once all old cache have been deleted
      return Promise.all(
        keyList.map(function (key, i) {
          if (cacheKeeplist.indexOf(key) === -1) {
            console.log("deleting cache: " + keyList[i]);
            return caches.delete(keyList[i]);
          }
        })
      );
    })
  );
});
