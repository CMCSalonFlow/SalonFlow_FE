const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const isSessionExpired = () => {
    const expiry = localStorage.getItem("authExpiry");
    if (!expiry) return false;
    return Date.now() > parseInt(expiry, 10);
};

export const checkAuthSession = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;

    if (isSessionExpired()) {
        localStorage.clear();
        return false;
    }
    return true;
};

export const saveAuthData = (response) => {
    const expiryTime = Date.now() + SESSION_DURATION;
    
    localStorage.setItem("accessToken", response.accessToken || "");
    localStorage.setItem("refreshToken", response.refreshToken || "");
    localStorage.setItem("userId", response.userId || "");
    localStorage.setItem("username", response.username || "");
    localStorage.setItem("fullName", response.fullName || "");
    localStorage.setItem("email", response.email || "");
    localStorage.setItem("roles", JSON.stringify(response.roles || []));
    localStorage.setItem("mustChangePassword", response.mustChangePassword ? "true" : "false");
    localStorage.setItem("authExpiry", expiryTime.toString());
    
    // Also save under "auth" key for legacy components (like OAuth2SuccessPage / HomePage)
    localStorage.setItem("auth", JSON.stringify({
        userId: response.userId,
        username: response.username,
        fullName: response.fullName,
        email: response.email,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        roles: response.roles,
        mustChangePassword: response.mustChangePassword
    }));
};

export const getStoredAuthData = () => {
    try {
        const authStr = localStorage.getItem("auth");
        if (authStr) {
            const auth = JSON.parse(authStr);
            return {
                userId: auth?.userId ?? localStorage.getItem("userId") ?? "",
                username: auth?.username ?? localStorage.getItem("username") ?? "",
                fullName: auth?.fullName ?? localStorage.getItem("fullName") ?? "",
                email: auth?.email ?? localStorage.getItem("email") ?? "",
                accessToken: auth?.accessToken ?? localStorage.getItem("accessToken") ?? "",
                refreshToken: auth?.refreshToken ?? localStorage.getItem("refreshToken") ?? "",
                roles: Array.isArray(auth?.roles)
                    ? auth.roles
                    : JSON.parse(localStorage.getItem("roles") || "[]")
            };
        }
    } catch (error) {
        console.warn("Failed to parse auth data from localStorage:", error);
    }

    return {
        userId: localStorage.getItem("userId") || "",
        username: localStorage.getItem("username") || "",
        fullName: localStorage.getItem("fullName") || "",
        email: localStorage.getItem("email") || "",
        accessToken: localStorage.getItem("accessToken") || "",
        refreshToken: localStorage.getItem("refreshToken") || "",
        roles: JSON.parse(localStorage.getItem("roles") || "[]")
    };
};

export const getToken = () => {
    if (isSessionExpired()) {
        localStorage.clear();
        return null;
    }
    return localStorage.getItem("accessToken");
};

export const getRoles = () => {
    if (isSessionExpired()) {
        localStorage.clear();
        return [];
    }
    try {
        return JSON.parse(
            localStorage.getItem("roles") || "[]"
        );
    } catch (e) {
        return [];
    }
};

export const isAuthenticated = () => {
    return !!getToken();
};

export const hasRole = (
    role
) => {

    return getRoles()
        .includes(role);
};

export const logout = () => {
    localStorage.clear();
    window.location.href = "/";
};

export const setupGlobalAuthListener = () => {
    const handleAuthCheck = () => {
        const token = localStorage.getItem("accessToken");
        const path = window.location.pathname;
        const isPublicPath =
            path === "/" ||
            path === "/home" ||
            path === "/login" ||
            path === "/register" ||
            path === "/forgot-password" ||
            path === "/reset-password" ||
            path === "/verify-email" ||
            path === "/force-change-password" ||
            path === "/oauth2/success" ||
            path === "/search" ||
            path === "/nearby" ||
            path === "/services" ||
            path === "/guest-booking" ||
            path === "/public-booking" ||
            path === "/booking/pay-at-counter-success" ||
            path === "/payment/callback" ||
            path.startsWith("/salons");

        if (!token && !isPublicPath) {
            localStorage.clear();
            window.location.href = "/";
        }
    };

    window.addEventListener("focus", handleAuthCheck);
    window.addEventListener("storage", (e) => {
        if (e.key === "accessToken" || e.key === null) {
            handleAuthCheck();
        }
    });
};
