import * as Sentry from "@sentry/react";

/**
 * Khởi tạo Sentry SDK cho Frontend React
 */
export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN || "";
    const isProd = import.meta.env.PROD;

    // Khởi tạo Sentry (ngay cả khi chưa truyền DSN thật, Sentry SDK sẽ chạy ở chế độ no-op an toàn không gây crash)
    Sentry.init({
        dsn: dsn || "https://mock_sentry_key@o0.ingest.sentry.io/0",
        enabled: Boolean(dsn) || !isProd,
        environment: import.meta.env.MODE || "development",
        release: "salonflow-fe@1.0.0",
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // 100% traces trong môi trường dev/staging
        tracePropagationTargets: ["localhost", /^\/api\/v1/],
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event, hint) {
            // Không gửi các network cancellation error không cần thiết
            if (event.exception) {
                console.warn("[Sentry Captured Error]:", hint?.originalException || event);
            }
            return event;
        },
    });

    console.log("[Monitoring] Sentry SDK initialized for Frontend");
};

/**
 * Bắt và gửi lỗi thủ công lên Sentry
 */
export const captureErrorToSentry = (error, context = {}) => {
    try {
        Sentry.withScope((scope) => {
            if (context.tags) {
                scope.setTags(context.tags);
            }
            if (context.extra) {
                scope.setExtras(context.extra);
            }
            if (context.level) {
                scope.setLevel(context.level);
            }
            Sentry.captureException(error);
        });
    } catch (e) {
        console.error("[Sentry] Failed to capture error:", e);
    }
};

/**
 * Gắn thông tin User vào ngữ cảnh Sentry khi đăng nhập
 */
export const setSentryUser = (user) => {
    if (!user) {
        Sentry.setUser(null);
        return;
    }
    Sentry.setUser({
        id: user.id ? String(user.id) : undefined,
        email: user.email || undefined,
        username: user.fullName || user.username || undefined,
        role: user.role || undefined,
    });
};

export { Sentry };
