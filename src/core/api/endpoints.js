export const API_BASE_URL = "http://localhost:9090";

export const ENDPOINTS = {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    REFRESH_TOKEN: "/api/v1/auth/refresh-token",
    LOGOUT: "/api/v1/auth/logout",

    SEND_OTP: "/api/v1/auth/send-otp",
    VERIFY_EMAIL: "/api/v1/auth/verify-email",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    RESET_PASSWORD: "/api/v1/auth/reset-password",

    // Media
    MEDIA_UPLOAD: "/api/v1/media/upload",
    MEDIA_INVOICE: "/api/v1/media/invoice",

    // Users
    USERS: "/api/v1/users",

    // Roles
    ROLES: "/api/v1/roles",
    BRANCHES: "/api/v1/branches",
    MY_BRANCHES: "/api/v1/branches/my-branches",

    // Salons
    SALONS: "/api/v1/salons",
    MY_SALON: "/api/v1/salons/me",
    SEARCH_BRANCHES: "/api/v1/branches/search",

    // Vouchers
    VOUCHERS: "/api/vouchers",
    VOUCHERS_BATCH: "/api/vouchers/batch",
    VOUCHERS_VALIDATE: "/api/vouchers/validate",

    // Notifications
    NOTIFICATIONS: "/api/v1/notifications",
    NOTIFICATION_UNREAD_COUNT: "/api/v1/notifications/unread-count",
    NOTIFICATION_MARK_READ: (id) => `/api/v1/notifications/${id}/read`,
    NOTIFICATION_READ_ALL: "/api/v1/notifications/read-all",
    FCM_TOKENS: "/api/v1/notifications/fcm-tokens",
    // Reviews
    ADMIN_REVIEWS: "/api/v1/admin/reviews",
    ADMIN_REVIEW_SUMMARY: "/api/v1/admin/reviews/summary",
    OWNER_REVIEW_AI_TRIGGER: "/api/v1/owner/reviews/ai/trigger",

    // Zalo OA & ZNS
    ZALO_CONNECT_URL: "/api/v1/zalo/connect-url",
    ZALO_CONNECT: "/api/v1/zalo/connect",
    ZALO_TEST_ZNS: "/api/v1/zalo/test-zns",

    // Reviews
    BOOKING_REVIEWS: (id) => `/api/v1/bookings/${id}/reviews`,
    SALON_REVIEWS: (salonId) => `/api/v1/salons/${salonId}/reviews`,
    SALON_REVIEW_SUMMARY: (salonId) => `/api/v1/salons/${salonId}/review-summary`,

    // AI Smart Scheduling
    SMART_SCHEDULING_RECOMMEND: "/api/ai/smart-scheduling/recommend",
    SMART_SCHEDULING_CONFIG: "/api/ai/smart-scheduling/config",
    SMART_SCHEDULING_LOGS: "/api/ai/smart-scheduling/logs"
};


