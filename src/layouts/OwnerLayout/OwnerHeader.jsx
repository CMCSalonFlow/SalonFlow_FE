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
                height: 64,
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: screens.md ? "0 24px" : "0 12px",
                width: "100%"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {showMobileToggle && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleMobileMenu}
                        style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    />
                )}
                {screens.sm && (
                    <h3
                        style={{
                            margin: 0
                        }}
                    >
                        SalonFlow Owner
                    </h3>
                )}
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: screens.md ? 16 : 8
                }}
            >
                <Tooltip title="Xem chi tiết gói đăng ký">
                    <Tag 
                        color={getPlanColor(plan)} 
                        onClick={() => navigate("/owner/subscription")}
                        style={{ 
                            fontWeight: "bold", 
                            padding: screens.md ? "4px 12px" : "2px 8px", 
                            borderRadius: 12, 
                            margin: 0,
                            cursor: "pointer",
                            boxShadow: plan !== "FREE" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                            fontSize: screens.md ? "13px" : "11px"
                        }}
                    >
                        {plan} MEMBER
                    </Tag>
                </Tooltip>

                <Dropdown
                    menu={{
                        items
                    }}
                >
                    <Button
                        type="text"
                        style={{ padding: screens.md ? "4px 15px" : "4px 0" }}
                    >
                        <Space size={screens.md ? 8 : 4}>
                            <Avatar
                                icon={
                                    <UserOutlined />
                                }
                            />

                            {screens.sm && username}
                        </Space>
                    </Button>
                </Dropdown>
            </div>
        </div>
    );
}