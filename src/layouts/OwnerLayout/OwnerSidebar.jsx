import {
    DashboardOutlined,
    ShopOutlined,
    TeamOutlined,
    CalendarOutlined,
    AppstoreOutlined,
    HomeOutlined,
    ClockCircleOutlined,
    TagsOutlined,
    DollarOutlined,
    MessageOutlined,
    CheckCircleOutlined,
    AlertOutlined,
    RobotOutlined,
    CustomerServiceOutlined,
    FileExcelOutlined,
    QrcodeOutlined,
    CrownOutlined
} from "@ant-design/icons";

import { Menu, Tag } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

export default function OwnerSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { features } = useSubscription();

    const hasAnalytics = features?.analyticsAdvanced ?? false;
    const hasAi = features?.aiFeatures ?? false;

    const items = [
        {
            key: "/owner",
            icon: <DashboardOutlined />,
            label: "Dashboard"
        },
        {
            key: "/owner/subscription",
            icon: <CrownOutlined style={{ color: "#faad14" }} />,
            label: <span style={{ fontWeight: 600 }}>Gói Dịch Vụ</span>
        },
        {
            key: "/owner/reports",
            icon: <FileExcelOutlined />,
            label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span>Báo Cáo Doanh Thu</span>
                    {!hasAnalytics && <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>PRO</Tag>}
                </div>
            )
        },
        {
            key: "/owner/support",
            icon: <CustomerServiceOutlined />,
            label: "Trợ Giúp & Support"
        },
        {
            key: "/owner/salon",
            icon: <HomeOutlined />,
            label: "My Salon"
        },
        {
            key: "/owner/branches",
            icon: <ShopOutlined />,
            label: "Branches"
        },
        {
            key: "/owner/staff",
            icon: <TeamOutlined />,
            label: "Staff"
        },
        {
            key: "/owner/ai-smart-schedule",
            icon: <RobotOutlined />,
            label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span>AI Smart Schedule</span>
                    {!hasAi && <Tag color="gold" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>ENT</Tag>}
                </div>
            )
        },
        {
            key: "/owner/ai-no-show",
            icon: <AlertOutlined />,
            label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span>AI No-Show Prediction</span>
                    {!hasAi && <Tag color="gold" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>ENT</Tag>}
                </div>
            )
        },
        {
            key: "/owner/services",
            icon: <AppstoreOutlined />,
            label: "Services"
        },
        {
            key: "/owner/cancellation-policy",
            icon: <DollarOutlined />,
            label: "Cancellation Policy"
        },
        {
            key: "/owner/reviews",
            icon: <MessageOutlined />,
            label: "Reviews"
        },
        {
            key: "/owner/schedule",

            icon: <CalendarOutlined />,
            label: "Schedule"
        },
        {
            key: "/owner/off-days",
            icon: <CalendarOutlined />,
            label: "Off Days"
        },
        {
            key: "/owner/shifts",
            icon: <ClockCircleOutlined />,
            label: "Shift Templates"
        },
        {
            key: "/owner/categories",
            icon: <TagsOutlined />,
            label: "Categories"
        }
    ];

    const selectedKey =
        items.find(item =>
            location.pathname.startsWith(item.key)
        )?.key;

    return (
        <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={items}
            onClick={(e) => navigate(e.key)}
            style={{ height: "100%" }}
        />
    );
}
