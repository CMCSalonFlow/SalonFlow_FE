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

    // Loyalty Points
    LOYALTY_SUMMARY: "/api/v1/loyalty/summary",
    LOYALTY_HISTORY: "/api/v1/loyalty/history",
    LOYALTY_REDEEM: "/api/v1/loyalty/redeem"
};