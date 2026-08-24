import {
    createBrowserRouter,
    Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { Spin } from "antd";

// Layouts (eagerly loaded - needed immediately)
import PublicLayout from "@/layouts/PublicLayout/PublicLayout";
import CustomerLayout from "@/layouts/CustomerLayout/CustomerLayout";
import ProtectedRoute from "@/core/components/ProtectedRoute";
import QrCheckInPage from "@/features/booking/pages/QrCheckInPage";

import ROLES from "@/core/constants/roles";
import { SubscriptionProvider } from "@/features/subscription/context/SubscriptionContext";

// Lazy-loaded layouts
const AdminLayout = lazy(() => import("@/layouts/AdminLayout/AdminLayout"));
const OwnerLayout = lazy(() => import("@/layouts/OwnerLayout/OwnerLayout"));
const StaffLayout = lazy(() => import("@/layouts/StaffLayout"));
const ManagerLayout = lazy(() => import("@/layouts/ManagerLayout"));

// Auth pages (eagerly loaded - shown on first load)
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import OAuth2SuccessPage from "@/features/auth/pages/OAuth2SuccessPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import HomePage from "@/features/auth/pages/HomePage";

// Lazy-loaded Admin pages
const AdminDashboardPage = lazy(() => import("@/features/dashboard/pages/AdminDashboardPage"));
const AdminReviewReportsPage = lazy(() => import("@/features/review/pages/AdminReviewReportsPage"));
const AdminSalonsPage = lazy(() => import("@/features/salon/pages/AdminSalonsPage"));
const AdminSupportTicketPage = lazy(() => import("@/features/support/pages/AdminSupportTicketPage"));
const UserListPage = lazy(() => import("@/features/user/pages/UserListPage"));
const RoleListPage = lazy(() => import("@/features/role/pages/RoleListPage"));
const BranchListPage = lazy(() => import("@/features/branch/pages/BranchListPage"));
const CategoryListPage = lazy(() => import("@/features/category/pages/CategoryListPage"));
const VoucherManagementPage = lazy(() => import("@/features/voucher/pages/VoucherManagementPage"));

// Lazy-loaded Owner pages
const OwnerDashboardPage = lazy(() => import("@/features/dashboard/pages/OwnerDashboardPage"));
const MySalonPage = lazy(() => import("@/features/salon/pages/MySalonPage"));
const ServiceManagementPage = lazy(() => import("@/features/service/pages/ServiceManagementPage"));
const StaffManagementPage = lazy(() => import("@/features/staff/pages/StaffManagementPage"));
const SchedulePage = lazy(() => import("@/features/schedule/pages/SchedulePage"));
const ShiftTemplatePage = lazy(() => import("@/features/shift/pages/ShiftTemplatePage"));
const OffDayManagementPage = lazy(() => import("@/features/offday/pages/OffDayManagementPage"));
const StaffLeaveRequestPage = lazy(() => import("@/features/offday/pages/StaffLeaveRequestPage"));
const OwnerBookingWorkflowPage = lazy(() => import("@/features/booking/pages/OwnerBookingWorkflowPage"));

const NoShowDashboardPage = lazy(() => import("@/features/ai/pages/NoShowDashboardPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const ReviewAdminPage = lazy(() => import("@/features/review/pages/ReviewAdminPage"));

// Lazy-loaded Subscription pages
const SubscriptionPage = lazy(() => import("@/features/subscription/pages/SubscriptionPage"));
const SubscriptionSuccessPage = lazy(() => import("@/features/subscription/pages/SubscriptionSuccessPage"));
const SubscriptionCancelPage = lazy(() => import("@/features/subscription/pages/SubscriptionCancelPage"));
const AdminSubscriptionPage = lazy(() => import("@/features/subscription/pages/AdminSubscriptionPage"));

// Lazy-loaded Customer / Shared pages
const BookingPage = lazy(() => import("@/features/booking/pages/BookingPage"));
const GuestBookingPage = lazy(() => import("@/features/booking/pages/GuestBookingPage"));
const AppointmentsPage = lazy(() => import("@/features/booking/pages/AppointmentsPage"));
const PaymentCallbackPage = lazy(() => import("@/features/payment/pages/PaymentCallbackPage"));
const ProfilePage = lazy(() => import("@/features/user/pages/ProfilePage"));
const CustomerNotificationsPage = lazy(() => import("@/features/notification/pages/CustomerNotificationsPage"));
const HairStyleAiPage = lazy(() => import("@/features/hair-ai/pages/HairStyleAiPage"));
const SearchPage = lazy(() => import("@/features/search/pages/SearchPage"));
const CategoryListUserPage = lazy(() => import("@/features/category/pages/CategoryListUserPage"));
const WalkInBookingPage = lazy(() => import("@/features/booking/pages/WalkInBookingPage"));
const StaffAppointmentsPage = lazy(() => import("@/features/booking/pages/StaffAppointmentsPage"));
const PayAtCounterSuccessPage = lazy(() => import("@/features/booking/pages/PayAtCounterSuccessPage"));
const RecurringSuccessPage = lazy(() => import("@/features/booking/pages/RecurringSuccessPage"));
const HelpCenterPage = lazy(() => import("@/features/support/pages/HelpCenterPage"));
const NearbySalonsPage = lazy(() => import("@/features/geolocation/pages/NearbySalonsPage"));
const SystemMonitoringPage = lazy(() => import("@/features/monitoring/pages/SystemMonitoringPage"));

// Reusable page loader fallback
const PageLoader = () => (
    <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        flexDirection: "column",
        gap: 16
    }}>
        <Spin size="large" />
        <span style={{ color: "#64748b", fontSize: 14 }}>Đang tải trang...</span>
    </div>
);

// Wrap lazy component with Suspense
const withSuspense = (Component) => (
    <Suspense fallback={<PageLoader />}>
        <Component />
    </Suspense>
);

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
    {
        path: "/check-in",
        element: <QrCheckInPage />,
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
                <Suspense fallback={<PageLoader />}>
                    <AdminLayout />
                </Suspense>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: withSuspense(AdminDashboardPage)
            },
            {
                path: "users",
                element: withSuspense(UserListPage)
            },
            {
                path: "roles",
                element: withSuspense(RoleListPage)
            },
            {
                path: "branches",
                element: withSuspense(BranchListPage)
            },
            {
                path: "vouchers",
                element: withSuspense(VoucherManagementPage)
            },
            {
                path: "review-reports",
                element: withSuspense(AdminReviewReportsPage)
            },
            {
                path: "salons",
                element: withSuspense(AdminSalonsPage)
            },
            {
                path: "tickets",
                element: withSuspense(AdminSupportTicketPage)
            },
            {
                path: "subscriptions",
                element: withSuspense(AdminSubscriptionPage)
            },
            {
                path: "monitoring",
                element: withSuspense(SystemMonitoringPage)
            },
        ]
    },
    {
        path: "/monitoring",
        element: withSuspense(SystemMonitoringPage)
    },
    {
        path: "/owner",
        element: (
            <ProtectedRoute
                allowedRoles={[
                    "SALON_OWNER"
                ]}
            >
                <SubscriptionProvider>
                    <Suspense fallback={<PageLoader />}>
                        <OwnerLayout />
                    </Suspense>
                </SubscriptionProvider>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: withSuspense(OwnerDashboardPage)
            },
            {
                path: "dashboard/:tab?",
                element: withSuspense(OwnerDashboardPage)
            },
            {
                path: "branches",
                element: withSuspense(BranchListPage)
            },
            {
                path: "salon",
                element: withSuspense(MySalonPage)
            },
            {
                path: "services",
                element: withSuspense(ServiceManagementPage)
            },
            {
                path: "staff",
                element: withSuspense(StaffManagementPage)
            },
            {
                path: "schedule",
                element: withSuspense(SchedulePage)
            },
            {
                path: "shifts",
                element: withSuspense(ShiftTemplatePage)
            },
            {
                path: "off-days",
                element: withSuspense(OffDayManagementPage)
            },
            {
                path: "reviews",
                element: withSuspense(ReviewAdminPage)
            },
            {
                path: "categories",
                element: withSuspense(CategoryListPage)
            },
            {
                path: "vouchers",
                element: withSuspense(VoucherManagementPage)
            },


            {
                path: "ai-no-show",
                element: withSuspense(NoShowDashboardPage)
            },
            {
                path: "reports",
                element: withSuspense(ReportsPage)
            },
            {
                path: "support",
                element: withSuspense(HelpCenterPage)
            },
            {
                path: "subscription",
                element: withSuspense(SubscriptionPage)
            },
            {
                path: "subscription/success",
                element: withSuspense(SubscriptionSuccessPage)
            },
            {
                path: "subscription/cancel",
                element: withSuspense(SubscriptionCancelPage)
            }
        ]
    },

    // STAFF AREA (Thợ)
    {
        path: "/staff",
        element: (
            <ProtectedRoute allowedRoles={["STAFF"]}>
                <Suspense fallback={<PageLoader />}>
                    <StaffLayout />
                </Suspense>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/staff/schedule" replace />
            },
            {
                path: "schedule",
                element: <SchedulePage />
            },
            {
                path: "appointments",
                element: withSuspense(StaffAppointmentsPage)
            },
            {
                path: "leave-requests",
                element: withSuspense(StaffLeaveRequestPage)
            }
        ]
    },

    // MANAGER / POS AREA (Lễ tân / Quản lý)
    {
        path: "/manager",
        element: (
            <ProtectedRoute allowedRoles={["MANAGER", "BRANCH_MANAGER", "SALON_OWNER"]}>
                <Suspense fallback={<PageLoader />}>
                    <ManagerLayout />
                </Suspense>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/manager/walk-in" replace />
            },
            {
                path: "pos",
                element: <Navigate to="/manager/walk-in" replace />
            },
            {
                path: "walk-in",
                element: withSuspense(WalkInBookingPage)
            },
            {
                path: "off-days",
                element: withSuspense(OffDayManagementPage)
            },
            {
                path: "leave-requests",
                element: withSuspense(StaffLeaveRequestPage)
            },

            {
                path: "bookings",
                element: withSuspense(OwnerBookingWorkflowPage)
            }
        ]
    },




    // PUBLIC AREA (guest)
    {
        path: "/",
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "home",
                element: <HomePage />,
            },
            {
                path: "search",
                element: withSuspense(SearchPage)
            },
            {
                path: "services",
                element: withSuspense(CategoryListUserPage)
            },
            {
                path: "nearby",
                element: withSuspense(SearchPage)
            },
            {
                path: "salons/nearby",
                element: withSuspense(SearchPage)
            },
            {
                path: "guest-booking",
                element: withSuspense(GuestBookingPage)
            },
        ]
    },

    // AUTHENTICATED CUSTOMER AREA
    {
        path: "/",
        element: (
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.SALON_OWNER, ROLES.STAFF, ROLES.SUPER_ADMIN]}>
                <CustomerLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "/nearby",
                element: withSuspense(SearchPage)
            },
            {
                path: "/salons/nearby",
                element: withSuspense(SearchPage)
            },
            {
                path: "/booking",
                element: withSuspense(BookingPage)
            },
            {
                path: "/booking/pay-at-counter-success",
                element: withSuspense(PayAtCounterSuccessPage)
            },
            {
                path: "/recurring-success",
                element: withSuspense(RecurringSuccessPage)
            },
            {
                path: "/appointments",
                element: withSuspense(AppointmentsPage)
            },
            {
                path: "/payment/callback",
                element: withSuspense(PaymentCallbackPage)
            },
            {
                path: "/profile",
                element: withSuspense(ProfilePage)
            },
            {
                path: "/hair-ai",
                element: (
                    <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
                        <Suspense fallback={<PageLoader />}>
                            <HairStyleAiPage />
                        </Suspense>
                    </ProtectedRoute>
                )
            },
            {
                path: "/notifications",
                element: withSuspense(CustomerNotificationsPage)
            },
            {
                path: "/reports",
                element: withSuspense(ReportsPage)
            }
        ]
    }
]);

export default router;
