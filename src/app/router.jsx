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

import ProtectedRoute
from "@/core/components/ProtectedRoute";

import AdminLayout
from "@/layouts/AdminLayout/AdminLayout";
import OwnerLayout
from "@/layouts/OwnerLayout/OwnerLayout";

import CustomerLayout
from "@/layouts/CustomerLayout/CustomerLayout";
import HomePage
from "@/features/auth/pages/HomePage";

import AdminDashboardPage
from "@/features/dashboard/pages/AdminDashboardPage";
import OwnerDashboardPage
from "@/features/dashboard/pages/OwnerDashboardPage";
import UserListPage
from "@/features/user/pages/UserListPage";

import RoleListPage
from "@/features/role/pages/RoleListPage";

import BranchListPage
from "@/features/branch/pages/BranchListPage";
import  CategoryListPage 
from "@/features/category/pages/CategoryListPage";

import CategoryListUserPage 
from "@/features/category/pages/CategoryListUserPage";
import MySalonPage from "@/features/salon/pages/MySalonPage";
import SalonListPage from "@/features/salon/pages/SalonListPage";
import ServiceManagementPage from "@/features/service/pages/ServiceManagementPage";

const router = createBrowserRouter([
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

    // ADMIN AREA
    {
        path: "/admin",
        element: (
            <ProtectedRoute
                allowedRoles={[
                    "SUPER_ADMIN"
                ]}
            >
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboardPage />
            },
            {
                path: "users",
                element: <UserListPage />
            },
            {
                path: "roles",
                element: <RoleListPage />
            },
            {
                path: "branches",
                element: <BranchListPage />
            },
            {
                path: "categories",
                element: <CategoryListPage />
            },
            {
                path: "schedule",
                element: <SchedulePage />
            },
        ]
    },
    {
        path: "/owner",
        element: (
            <ProtectedRoute
                allowedRoles={[
                    "SALON_OWNER"
                ]}
            >
                <OwnerLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <OwnerDashboardPage />
            },
            {
                path: "branches",
                element: <BranchListPage />
            },
            {
                path: "salon",
                element: <MySalonPage />
            },
            {
                path: "services",
                element: <ServiceManagementPage />
            }
        ]
    },
    ///USER AREA///
        {
        element:
            <CustomerLayout />,
        children: [

            {
                path: "/home",
                element:
                    <HomePage />
            },

            {
                path: "/services",           // ← Trang xem danh mục cho khách hàng
                element: <CategoryListUserPage />
            },
            {
                path: "/categories",         // Có thể thêm route này nữa cho dễ truy cập
                element: <CategoryListUserPage />
            }

        ]
    }
]);

export default router;