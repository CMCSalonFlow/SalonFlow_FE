import { useState } from "react";
import { registerApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

export function RegisterPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const handleRegister = async (form) => {
        setLoading(true);

        try {
            const res = await registerApi(form);
            const data = res.data || res;

            console.log("Register success:", data);

            alert("Đăng ký thành công");

            navigate("/login");
        } catch (error) {
            alert(
                error?.response?.data?.message ||
                "Đăng ký thất bại"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm
            title="Create account 💇‍♀️"
            subtitle="Đăng ký để quản lý salon của bạn"
            buttonText={loading ? "Creating..." : "Đăng ký"}
            onSubmit={handleRegister}
            switchText="Đã có tài khoản?"
            onSwitch={() => navigate("/login")}
        >
            {(handleChange) => (
                <>
                    <input
                        name="username"
                        placeholder="Tên đăng nhập"
                        onChange={handleChange}
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        onChange={handleChange}
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Mật khẩu"
                        onChange={handleChange}
                    />

                    <input
                        name="fullName"
                        placeholder="Họ và tên"
                        onChange={handleChange}
                    />

                    <input
                        name="phone"
                        placeholder="Số điện thoại"
                        onChange={handleChange}
                    />
                </>
            )}
        </AuthForm>
    );
}