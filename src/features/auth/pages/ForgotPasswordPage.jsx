import { useState } from "react";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";

export default function ForgotPasswordPage() {

    const { forgotPassword } = useAuth();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (form) => {

        try {

            setLoading(true);

            await forgotPassword(
                form.email
            );

            setSuccess(
                "Đã gửi email đặt lại mật khẩu."
            );

        } catch (err) {

            setError(
                err.response?.data?.message
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <AuthForm
            title="Quên mật khẩu"
            subtitle="Nhập email của bạn"
            buttonText="Gửi email"
            loading={loading}
            error={error}
            success={success}
            onSubmit={handleSubmit}
        >

            {(handleChange) => (

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                />

            )}

        </AuthForm>

    );

}