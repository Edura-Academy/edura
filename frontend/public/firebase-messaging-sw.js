// Firebase Messaging Service Worker
// Bu dosya push notification'ları almak için gereklidir

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase yapılandırması - .env'den alamayacağımız için burada tanımlıyoruz
// Bu değerler public key olduğu için güvenlik riski yoktur
const firebaseConfig = {
  apiKey: "AIzaSyD_EDURA_FIREBASE_API_KEY",
  authDomain: "edura-kurs.firebaseapp.com",
  projectId: "edura-kurs",
  storageBucket: "edura-kurs.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Messaging instance'ı al
const messaging = firebase.messaging();

// Arka planda mesaj alındığında
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Arka plan mesajı alındı:', payload);

  const notificationTitle = payload.notification?.title || 'Edura Bildirimi';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Görüntüle'
      },
      {
        action: 'close',
        title: 'Kapat'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Bildirime tıklandı:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Varsayılan URL veya data'dan gelen URL'e yönlendir
  const urlToOpen = event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Zaten açık bir pencere varsa ona odaklan
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      // Yoksa yeni pencere aç
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Service Worker kurulduğunda
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker kuruldu');
  self.skipWaiting();
});

// Service Worker aktifleştiğinde
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker aktif');
  event.waitUntil(clients.claim());
});

