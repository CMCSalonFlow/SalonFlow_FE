import axios from "axios";
import { saveAuthData } from "../utils/auth";
import { ENDPOINTS, API_BASE_URL } from "./endpoints";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

const isPublicRoute = (pathname) => {
    return (
        pathname === "/" ||
        pathname === "/home" ||
        pathname === "/services" ||
        pathname === "/guest-booking" ||
        pathname === "/public-booking" ||
        pathname === "/booking/pay-at-counter-success" ||
        pathname === "/payment/callback" ||
        pathname === "/search" ||
        pathname === "/nearby" ||
        pathname === "/categories" ||
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/salons")
    );
};

export function attachInterceptors(api) {

    api.interceptors.request.use(
        (config) => {
            if (!navigator.onLine) {
                const method = config.method ? config.method.toUpperCase() : "GET";
                if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
                    const error = new Error("Bạn đang offline. Không thể thực hiện thao tác này.");
                    error.isOfflineError = true;
                    return Promise.reject(error);
                }
            }
            const skipAuth = config.skipAuth === true;

            const token =
                localStorage.getItem(
                    "accessToken"
                );

            const branchId =
                localStorage.getItem(
                    "currentBranchId"
                );

            if (token && !skipAuth) {

                config.headers.Authorization =
                    `Bearer ${token}`;
            }

            if (branchId) {

                config.headers[
                    "X-Branch-Id"
                ] = branchId;
            }

            return config;
        },
        (error) =>
            Promise.reject(error)
    );

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                if (originalRequest.skipAuth) {
                    return Promise.reject(error);
                }
                
                const clearAuthAndRedirect = () => {
                    localStorage.clear();
                    sessionStorage.removeItem("homepage_stats");
                    window.location.href = "/login";
                };

                // If it is the login or refresh token request itself, don't try to refresh to prevent loops
                if (originalRequest.url?.includes(ENDPOINTS.LOGIN) || originalRequest.url?.includes(ENDPOINTS.REFRESH_TOKEN)) {
                    clearAuthAndRedirect();
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    try {
                        // Use raw axios instance to bypass interceptors and avoid loops
                        const refreshResponse = await axios.post(`${API_BASE_URL}${ENDPOINTS.REFRESH_TOKEN}`, {
                            refreshToken
                        });

                        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

                        const rolesStr = localStorage.getItem("roles");
                        const userId = localStorage.getItem("userId");
                        const username = localStorage.getItem("username");
                        const email = localStorage.getItem("email");

                        saveAuthData({
                            accessToken: newAccessToken,
                            refreshToken: newRefreshToken,
                            userId,
                            username,
                            email,
                            roles: rolesStr ? JSON.parse(rolesStr) : []
                        });

                        isRefreshing = false;
                        processQueue(null, newAccessToken);

                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return api(originalRequest);
                    } catch (refreshError) {
                        isRefreshing = false;
                        processQueue(refreshError, null);

                        const errorInfo = {
                            url: originalRequest.url,
                            method: originalRequest.method,
                            status: 401,
                            data: refreshError.response?.data || "Refresh token failed or expired",
                            timestamp: new Date().toISOString()
                        };
                        sessionStorage.setItem("lastAuthError", JSON.stringify(errorInfo));

                        clearAuthAndRedirect();
                        return Promise.reject(refreshError);
                    }
                } else {
                    const errorInfo = {
                        url: originalRequest.url,
                        method: originalRequest.method,
                        status: 401,
                        data: "No refresh token available",
                        timestamp: new Date().toISOString()
                    };
                    sessionStorage.setItem("lastAuthError", JSON.stringify(errorInfo));

                    clearAuthAndRedirect();
                }
            }
            return Promise.reject(error);
        }
    );
}
