import {
    createBrowserRouter,
    Navigate,
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
import CategoryListPage
    from "@/features/category/pages/CategoryListPage";
import PublicLayout from "@/layouts/PublicLayout/PublicLayout";
import SearchPage from "@/features/search/pages/SearchPage";
import CategoryListUserPage
    from "@/features/category/pages/CategoryListUserPage";
import MySalonPage from "@/features/salon/pages/MySalonPage";
import ServiceManagementPage from "@/features/service/pages/ServiceManagementPage";
import StaffManagementPage from "@/features/staff/pages/StaffManagementPage";
import BookingPage from "@/features/booking/pages/BookingPage";
import GuestBookingPage from "@/features/booking/pages/GuestBookingPage";
import PayAtCounterSuccessPage from "@/features/booking/pages/PayAtCounterSuccessPage";
import RecurringSuccessPage from "@/features/booking/pages/RecurringSuccessPage";
import AppointmentsPage from "@/features/booking/pages/AppointmentsPage";
import SchedulePage from "@/features/schedule/pages/SchedulePage";
import ShiftTemplatePage from "@/features/shift/pages/ShiftTemplatePage";
import OffDayManagementPage from "@/features/offday/pages/OffDayManagementPage";
import CancellationPolicyPage from "@/features/booking/pages/CancellationPolicyPage";
import WalkInBookingPage from "@/features/booking/pages/WalkInBookingPage";
import PaymentCallbackPage from "@/features/payment/pages/PaymentCallbackPage";
import VoucherManagementPage from "@/features/voucher/pages/VoucherManagementPage";

const router = createBrowserRouter([
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
                path: "vouchers",
                element: <VoucherManagementPage />
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
            },
            {
                path: "staff",
                element: <StaffManagementPage />
            }, {
                path: "schedule",
                element: <SchedulePage />
            },
            {
                path: "walk-in-booking",
                element: <WalkInBookingPage />
            },
            {
                path: "shifts",
                element: <ShiftTemplatePage />
            },
            {
                path: "off-days",
                element: <OffDayManagementPage />
            },
            {
                path: "categories",
                element: <CategoryListPage />
            },
            {
                path: "cancellation-policy",
                element: <CancellationPolicyPage />
            }
        ]
    },
    ///USER AREA///
    {
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <HomePage />
            },
            {
                path: "home",
                element: <HomePage />
            },
            {
                path: "search",
                element: <SearchPage />
            },
            {
                path: "services",
                element: <CategoryListUserPage />
            },
            {
                path: "guest-booking",
                element: <GuestBookingPage />
            },
            {
                path: "public-booking",
                element: <GuestBookingPage />
            },
            {
                path: "booking/pay-at-counter-success",
                element: <PayAtCounterSuccessPage />
            },
        ]
    },
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
                path: "/services",
                element: <CategoryListUserPage />
            },
            {
                path: "/categories",
                element: <CategoryListUserPage />
            },
            {
                path: "/booking",
                element: <BookingPage />
            },
            {
                path: "/guest-booking",
                element: <Navigate to="/booking" replace />
            },
            {
                path: "/public-booking",
                element: <Navigate to="/booking" replace />
            },
            {
                path: "/booking/pay-at-counter-success",
                element: <PayAtCounterSuccessPage />
            },
            {
                path: "/booking/recurring-success",
                element: <RecurringSuccessPage />
            },
            {
                path: "/appointments",
                element: <AppointmentsPage />
            },
            {
                path: "/payment/callback",
                element: <PaymentCallbackPage />
            },
            {
                path: "/search",
                element: <SearchPage />
            }
        ]
    },
    {
        element: <PublicLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />
            },
            {
                path: "/home",
                element: <HomePage />
            },
            {
                path: "/search",
                element: <SearchPage />
            },
            {
                path: "/services",
                element: <CategoryListUserPage />
            },
            {
                path: "/booking",
                element: <BookingPage />
            },

        ]
    }
]);

export default router;
