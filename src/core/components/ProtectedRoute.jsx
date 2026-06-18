import {
    Navigate
} from "react-router-dom";

import {
    isAuthenticated,
    getRoles
}
from "@/core/utils/auth";

export default function ProtectedRoute({
    children,
    allowedRoles = []
}) {

    if (!isAuthenticated()) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const roles =
        getRoles();

    if (
        allowedRoles.length > 0
    ) {

        const hasAccess =
            allowedRoles.some(
                role =>
                    roles.includes(
                        role
                    )
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