import {
    Avatar,
    Button,
    Dropdown,
    Space,
    Tag,
    Tooltip
} from "antd";

import {
    UserOutlined,
    LogoutOutlined,
    CrownOutlined
} from "@ant-design/icons";

import {
    logout
} from "@/core/utils/auth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

export default function OwnerHeader() {
    const navigate = useNavigate();
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
                padding: "0 24px",
                borderBottom:
                    "1px solid #f0f0f0"
            }}
        >
            <h3
                style={{
                    margin: 0
                }}
            >
                SalonFlow Owner
            </h3>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16
                }}
            >
                <Tooltip title="Xem chi tiết gói đăng ký">
                    <Tag 
                        color={getPlanColor(plan)} 
                        onClick={() => navigate("/owner/subscription")}
                        style={{ 
                            fontWeight: "bold", 
                            padding: "4px 12px", 
                            borderRadius: 12, 
                            margin: 0,
                            cursor: "pointer",
                            boxShadow: plan !== "FREE" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
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
                    >
                        <Space>
                            <Avatar
                                icon={
                                    <UserOutlined />
                                }
                            />

                            {username}
                        </Space>
                    </Button>
                </Dropdown>
            </div>
        </div>
    );
}