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

        // Users
    USERS: "/api/v1/users",

    // Roles
    ROLES: "/api/v1/roles",
    BRANCHES:
        "/api/v1/branches",

    MY_BRANCHES:
        "/api/v1/branches/my-branches"
};