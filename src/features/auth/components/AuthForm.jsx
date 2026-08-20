import { useState } from "react";
import { LeftOutlined } from "@ant-design/icons";
import BrandLogo from "@/core/components/BrandLogo";
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
        <div className="auth-centered-wrapper">
            <div className="auth-card-centered">
                {/* Header Top Bar with Back Button */}
                <div className="auth-header-bar">
                    <button
                        type="button"
                        className="auth-back-btn"
                        onClick={() => window.location.href = "/"}
                    >
                        <LeftOutlined style={{ fontSize: 12 }} />
                        <span>Quay về trang chủ</span>
                    </button>
                </div>

                <div className="auth-brand-header" style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <BrandLogo theme="light" subtitle="BEAUTY & SALON" size="medium" />
                </div>

                <h2 className="auth-title">{title}</h2>
                <p className="auth-subtitle">{subtitle}</p>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form onSubmit={handleSubmit} className="auth-form-body">
                    {children(handleChange)}

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-submit-btn"
                    >
                        {loading ? "Đang xử lý..." : buttonText}
                    </button>
                </form>

                {extraContent}

                {switchText && (
                    <p className="auth-switch">
                        {switchText}{" "}
                        <span onClick={onSwitch} role="button">
                            Bấm vào đây
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}