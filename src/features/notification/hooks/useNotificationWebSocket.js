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
        if (!isAuthenticated) {
            if (wsRef.current) {
                wsRef.current.close();
            }
            return;
        }

        const wsHost = API_BASE_URL.replace(/^http/, "ws");
        const wsUrl = `${wsHost}/ws/notifications${userId ? `?userId=${userId}` : ""}`;

        const connect = () => {
            try {
                const ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log("Connected to Notification WebSocket:", wsUrl);
                    if (userId) {
                        ws.send(JSON.stringify({ type: "AUTH", userId: userId }));
                    }
                };

                ws.onmessage = (event) => {
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

                            if (onNewNotification) {
                                onNewNotification(notifItem);
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing notification WS payload:", e);
                    }
                };

                ws.onerror = (err) => {
                    console.warn("Notification WS error:", err);
                };

                ws.onclose = () => {
                    console.log("Notification WS closed. Retrying in 5s...");
                    reconnectTimerRef.current = setTimeout(connect, 5000);
                };

                wsRef.current = ws;
            } catch (err) {
                console.error("Notification WS connection failed:", err);
            }
        };

        connect();

        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [isAuthenticated, userId, onNewNotification]);

    return { unreadCount, setUnreadCount, refreshUnreadCount: fetchUnreadCount };
};
