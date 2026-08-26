export const ENDPOINTS = {
  LOGIN: "/api/v1/auth/login",
  REGISTER: "/api/v1/auth/register",
  REFRESH_TOKEN: "/api/v1/auth/refresh-token",
  LOGOUT: "/api/v1/auth/logout",

  SEARCH_BRANCHES: "/api/v1/branches/search",
  BOOKINGS: (branchId) => `/api/v1/branches/${branchId}/bookings`,
  PUBLIC_BOOKINGS: (branchId) => `/api/v1/branches/${branchId}/guest-bookings`,
  AVAILABILITY: (branchId) => `/api/v1/branches/${branchId}/bookings/availability`,
  PUBLIC_AVAILABILITY: (branchId, staffId) => `/api/v1/branches/${branchId}/staff/${staffId}/availability`,
  APPOINTMENTS: "/api/v1/bookings/me",
  PROFILE: "/api/v1/users/me",
};

