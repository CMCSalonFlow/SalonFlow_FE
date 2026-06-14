import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import AuthForm from "../components/AuthForm";

export function LoginPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const handleLogin = async (form) => {
        setLoading(true);

        try {
            const res = await loginApi(form);
            const data = res.data || res;

            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("roles", JSON.stringify(data.roles));
            localStorage.setItem("userEmail", data.email);

            alert("Login success");
            navigate("/");
        } catch (error) {
            alert(
                error?.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm
            title="Welcome back 💇‍♀️"
            subtitle="Đăng nhập để quản lý salon của bạn"
            buttonText={loading ? "Logging in..." : "Login"}
            onSubmit={handleLogin}
            switchText="Chưa có tài khoản?"
            onSwitch={() => navigate("/register")}
        >
            {(handleChange) => (
                <>
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        onChange={handleChange}
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        onChange={handleChange}
                    />
                </>
            )}
        </AuthForm>
    );
}