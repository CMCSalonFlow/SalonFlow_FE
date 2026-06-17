import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setUser(storedUser);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>🏠 SalonFlow Home</h1>

            {user ? (
                <div>
                    <h3>Xin chào, {user.name || user.email}</h3>
                    <p>Vai trò: {user.roles?.[0]}</p>
                </div>
            ) : (
                <p>Không có dữ liệu người dùng</p>
            )}

            <hr />

            <div style={{ marginTop: "20px" }}>
                <button onClick={() => navigate("/profile")}>
                    Hồ sơ
                </button>

                <button onClick={() => navigate("/dashboard")}>
                    Dashboard
                </button>

                <button onClick={handleLogout}>
                    Đăng xuất
                </button>
            </div>

            <div style={{ marginTop: "30px" }}>
                <h2>📊 Tổng quan</h2>

                <div style={{ display: "flex", gap: "10px" }}>
                    <div className="card">Doanh thu</div>
                    <div className="card">Lịch hẹn</div>
                    <div className="card">Khách hàng</div>
                </div>
            </div>
        </div>
    );
}