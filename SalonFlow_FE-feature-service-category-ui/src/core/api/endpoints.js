export const API_BASE_URL = "http://localhost:9090";

export const ENDPOINTS = {
    // ── Auth ─────────────────────────────────────────────────
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    REFRESH_TOKEN: "/api/v1/auth/refresh-token",
    LOGOUT: "/api/v1/auth/logout",
    SEND_OTP: "/api/v1/auth/send-otp",
    VERIFY_EMAIL: "/api/v1/auth/verify-email",
    FORGOT_PASSWORD: "/api/v1/auth/forgot-password",
    RESET_PASSWORD: "/api/v1/auth/reset-password",

    // ── Users ─────────────────────────────────────────────────
    USERS: "/api/v1/users",

    // ── Roles ─────────────────────────────────────────────────
    ROLES: "/api/v1/roles",

    // ── Categories ────────────────────────────────────────────
    CATEGORIES: "/api/v1/categories",
    CATEGORY_DETAIL: (id) => `/api/v1/categories/${id}`,
    CATEGORY_ORDER: "/api/v1/categories/order",

    // ── Services ──────────────────────────────────────────────
    // Dùng: ENDPOINTS.SERVICES(salonId)
    SERVICES: (salonId) => `/api/v1/salons/${salonId}/services`,
    // Dùng: ENDPOINTS.SERVICE_DETAIL(salonId, serviceId)
    SERVICE_DETAIL: (salonId, serviceId) =>
        `/api/v1/salons/${salonId}/services/${serviceId}`,

    // ── Shifts ────────────────────────────────────────────────
    SHIFT_TEMPLATES: "/api/v1/shifts/templates",
    SHIFT_TEMPLATE_DETAIL: (templateId) =>
        `/api/v1/shifts/templates/${templateId}`,
    SHIFT_TEMPLATE_APPLY: (templateId) =>
        `/api/v1/shifts/templates/${templateId}/apply`,
    SHIFTS_BY_USER_WEEK: "/api/v1/shifts/user",
    SHIFTS_BY_BRANCH_DATE: (branchId) =>
        `/api/v1/shifts/branch/${branchId}/date`,
    SHIFTS_AVAILABILITY: (branchId) =>
        `/api/v1/shifts/branch/${branchId}/availability`,

    // ── Media ─────────────────────────────────────────────────
    MEDIA_UPLOAD: "/api/v1/media/upload",
};