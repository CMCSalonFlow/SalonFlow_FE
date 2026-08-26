import { Navigate, useLocation } from "react-router-dom";
import { checkAuthSession, getToken, getRoles } from "../utils/auth";

export default function ProtectedRoute({
    children,
    allowedRoles = [],
}) {

    const location = useLocation();

    const isSessionValid = checkAuthSession();

    if (!isSessionValid) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: `${location.pathname}${location.search}` }}
            />
        );
    }

    const token = getToken();

    const roles = getRoles();


    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: `${location.pathname}${location.search}` }}
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
