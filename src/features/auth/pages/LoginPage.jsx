import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthForm from "../components/AuthForm";
import SocialLogin from "../components/SocialLogin";

import { useAuth } from "../hooks/useAuth";

import ROLES from "@/core/constants/roles";

export default function LoginPage() {

    const navigate = useNavigate();

    const { login } = useAuth();

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

            const role =
                response.roles?.[0];

            switch (role) {

                case ROLES.ADMIN:
                    navigate("/admin");
                    break;

                case ROLES.OWNER:
                    navigate("/owner");
                    break;

                case ROLES.STAFF:
                    navigate("/staff");
                    break;

                default:
                    navigate("/");
            }

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

                    <input
                        type="password"
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