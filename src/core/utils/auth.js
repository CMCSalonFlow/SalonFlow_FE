export const getToken = () => {
    return localStorage.getItem(
        "accessToken"
    );
};

export const getRoles = () => {
    return JSON.parse(
        localStorage.getItem("roles")
        || "[]"
    );
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