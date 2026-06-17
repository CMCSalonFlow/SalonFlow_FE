import {
    createBrowserRouter,
} from "react-router-dom";

import LoginPage from
"@/features/auth/pages/LoginPage";

import RegisterPage from
"@/features/auth/pages/RegisterPage";
import OAuth2SuccessPage from
"@/features/auth/pages/OAuth2SuccessPage";
import VerifyEmailPage
from "@/features/auth/pages/VerifyEmailPage";

import ForgotPasswordPage
from "@/features/auth/pages/ForgotPasswordPage";

import ResetPasswordPage
from "@/features/auth/pages/ResetPasswordPage";

import HomePage from "@/features/auth/pages/HomePage";

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
        {
            path: "/verify-email",
            element: <VerifyEmailPage />,
        },
        {
            path: "/forgot-password",
            element: <ForgotPasswordPage />,
        },
        {
            path: "/reset-password",
            element: <ResetPasswordPage />,
        },
        {
            path: "/home",
            element: <HomePage />,
        }
    ]);

export default router;