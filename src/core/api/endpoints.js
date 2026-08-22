export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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

    // Hair AI
    HAIR_STYLE_ANALYZE: "/api/v1/hair-styles/analyze",
    HAIR_STYLE_TRY_ON: "/api/v1/hair-styles/try-on",
    HAIR_STYLE_CONFIRM: "/api/v1/hair-styles/confirm",
    HAIR_STYLE_PROFILE: "/api/v1/hair-styles/profile",

    // Service Description AI
    SERVICE_DESCRIPTION_GENERATE: (salonId) => `/api/v1/owner/salons/${salonId}/ai/service-descriptions/generate`,
    SERVICE_DESCRIPTION_QUOTA: (salonId) => `/api/v1/owner/salons/${salonId}/ai/service-descriptions/quota`,

    // Users
    USERS: "/api/v1/users",

    // Roles
    ROLES: "/api/v1/roles",
    BRANCHES: "/api/v1/branches",
    MY_BRANCHES: "/api/v1/branches/my-branches",

    // Salons
    SALONS: "/api/v1/salons",
    MY_SALON: "/api/v1/salons/me",
    SALONS_NEARBY: "/api/v1/salons/nearby",
    SEARCH_BRANCHES: "/api/v1/branches/search",

    // Vouchers
    VOUCHERS: "/api/v1/vouchers",
    VOUCHERS_BATCH: "/api/v1/vouchers/batch",
    VOUCHERS_VALIDATE: "/api/v1/vouchers/validate",

    // System Off-Days / Holidays
    SYSTEM_OFF_DAYS: "/api/v1/system-off-days",

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
    SMART_SCHEDULING_LOGS: "/api/ai/smart-scheduling/logs",

    // AI No-Show Prediction
    NO_SHOW_PREDICT: (bookingId) => `/api/v1/ai/no-show/predict/${bookingId}`,
    NO_SHOW_HIGH_RISK: "/api/v1/ai/no-show/high-risk",
    NO_SHOW_LOGS: "/api/v1/ai/no-show/logs",
    NO_SHOW_SEND_REMINDER: (bookingId) => `/api/v1/ai/no-show/send-reminder/${bookingId}`,
    NO_SHOW_CONFIG: "/api/v1/ai/no-show/config",
    NO_SHOW_EVALUATIONS: "/api/v1/ai/no-show/evaluations",
    NO_SHOW_EVALUATION_TRIGGER: "/api/v1/ai/no-show/evaluations/trigger",

    // Analytics
    ANALYTICS_OVERVIEW: "/api/v1/owner/analytics/overview",
    ANALYTICS_REVENUE: "/api/v1/owner/analytics/revenue",
    ANALYTICS_PEAK_HOURS: "/api/v1/owner/analytics/peak-hours",
    CUSTOMER_ANALYTICS_OVERVIEW: "/api/v1/owner/analytics/customers/overview",
    CUSTOMER_ANALYTICS_FUNNEL: "/api/v1/owner/analytics/customers/funnel",
    CUSTOMER_ANALYTICS_SEGMENTS: "/api/v1/owner/analytics/customers/segments",
    CUSTOMER_ANALYTICS_AI_GENERATE: "/api/v1/owner/analytics/customers/campaigns/ai-generate",
    CUSTOMER_ANALYTICS_EXECUTE_CAMPAIGN: "/api/v1/owner/analytics/customers/campaigns/execute",
    CUSTOMER_ANALYTICS_CAMPAIGN_HISTORY: "/api/v1/owner/analytics/customers/campaigns/history",

    // Subscriptions
    SUBSCRIPTION_ME: "/api/v1/subscriptions/me",
    SUBSCRIPTION_HISTORY: "/api/v1/subscriptions/history",
    SUBSCRIPTION_CHECKOUT: "/api/v1/subscriptions/checkout",
    SUBSCRIPTION_PORTAL: "/api/v1/subscriptions/portal",
    SUBSCRIPTION_ADMIN_MANUAL: "/api/v1/subscriptions/admin/manual",
    SUBSCRIPTION_ADMIN_LIST: "/api/v1/subscriptions/admin",
    SUBSCRIPTION_ADMIN_BY_ID: (id) => `/api/v1/subscriptions/admin/${id}`
};







