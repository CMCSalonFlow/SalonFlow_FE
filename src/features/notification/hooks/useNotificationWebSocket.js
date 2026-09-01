import { useEffect, useState, useRef, useCallback } from "react";
import { notification } from "antd";
import { getUnreadNotificationCountApi } from "@/features/notification/api/notificationApi";
import { API_BASE_URL } from "@/core/api/endpoints";
import { getStoredAuthData } from "@/core/utils/auth";

export const useNotificationWebSocket = (onNewNotification) => {
    const authData = getStoredAuthData();
    const userId = authData?.userId || localStorage.getItem("userId");
    const isAuthenticated = !!(authData?.accessToken || localStorage.getItem("accessToken"));
    const [unreadCount, setUnreadCount] = useState(0);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const callbackRef = useRef(onNewNotification);

    // Dynamic ref update prevents useEffect dependency re-triggers on parent re-renders
    useEffect(() => {
        callbackRef.current = onNewNotification;
    }, [onNewNotification]);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const data = await getUnreadNotificationCountApi();
            if (data && typeof data.count === "number") {
                setUnreadCount(data.count);
            }
        } catch (err) {
            console.error("Failed to fetch unread notification count:", err);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    useEffect(() => {
        let isMounted = true;

        if (!isAuthenticated) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }

        const wsHost = API_BASE_URL.replace(/^http/, "ws");
        const wsUrl = `${wsHost}/ws/notifications${userId ? `?userId=${userId}` : ""}`;

        const connect = () => {
            if (!isMounted) return;
            if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
                return;
            }

            try {
                const ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    if (!isMounted) return;
                    console.log("Connected to Notification WebSocket:", wsUrl);
                    if (userId) {
                        ws.send(JSON.stringify({ type: "AUTH", userId: userId }));
                    }
                };

                ws.onmessage = (event) => {
                    if (!isMounted) return;
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type === "NEW_NOTIFICATION") {
                            if (typeof payload.unreadCount === "number") {
                                setUnreadCount(payload.unreadCount);
                            } else {
                                setUnreadCount((prev) => prev + 1);
                            }

                            const notifItem = payload.notification || {};
                            notification.info({
                                message: notifItem.title || "Thông báo mới",
                                description: notifItem.body || notifItem.message || "Bạn có thông báo mới.",
                                placement: "topRight"
                            });

                            if (callbackRef.current) {
                                callbackRef.current(notifItem);
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing notification WS payload:", e);
                    }
                };

                ws.onerror = (err) => {
                    if (!isMounted) return;
                    console.warn("Notification WS error (retrying in background):", err);
                };

                ws.onclose = (event) => {
                    if (!isMounted) return;
                    wsRef.current = null;
                    if (reconnectTimerRef.current) {
                        clearTimeout(reconnectTimerRef.current);
                    }
                    // Only auto-retry if not a clean intentional close
                    if (event.code !== 1000) {
                        reconnectTimerRef.current = setTimeout(connect, 5000);
                    }
                };

                wsRef.current = ws;
            } catch (err) {
                if (isMounted) {
                    console.error("Notification WS connection failed:", err);
                }
            }
        };

        connect();

        return () => {
            isMounted = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounted");
                wsRef.current = null;
            }
        };
    }, [isAuthenticated, userId]);

    return { unreadCount, setUnreadCount, refreshUnreadCount: fetchUnreadCount };
};
