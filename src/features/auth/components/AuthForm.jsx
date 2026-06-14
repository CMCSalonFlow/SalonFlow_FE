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

            {/* LEFT SALON IMAGE */}
            <div className="auth-left">
                <div className="auth-brand">
                    <h1>SalonFlow ✂️</h1>
                    <p>Quản lý & đặt lịch salon chuyên nghiệp</p>
                </div>
            </div>

            {/* RIGHT FORM */}
            <div className="auth-right">
                <div className="auth-card">

                    <h2 className="auth-title">{title}</h2>
                    <p className="auth-subtitle">{subtitle}</p>

                    <form onSubmit={handleSubmit}>
                        {/* DYNAMIC FIELDS */}
                        {children(handleChange)}

                        <button type="submit">
                            {buttonText}
                        </button>
                    </form>

                    {switchText && (
                        <p className="auth-switch">
                            {switchText}{" "}
                            <span onClick={onSwitch}>
                                Click here
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}