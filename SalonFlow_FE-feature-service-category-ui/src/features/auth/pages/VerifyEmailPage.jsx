import { useState } from "react";
import {
    useNavigate,
    useLocation,
} from "react-router-dom";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";

export default function VerifyEmailPage() {

    const navigate = useNavigate();
    const location = useLocation();

    const [email] = useState(
    location.state?.email || ""
);

    const {
        verifyEmail,
        sendOtp
    } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleVerify = async (form) => {

        try {

            setLoading(true);
            setError("");

            await verifyEmail(
                email,
                form.otp
            );

            navigate("/login");

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "OTP không hợp lệ"
            );

        } finally {

            setLoading(false);

        }

    };

    const handleSendOtp = async () => {
        try {

            await sendOtp(email);

            setSuccess(
                "Đã gửi lại OTP."
            );

        } catch {

            setError(
                "Không gửi được OTP."
            );

        }

    };

    return (

        <AuthForm
            title="Xác thực Email"
            subtitle="Nhập OTP đã được gửi tới email"
            buttonText="Xác thực"
            loading={loading}
            error={error}
            success={success}
            onSubmit={handleVerify}
        >

            {(handleChange) => (
                <>

                    <input
                        type="email"
                        name="email"
                        value={email}
                        readOnly
                    />

                    <input
                        type="text"
                        name="otp"
                        placeholder="OTP"
                        onChange={handleChange}
                    />

                    <button
                        type="button"
                        className="auth-link-button"
                        onClick={handleSendOtp}
                    >
                        Gửi lại OTP
                    </button>

                </>
            )}

        </AuthForm>

    );

}