import React, { useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

export default function PasswordInput({
    name = "password",
    placeholder = "Mật khẩu",
    onChange,
    required = false,
    minLength,
    style = {}
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="auth-password-container" style={style}>
            <input
                type={showPassword ? "text" : "password"}
                name={name}
                placeholder={placeholder}
                onChange={onChange}
                required={required}
                minLength={minLength}
            />
            <button
                type="button"
                className="auth-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                style={{
                    color: showPassword ? "#1677ff" : undefined
                }}
            >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
        </div>
    );
}

