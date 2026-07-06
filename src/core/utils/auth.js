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
    localStorage.setItem("email", response.email || "");
    localStorage.setItem("roles", JSON.stringify(response.roles || []));
    localStorage.setItem("authExpiry", expiryTime.toString());
    
    // Also save under "auth" key for legacy components (like OAuth2SuccessPage / HomePage)
    localStorage.setItem("auth", JSON.stringify({
        userId: response.userId,
        username: response.username,
        email: response.email,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        roles: response.roles
    }));
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

    window.location.href =
        "/login";
};

export const setupGlobalAuthListener = () => {
    const handleAuthCheck = () => {
        const token = localStorage.getItem("accessToken");
        const isLoginPage = window.location.pathname === "/login" || window.location.pathname === "/";
        
        if (!token && !isLoginPage) {
            localStorage.clear();
            window.location.href = "/login";
        }
    };

    window.addEventListener("focus", handleAuthCheck);
    window.addEventListener("storage", (e) => {
        if (e.key === "accessToken" || e.key === null) {
            handleAuthCheck();
        }
    });
};