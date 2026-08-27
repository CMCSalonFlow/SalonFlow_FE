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

    const [resendCooldown, setResendCooldown] = useState(0);

    const handleVerify = async (form) => {
        try {
            setLoading(true);
            setError("");
            await verifyEmail(email, form.otp);
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "OTP không hợp lệ");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            setError("");
            await sendOtp(email);
            setSuccess("Đã gửi lại mã OTP tới email của bạn.");
            setResendCooldown(60);

            const timer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch {
            setError("Không gửi được mã OTP. Vui lòng thử lại sau.");
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
                        placeholder="Nhập mã OTP (6 chữ số)"
                        onChange={handleChange}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                        <button
                            type="button"
                            className="auth-link-button"
                            onClick={handleSendOtp}
                            disabled={resendCooldown > 0}
                        >
                            {resendCooldown > 0 ? `Gửi lại OTP (${resendCooldown}s)` : "Gửi lại OTP"}
                        </button>
                    </div>
                </>
            )}
        </AuthForm>
    );
}