// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// We use a query parameter hack to pass env variables to SW, or we just rely on self.firebaseConfig if injected.
// Since import.meta.env doesn't work in SW out of the box without bundler setup, we can use a query string or inject it.
// To keep it clean and robust without complex injection:
// In Vite, we can't easily use import.meta.env in public files directly.
// We'll catch push events directly, but Firebase requires initialization.

// A common approach for Vite PWA is to parse query params or fallback.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Since we can't inject env variables directly into this static file easily,
// we rely on the backend sending the notification payload in a way that standard push events can catch,
// OR we dynamically initialize when the frontend registers the SW.
// For now, we will handle `push` event manually for FCM payload to guarantee it works without config here.

self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    
    // FCM payload structure usually puts data inside `notification` or `data`
    const title = payload.notification?.title || payload.data?.title || 'New Notification';
    const body = payload.notification?.body || payload.data?.body || '';
    const type = payload.data?.type || 'GENERAL';
    const referenceId = payload.data?.referenceId || '';

    const options = {
      body: body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {
        type,
        referenceId
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('Error processing push event:', err);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const type = event.notification.data?.type;
  const referenceId = event.notification.data?.referenceId;
  
  // Determine route based on type
  let route = '/';
  if (type === 'ASSIGNMENT') route = '/student/assignments'; // Or admin equivalent depending on role, handled gracefully in App.tsx
  else if (type === 'NOTICE') route = '/student/notice';
  else if (type === 'EVENT' || type === 'EVENT_NOTICE') route = '/student/events';
  else if (type === 'EXAMINATION') route = '/student/examinations';
  else if (type === 'QUIZ') route = '/student/quiz';
  else route = '/student/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(route) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(route);
      }
    })
  );
});
