import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
    children,
    allowedRoles = [],
}) {

    const token =
        localStorage.getItem("accessToken");

    const roles =
        JSON.parse(
            localStorage.getItem("roles") || "[]"
        );

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (allowedRoles.length > 0) {

        const hasAccess =
            allowedRoles.some(role =>
                roles.includes(role)
            );

        if (!hasAccess) {
            return (
                <Navigate
                    to="/login"
                    replace
                />
            );
        }
    }

    return children;
}