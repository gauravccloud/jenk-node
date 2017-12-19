//Cache polyfil to support cacheAPI in all browsers
importScripts('./cache-polyfill.js');

var cacheName = 'cache-v4';

//Files to save in cache
var files = [
  './',
  'https://sony.cognitiveclouds.com/api/configuration/config_pages',
  'https://sony.cognitiveclouds.com/api/configuration/config_ads',
  'https://sony.cognitiveclouds.com/api/configuration/config_bands'
];

self.addEventListener('install', (event) => {
  console.info('Event: Install');
  event.waitUntil(
    caches.open(cacheName)
    .then((cache) => {
      return cache.addAll(files)
      .then(() => {
        console.info('All files are cached');
        return self.skipWaiting();
      })
      .catch((error) =>  {
        console.error('Failed to cache', error);
      })
    })
  );
});

self.addEventListener('fetch', (event) => {
  console.info('Event: Fetch');
  var request = event.request;
  console.log("Request",request,"caches",caches.match(request));
  event.respondWith(
    caches.match(request).then((response) => {
      console.log("Response is: ",response)
      if (response) {
        return response;
      }
      return fetch(request).then((response) => {
        var responseToCache = response.clone();
        caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache).catch((err) => {
              console.warn(request.url + ': ' + err.message);
            });
          });
        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.info('Event: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== cacheName) {
            return caches.delete(cache);
          }
        })
      );
    })
    .then(function () {
      console.info("Old caches are cleared!");
      return self.clients.claim(); 
    }) 
  );
});