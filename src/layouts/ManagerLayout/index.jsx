import { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Avatar, Space, Tag } from "antd";
import {
    DesktopOutlined,
    QrcodeOutlined,
    CreditCardOutlined,
    LogoutOutlined,
    UserOutlined,
    ShopOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
    FileTextOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logout } from "@/core/utils/auth";
import BrandLogo from "@/core/components/BrandLogo";

import { getUserByIdApi } from "@/features/user/api/userApi";

const { Header, Content } = Layout;

export function ManagerLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [fullName, setFullName] = useState(() => {
        const stored = localStorage.getItem("fullName") || JSON.parse(localStorage.getItem("user") || "{}")?.fullName || localStorage.getItem("username") || "Manager";
        if (stored && stored.includes("@")) {
            const namePart = stored.split("@")[0];
            return namePart.replace(/\./g, " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        }
        return stored;
    });

    useEffect(() => {
        const syncUserProfile = async () => {
            try {
                const userId = localStorage.getItem("userId");
                if (!userId) return;
                const userData = await getUserByIdApi(userId);
                const realName = userData?.fullName || userData?.name;
                if (realName && !realName.includes("@")) {
                    setFullName(realName);
                    localStorage.getItem("fullName") !== realName && localStorage.setItem("fullName", realName);
                }
            } catch (err) {
                console.warn("Could not sync user profile:", err);
            }
        };
        syncUserProfile();
    }, []);

    const navItems = [
        {
            key: "/manager/walk-in",
            icon: <DesktopOutlined />,
            label: "Tiếp Đón & Đặt Lịch Nhanh"
        },
        {
            key: "/manager/bookings",
            icon: <CheckCircleOutlined />,
            label: "Check-in & Phục Vụ"
        },
        {
            key: "/manager/off-days",
            icon: <CalendarOutlined />,
            label: "Duyệt Nghỉ Chi Nhánh"
        },
        {
            key: "/manager/leave-requests",
            icon: <FileTextOutlined />,
            label: "Xin Nghỉ Phép"
        }
    ];

    const currentKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || "/manager/walk-in";

    const userMenu = {
        items: [
            {
                key: "user-info",
                label: (
                    <div style={{ padding: "4px 0" }}>
                        <div style={{ fontWeight: "bold" }}>{fullName}</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>Vai trò: Quản lý / Lễ tân</div>
                    </div>
                ),
                disabled: true
            },
            { type: "divider" },
            {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Đăng Xuất",
                onClick: logout
            }
        ]
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <Header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#0f172a",
                    padding: "0 24px",
                    height: 68,
                    lineHeight: "68px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    overflow: "hidden"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                        onClick={() => navigate("/manager/walk-in")}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                        <BrandLogo theme="dark" subtitle="RECEPTION & POS" size="small" />
                    </div>
                </div>

                {/* Thanh điều hướng Tab dạng Capsule/Pill hiện đại */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = currentKey === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => navigate(item.key)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 20px",
                                    height: 40,
                                    borderRadius: 20,
                                    border: "none",
                                    background: isActive
                                        ? "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)"
                                        : "transparent",
                                    color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isActive ? "0 4px 14px rgba(250, 140, 22, 0.35)" : "none",
                                    outline: "none"
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                        e.currentTarget.style.color = "#ffffff";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                                    }
                                }}
                            >
                                <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <Dropdown menu={userMenu}>
                    <Button type="text" style={{ color: "#fff" }}>
                        <Space>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#fa8c16" }} />
                            <span>{fullName}</span>
                        </Space>
                    </Button>
                </Dropdown>
            </Header>

            <Content style={{ padding: "20px 24px", background: "#f5f7fa" }}>
                <Outlet />
            </Content>
        </Layout>
    );
}

export default ManagerLayout;
