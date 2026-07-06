import { Navigate } from "react-router-dom";
import { checkAuthSession, getToken, getRoles } from "../utils/auth";

export default function ProtectedRoute({
    children,
    allowedRoles = [],
}) {

    const isSessionValid = checkAuthSession();

    if (!isSessionValid) {
        return (
            <Navigate
                to="/login"
                replace
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