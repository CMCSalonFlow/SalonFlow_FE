import { createBrowserRouter } from "react-router-dom";

// ── Auth ──────────────────────────────────────────────────────
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import OAuth2SuccessPage from "@/features/auth/pages/OAuth2SuccessPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";

// ── Layouts ───────────────────────────────────────────────────
import AdminLayout from "@/layouts/AdminLayout/AdminLayout";
import CustomerLayout from "@/layouts/CustomerLayout/CustomerLayout";
import { OwnerLayout } from "@/layouts/OwnerLayout/index";

// ── Guards ────────────────────────────────────────────────────
import ProtectedRoute from "@/core/components/ProtectedRoute";

// ── Admin pages ───────────────────────────────────────────────
import AdminDashboardPage from "@/features/dashboard/pages/AdminDashboardPage";
import UserListPage from "@/features/user/pages/UserListPage";
import RoleListPage from "@/features/role/pages/RoleListPage";
import BranchListPage from "@/features/branch/pages/BranchListPage";
import CategoryListPage from "@/features/category/pages/CategoryListPage";

// ── Customer pages ────────────────────────────────────────────
import HomePage from "@/features/auth/pages/HomePage";
import CategoryListUserPage from "@/features/category/pages/CategoryListUserPage";

// ── Owner pages (THÊM MỚI) ───────────────────────────────────
import ServiceListPage from "@/features/service/pages/ServiceListPage";
import ShiftTemplatePage from "@/features/shift/pages/ShiftTemplatePage";

const router = createBrowserRouter([

    // ── Public routes ─────────────────────────────────────────
    { path: "/", element: <LoginPage /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/oauth2/success", element: <OAuth2SuccessPage /> },
    { path: "/verify-email", element: <VerifyEmailPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },

    // ── Admin routes ──────────────────────────────────────────
    {
        path: "/admin",
        element: (
            <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <AdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <AdminDashboardPage /> },
            { path: "users", element: <UserListPage /> },
            { path: "roles", element: <RoleListPage /> },
            { path: "branches", element: <BranchListPage /> },
            { path: "categories", element: <CategoryListPage /> },
        ],
    },

    // ── Owner routes (THÊM MỚI) ───────────────────────────────
    // Salon owner quản lý dịch vụ và lịch làm việc nhân viên
    {
        path: "/owner",
        element: (
            <ProtectedRoute allowedRoles={["SALON_OWNER"]}>
                <OwnerLayout />
            </ProtectedRoute>
        ),
        children: [
            // Quản lý dịch vụ: /owner/salons/:salonId/services
            // Tạm dùng salonId=1, sau thay bằng useParams()
            {
                path: "salons/:salonId/services",
                element: <ServiceListPage />,
            },

            // Quản lý ca làm việc: /owner/shifts
            {
               path: "shifts",
                element: <ShiftTemplatePage />,
            },
        ],
    },

    // ── Customer routes ───────────────────────────────────────
    {
        element: <CustomerLayout />,
        children: [
            { path: "/home", element: <HomePage /> },
            { path: "/services", element: <CategoryListUserPage /> },
            { path: "/categories", element: <CategoryListUserPage /> },
        ],
    },
]);

export default router;