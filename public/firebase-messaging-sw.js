/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBInB6Ux1Cxsuavz0mc-gHpc2zKhSQ3zbU",
    authDomain: "salonflow-a669d.firebaseapp.com",
    projectId: "salonflow-a669d",
    storageBucket: "salonflow-a669d.firebasestorage.app",
    messagingSenderId: "674592135028",
    appId: "1:674592135028:web:7b3376a582bfe289637e21",
    measurementId: "G-YYTSP4NZXX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const title = notification.title || "SalonFlow";
    const options = {
        body: notification.body || "Bạn có thông báo mới.",
        icon: "/vite.svg",
        data: payload.data || {}
    };

    self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = event.notification?.data?.url || "/notifications";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && "focus" in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
            return null;
        })
    );
});
