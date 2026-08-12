import { useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthForm from "../components/AuthForm";
import SocialLogin from "../components/SocialLogin";
import PasswordInput from "../components/PasswordInput";

import { useAuth } from "../hooks/useAuth";
import { checkAuthSession } from "@/core/utils/auth";

import ROLES from "@/core/constants/roles";

export default function LoginPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const { login } = useAuth();

    const redirectTo =
        typeof location.state?.from === "string" && location.state.from.startsWith("/")
            ? location.state.from
            : null;

    const navigateAfterLogin = useCallback((roles) => {
        if (redirectTo) {
            navigate(redirectTo, { replace: true });
            return;
        }

        if (roles.includes(ROLES.SUPER_ADMIN)) {
            navigate("/admin");
        } else if (roles.includes(ROLES.ADMIN)) {
            navigate("/admin");
        } else if (roles.includes(ROLES.SALON_OWNER)) {
            navigate("/owner");
        } else if (roles.includes(ROLES.BRANCH_MANAGER)) {
            navigate("/staff");
        } else if (roles.includes(ROLES.STAFF)) {
            navigate("/staff");
        } else if (roles.includes(ROLES.CUSTOMER)) {
            navigate("/home");
        } else {
            navigate("/login");
        }
    }, [navigate, redirectTo]);

    useEffect(() => {
        const lastError = sessionStorage.getItem("lastAuthError");
        if (lastError) {
            try {
                console.error("Last Authentication/Redirect Error:", JSON.parse(lastError));
            } catch {
                console.error("Last Authentication/Redirect Error:", lastError);
            }
            sessionStorage.removeItem("lastAuthError");
        }
    }, []);

    useEffect(() => {
        if (checkAuthSession()) {
            try {
                const rolesStr = localStorage.getItem("roles");
                if (rolesStr) {
                    const roles = JSON.parse(rolesStr);
                    navigateAfterLogin(roles);
                }
            } catch {
                localStorage.clear();
            }
        }
    }, [navigateAfterLogin]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleLogin = async (form) => {

        try {

            setLoading(true);
            setError("");

            const response =
                await login(
                    form.email,
                    form.password
                );

            const roles = response.roles || [];
            navigateAfterLogin(roles);

        } catch (err) {

            setError(
                err?.response?.data?.message ||
                "Email hoặc mật khẩu không đúng"
            );

        } finally {

            setLoading(false);
        }
    };

    return (

        <AuthForm
            title="Đăng nhập"
            subtitle="Chào mừng quay lại SalonFlow"
            buttonText="Đăng nhập"
            switchText="Chưa có tài khoản?"
            onSwitch={() =>
                navigate("/register")
            }
            loading={loading}
            error={error}
            onSubmit={handleLogin}
            extraContent={
                <>
                    <div className="oauth-divider">
                        <span>
                            Hoặc đăng nhập bằng
                        </span>
                    </div>

                    <SocialLogin />
                </>
            }
        >

            {(handleChange) => (
                <>

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        required
                    />

                    <PasswordInput
                        name="password"
                        placeholder="Mật khẩu"
                        onChange={handleChange}
                        required
                    />

                    <div className="forgot-password">
                        <span
                            onClick={() => navigate("/forgot-password")}
                        >
                            Quên mật khẩu?
                        </span>
                    </div>

                </>
            )}

        </AuthForm>
    );
}
