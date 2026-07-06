import { useState } from "react";
import "@/styles/auth.css";

export default function AuthForm({
    title,
    subtitle,
    children,
    onSubmit,
    buttonText = "Submit",
    switchText,
    onSwitch,
    loading = false,
    error = "",
    success = "",
    extraContent,
}) {

    const [form, setForm] = useState({});

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit(form);
    };

    return (
        <div className="auth-container">

            {/* LEFT PANEL */}
            <div className="auth-left">
                <div className="auth-brand">

                    <h1>SalonFlow</h1>

                    <p>
                        Quản lý salon hiện đại,
                        đặt lịch nhanh chóng,
                        tối ưu trải nghiệm khách hàng.
                    </p>

                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="auth-right">

                <div className="auth-card">

                    <h2 className="auth-title">
                        {title}
                    </h2>

                    <p className="auth-subtitle">
                        {subtitle}
                    </p>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="auth-success">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {children(handleChange)}

                        <button
                            type="submit"
                            disabled={loading}
                            className="auth-submit-btn"
                        >
                            {
                                loading
                                    ? "Đang xử lý..."
                                    : buttonText
                            }
                        </button>

                    </form>

                    {extraContent}

                    {switchText && (
                        <p className="auth-switch">

                            {switchText}{" "}

                            <span
                                onClick={onSwitch}
                                role="button"
                            >
                                Click here
                            </span>

                        </p>
                    )}

                </div>

            </div>

        </div>
    );
}