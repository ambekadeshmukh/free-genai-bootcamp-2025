/* eslint-disable no-restricted-globals */

// Cache name with version
const CACHE_NAME = 'le-petit-explorateur-v1';

// Assets to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/sounds/correct.mp3',
  '/sounds/incorrect.mp3',
  '/sounds/click.mp3',
  '/sounds/success.mp3',
  '/sounds/notification.mp3'
];

// Install service worker
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Force service worker activation
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add response to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If fetch fails (offline), try to serve index.html for navigation
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return null;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-user-progress') {
    event.waitUntil(syncUserProgress());
  }
});

// Function to sync user progress when back online
async function syncUserProgress() {
  try {
    const pendingActions = await getDataFromIndexedDB('offline-actions');
    
    if (pendingActions && pendingActions.length > 0) {
      // Process each pending action
      for (const action of pendingActions) {
        try {
          // Send to server
          const response = await fetch(action.url, {
            method: action.method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(action.data)
          });
          
          if (response.ok) {
            // Remove from IndexedDB
            await removeFromIndexedDB('offline-actions', action.id);
          }
        } catch (error) {
          console.error('Error processing offline action:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing user progress:', error);
  }
}

// Helper function to get data from IndexedDB
function getDataFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('le-petit-explorateur-db');
    
    request.onerror = () => reject(new Error('Failed to open database'));
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onerror = () => reject(new Error('Failed to get data'));
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    };
  });
}

// Helper function to remove data from IndexedDB
function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('le-petit-explorateur-db');
    
    request.onerror = () => reject(new Error('Failed to open database'));
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onerror = () => reject(new Error('Failed to delete data'));
      deleteRequest.onsuccess = () => resolve();
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        const url = event.notification.data.url;
        
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});