import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import PasswordInput from "../components/PasswordInput";
import { changePasswordApi } from "../api/authApi";
import { getRoles } from "@/core/utils/auth";
import ROLES from "@/core/constants/roles";
import { message } from "antd";

export default function ForceChangePasswordPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigateToDashboard = () => {
        const roles = getRoles();
        if (roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.ADMIN)) {
            navigate("/admin", { replace: true });
        } else if (roles.includes(ROLES.SALON_OWNER)) {
            navigate("/owner", { replace: true });
        } else if (roles.includes(ROLES.MANAGER) || roles.includes(ROLES.BRANCH_MANAGER)) {
            navigate("/manager/pos", { replace: true });
        } else if (roles.includes(ROLES.STAFF)) {
            navigate("/staff/schedule", { replace: true });
        } else {
            navigate("/home", { replace: true });
        }
    };

    const handleSubmit = async (form) => {
        const { newPassword, confirmPassword } = form;

        if (!newPassword || newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await changePasswordApi(newPassword);

            localStorage.setItem("mustChangePassword", "false");
            message.success("Đổi mật khẩu thành công! Vui lòng tiếp tục làm việc.");

            setTimeout(() => {
                navigateToDashboard();
            }, 800);
        } catch (err) {
            setError(
                err?.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại!"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthForm
            title="Đổi mật khẩu lần đầu"
            subtitle="Tài khoản của bạn được khởi tạo với mật khẩu mặc định. Vui lòng đặt mật khẩu mới để bảo mật tài khoản."
            buttonText="Xác nhận & Tiếp tục"
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
        >
            {(handleChange) => (
                <>
                    <PasswordInput
                        name="newPassword"
                        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                        onChange={handleChange}
                        required
                    />

                    <PasswordInput
                        name="confirmPassword"
                        placeholder="Xác nhận mật khẩu mới"
                        onChange={handleChange}
                        required
                    />
                </>
            )}
        </AuthForm>
    );
}
