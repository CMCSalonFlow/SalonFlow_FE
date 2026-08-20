import {
    Avatar,
    Button,
    Dropdown,
    Space,
    Tag,
    Tooltip,
    Grid
} from "antd";

import {
    UserOutlined,
    LogoutOutlined,
    CrownOutlined,
    MenuOutlined
} from "@ant-design/icons";

import {
    logout
} from "@/core/utils/auth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

export default function OwnerHeader({ showMobileToggle, onToggleMobileMenu }) {
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const { subscription } = useSubscription();
    const plan = subscription?.plan || "FREE";

    const username =
        localStorage.getItem(
            "username"
        );

    const items = [
        {
            key: "subscription",
            label: "Gói Dịch Vụ",
            icon: <CrownOutlined style={{ color: "#faad14" }} />,
            onClick: () => navigate("/owner/subscription")
        },
        {
            key: "logout",
            label: "Logout",
            icon: <LogoutOutlined />,
            onClick: logout
        }
    ];

    const getPlanColor = (p) => {
        if (p === "ENTERPRISE") return "gold";
        if (p === "PRO") return "blue";
        return "default";
    };

    return (
        <div
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
                {screens.md && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="owner-live-dot" />
                        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Hệ thống trực tuyến</span>
                    </div>
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: screens.md ? 14 : 8
                }}
            >
                <Tooltip title="Xem chi tiết gói đăng ký & quyền lợi">
                    <Tag 
                        color={getPlanColor(plan)} 
                        onClick={() => navigate("/owner/subscription")}
                        style={{ 
                            fontWeight: 700, 
                            padding: screens.md ? "5px 14px" : "3px 8px", 
                            borderRadius: 20, 
                            margin: 0,
                            cursor: "pointer",
                            boxShadow: plan !== "FREE" ? "0 4px 12px rgba(79, 70, 229, 0.15)" : "none",
                            fontSize: screens.md ? "12px" : "11px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                        }}
                    >
                        <CrownOutlined /> {plan} PLAN
                    </Tag>
                </Tooltip>

                <Dropdown
                    menu={{
                        items
                    }}
                    placement="bottomRight"
                    arrow
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "4px 12px 4px 6px",
                            borderRadius: 24,
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <Avatar
                            style={{
                                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                color: "#fff",
                                fontWeight: 700
                            }}
                            size={32}
                            icon={<UserOutlined />}
                        >
                            {username?.[0]?.toUpperCase()}
                        </Avatar>

                        {screens.sm && (
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{username}</div>
                                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Chủ Salon</div>
                            </div>
                        )}
                    </div>
                </Dropdown>
            </div>
        </div>
    );
}