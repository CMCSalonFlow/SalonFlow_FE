import {
    createBrowserRouter,
} from "react-router-dom";

import LoginPage from
"@/features/auth/pages/LoginPage";

import RegisterPage from
"@/features/auth/pages/RegisterPage";
import OAuth2SuccessPage from
"@/features/auth/pages/OAuth2SuccessPage";
const router =
    createBrowserRouter([
        {
            path: "/",
            element: <LoginPage />,
        },
        {
            path: "/login",
            element: <LoginPage />,
        },
        {
            path: "/register",
            element: <RegisterPage />,
        },
        {
            path: "/oauth2/success",
            element: <OAuth2SuccessPage />
        },
    ]);

export default router;