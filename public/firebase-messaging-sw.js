importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDPyY2TQcUE3TbX1Mox3X5A-jfHgugGCG8",
    authDomain: "amu-campus-hub.firebaseapp.com",
    projectId: "amu-campus-hub",
    storageBucket: "amu-campus-hub.firebasestorage.app",
    messagingSenderId: "435999391120",
    appId: "1:435999391120:web:c5ff819ac42e7e06724715",
    measurementId: "G-ENQBE5WRNS"
});

console.log('[firebase-messaging-sw.js] Initialized Service Worker');
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'AMU Campus Hub';
    const body = payload.notification?.body || payload.data?.body || '';

    // Novu often sends data at the root or under 'data'
    // Let's check both payload.data.url and payload.fcmOptions?.link
    const targetUrl = payload.data?.url || payload.fcmOptions?.link || '/';

    const notificationOptions = {
        body: body,
        icon: '/logo.png',
        data: {
            url: targetUrl
        }
    };

    console.log('[firebase-messaging-sw.js] Showing notification with URL:', targetUrl);
    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    let urlToOpen = event.notification.data.url;

    // Convert relative URLs to absolute
    if (urlToOpen.startsWith('/')) {
        urlToOpen = self.location.origin + urlToOpen;
    }

    console.log('[firebase-messaging-sw.js] opening URL:', urlToOpen);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
