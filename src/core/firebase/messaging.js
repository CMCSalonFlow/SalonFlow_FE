import { getToken, isSupported, onMessage } from "firebase/messaging";
import { firebaseApp } from "./firebase";

let messagingPromise = null;

export const getFirebaseMessaging = async () => {
    if (!messagingPromise) {
        messagingPromise = (async () => {
            const supported = await isSupported();
            if (!supported) {
                return null;
            }

            const { getMessaging } = await import("firebase/messaging");
            return getMessaging(firebaseApp);
        })();
    }

    return messagingPromise;
};

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        throw new Error("Trình duyệt không hỗ trợ Notification API.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Bạn cần cho phép thông báo để bật Firebase Messaging.");
    }

    return permission;
};

export const getFirebaseFcmToken = async (vapidKey) => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    if (!("serviceWorker" in navigator)) {
        throw new Error("Trình duyệt không hỗ trợ Service Worker.");
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    return getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
    });
};

export const listenForegroundMessages = async (callback) => {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    return onMessage(messaging, callback);
};
