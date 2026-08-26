import { useCallback, useEffect, useState } from "react";
import { getUnreadNotificationCountApi } from "@/features/notification/api/notificationApi";

export const useUnreadNotificationCount = ({ enabled = true, pollIntervalMs = 30000 } = {}) => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        if (!enabled) {
            setCount(0);
            return 0;
        }

        setLoading(true);
        setError("");

        try {
            const response = await getUnreadNotificationCountApi();
            const nextCount = Number(response?.count || 0);
            setCount(nextCount);
            return nextCount;
        } catch (err) {
            setError(err?.message || "Không thể tải số lượng thông báo chưa đọc.");
            return 0;
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            refresh();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [refresh]);

    useEffect(() => {
        if (!enabled || !pollIntervalMs) return undefined;

        const timerId = window.setInterval(() => {
            refresh();
        }, pollIntervalMs);

        const handleFocus = () => refresh();

        window.addEventListener("focus", handleFocus);

        return () => {
            window.clearInterval(timerId);
            window.removeEventListener("focus", handleFocus);
        };
    }, [enabled, pollIntervalMs, refresh]);

    return {
        count,
        loading,
        error,
        refresh,
        setCount
    };
};
