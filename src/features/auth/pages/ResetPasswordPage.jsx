import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import AuthForm from "../components/AuthForm";
import PasswordInput from "../components/PasswordInput";
import { useAuth } from "../hooks/useAuth";

export default function ResetPasswordPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const token = new URLSearchParams(
        location.search
    ).get("token");

    const { resetPassword } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (form) => {

        if (
            form.newPassword !==
            form.confirmPassword
        ) {

            setError(
                "Mật khẩu xác nhận không khớp."
            );

            return;

        }

        try {

            setLoading(true);

            await resetPassword(
                token,
                form.newPassword
            );

            navigate("/login");

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
            title="Đặt lại mật khẩu"
            buttonText="Đổi mật khẩu"
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
        >

            {(handleChange) => (
                <>

                    <PasswordInput
                        name="newPassword"
                        placeholder="Mật khẩu mới"
                        onChange={handleChange}
                        required
                    />

                    <PasswordInput
                        name="confirmPassword"
                        placeholder="Xác nhận mật khẩu"
                        onChange={handleChange}
                        required
                    />

                </>
            )}

        </AuthForm>

    );

}