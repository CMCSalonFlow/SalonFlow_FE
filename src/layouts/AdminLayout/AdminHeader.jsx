import {
    Avatar,
    Button,
    Dropdown,
    Space,
    Tag,
    Grid
} from "antd";

import {
    UserOutlined,
    LogoutOutlined,
    MenuOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";

import { logout } from "@/core/utils/auth";
import { useNavigate } from "react-router-dom";

export default function AdminHeader({ showMobileToggle, onToggleMobileMenu }) {
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const rawName = localStorage.getItem("fullName") || JSON.parse(localStorage.getItem("user") || "{}")?.fullName || localStorage.getItem("username") || "superadmin";
    const username = rawName.includes("@")
        ? rawName.split("@")[0].replace(/\./g, " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase())
        : rawName;

    const items = [
        {
            key: "logout",
            label: "Đăng Xuất",
            icon: <LogoutOutlined style={{ color: "#ef4444" }} />,
            onClick: logout
        }
    ];

    return (
        <div
            className="owner-header-glass"
            style={{
                height: 68,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: screens.md ? "0 28px" : "0 16px",
                width: "100%"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {showMobileToggle && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleMobileMenu}
                        style={{
                            fontSize: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 10,
                            background: "#f1f5f9"
                        }}
                    />
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: screens.md ? 14 : 8
                }}
            >
                <Tag 
                    color="purple" 
                    style={{ 
                        fontWeight: 700, 
                        padding: screens.md ? "5px 14px" : "3px 8px", 
                        borderRadius: 20, 
                        fontSize: 12,
                        letterSpacing: "0.5px",
                        boxShadow: "0 2px 6px rgba(147, 51, 234, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                    }}
                >
                    <SafetyCertificateOutlined /> ADMIN SYSTEM
                </Tag>

                <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
                    <Button
                        type="text"
                        style={{
                            height: 44,
                            padding: "4px 10px 4px 6px",
                            borderRadius: 22,
                            background: "rgba(241, 245, 249, 0.7)",
                            border: "1px solid rgba(226, 232, 240, 0.8)",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <Space size={10}>
                            <Avatar
                                size={34}
                                style={{
                                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"
                                }}
                                icon={<UserOutlined />}
                            >
                                {username.charAt(0).toUpperCase()}
                            </Avatar>
                            {screens.md && (
                                <div style={{ textAlign: "left", lineHeight: "1.2" }}>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>
                                        {username}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#64748b" }}>
                                        Quản Trị Hệ Thống
                                    </div>
                                </div>
                            )}
                        </Space>
                    </Button>
                </Dropdown>
            </div>
        </div>
    );
}