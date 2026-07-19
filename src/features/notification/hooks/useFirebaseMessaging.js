import { useCallback, useEffect, useState } from "react";
import { firebaseConfig } from "@/core/firebase/firebase";
import {
    getFirebaseFcmToken,
    listenForegroundMessages,
    requestNotificationPermission
} from "@/core/firebase/messaging";
import {
    getMyFcmTokensApi,
    registerFcmTokenApi,
    revokeFcmTokenApi
} from "@/features/notification/api/notificationApi";

const getVapidKey = () => import.meta.env.VITE_FIREBASE_VAPID_KEY || "BLB-qyIf9z5MqHez7HPIObO-xs8ezSWstOvGyvh41Iyoxvg9NxWjSSnLLfpuTIB_XPmYkfucwiPnTaOXr1L1LuE";

export const useFirebaseMessaging = ({ autoSync = false, onMessageReceived } = {}) => {
    const [permission, setPermission] = useState(
        typeof Notification !== "undefined" ? Notification.permission : "unsupported"
    );
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(true);
    const [error, setError] = useState("");

    const syncToken = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const vapidKey = getVapidKey();
            const fcmToken = await getFirebaseFcmToken(vapidKey);

            if (!fcmToken) {
                setSupported(false);
                return null;
            }

            setToken(fcmToken);

            const existingTokens = await getMyFcmTokensApi().catch(() => []);
            const alreadyRegistered = Array.isArray(existingTokens)
                && existingTokens.some((item) => item?.token === fcmToken && item?.isActive !== false);

            if (alreadyRegistered) {
                return fcmToken;
            }

            await registerFcmTokenApi({
                token: fcmToken,
                deviceName: navigator.userAgent,
                platform: "web"
            });

            return fcmToken;
        } catch (err) {
            setError(err?.message || "Không thể đăng ký FCM token.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const enableMessaging = useCallback(async () => {
        setError("");

        try {
            const nextPermission = await requestNotificationPermission();
            setPermission(nextPermission);

            if (nextPermission === "granted") {
                return await syncToken();
            }

            return null;
        } catch (err) {
            setError(err?.message || "Không thể bật thông báo.");
            throw err;
        }
    }, [syncToken]);

    const refreshToken = useCallback(async () => {
        return syncToken();
    }, [syncToken]);

    const unregisterToken = useCallback(async () => {
        if (!token) return;

        await revokeFcmTokenApi(token);
        setToken("");
    }, [token]);

    useEffect(() => {
        if (!autoSync) return;

        const canAutoSync =
            typeof Notification !== "undefined" &&
            Notification.permission === "granted";

        if (canAutoSync) {
            const timerId = window.setTimeout(() => {
                syncToken().catch(() => {});
            }, 0);

            return () => window.clearTimeout(timerId);
        }
    }, [autoSync, syncToken]);

    useEffect(() => {
        let unsubscribe = null;

        const startListener = async () => {
            if (typeof onMessageReceived !== "function") return;

            unsubscribe = await listenForegroundMessages(onMessageReceived);
        };

        startListener();

        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [onMessageReceived]);

    useEffect(() => {
        const updatePermission = () => {
            if (typeof Notification !== "undefined") {
                setPermission(Notification.permission);
            }
        };

        window.addEventListener("focus", updatePermission);
        return () => window.removeEventListener("focus", updatePermission);
    }, []);

    return {
        firebaseConfig,
        permission,
        token,
        loading,
        supported,
        error,
        enableMessaging,
        refreshToken,
        unregisterToken,
        syncToken
    };
};
