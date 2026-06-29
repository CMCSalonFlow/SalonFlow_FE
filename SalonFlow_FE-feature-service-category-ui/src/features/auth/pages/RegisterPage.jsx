import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {

    const navigate = useNavigate();

    const { register } = useAuth();

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleRegister =
        async (form) => {

            try {

                setLoading(true);
                setError("");

                await register({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    fullName: form.fullName,
                    phone: form.phone,
                });

                navigate("/verify-email", {
                    state: {
                        email: form.email,
                    },
                });

            } catch (err) {

                setError(
                    err?.response?.data?.message ||
                    "Đăng ký thất bại"
                );

            } finally {

                setLoading(false);
            }
        };

    return (
        <AuthForm
            title="Đăng ký"
            subtitle="Tạo tài khoản SalonFlow"
            buttonText="Đăng ký"
            switchText="Đã có tài khoản?"
            onSwitch={() =>
                navigate("/login")
            }
            loading={loading}
            error={error}
            onSubmit={handleRegister}
        >
            {(handleChange) => (
                <>

                    <input
                        type="text"
                        name="username"
                        placeholder="Tên đăng nhập"
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="fullName"
                        placeholder="Họ và tên"
                        onChange={handleChange}
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="phone"
                        placeholder="Số điện thoại"
                        onChange={handleChange}
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Mật khẩu (ít nhất 8 ký tự)"
                        minLength={8}
                        onChange={handleChange}
                        required
                    />

                </>
            )}
        </AuthForm>
    );
}