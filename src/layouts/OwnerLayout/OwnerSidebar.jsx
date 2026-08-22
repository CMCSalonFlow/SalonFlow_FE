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
    CrownOutlined,
    GiftOutlined
} from "@ant-design/icons";

import { Menu, Tag } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

export default function OwnerSidebar({ onMenuClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { features } = useSubscription();

    const hasAnalytics = features?.analyticsAdvanced ?? false;
    const hasAi = features?.aiFeatures ?? false;

    const items = [
        {
            key: "/owner",
            icon: <DashboardOutlined />,
            label: "Bảng Điều Khiển"
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
            key: "/owner/salon",
            icon: <HomeOutlined />,
            label: "Salon Của Tôi"
        },
        {
            key: "/owner/branches",
            icon: <ShopOutlined />,
            label: "Chi Nhánh"
        },
        {
            key: "/owner/categories",
            icon: <TagsOutlined />,
            label: "Danh Mục Dịch Vụ"
        },
        {
            key: "/owner/services",
            icon: <AppstoreOutlined />,
            label: "Dịch Vụ"
        },
        {
            key: "/owner/vouchers",
            icon: <GiftOutlined />,
            label: "Quản Lý Voucher"
        },
        {
            key: "/owner/staff",
            icon: <TeamOutlined />,
            label: "Nhân Viên"
        },
        {
            key: "/owner/shifts",
            icon: <ClockCircleOutlined />,
            label: "Mẫu Ca Làm Việc"
        },
        {
            key: "/owner/schedule",
            icon: <CalendarOutlined />,
            label: "Lịch Làm Việc"
        },
        {
            key: "/owner/off-days",
            icon: <CalendarOutlined />,
            label: "Ngày Nghỉ"
        },
        {
            key: "/owner/reviews",
            icon: <MessageOutlined />,
            label: "Đánh Giá"
        },
        {
            key: "/owner/ai-smart-schedule",
            icon: <RobotOutlined />,
            label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span>AI Lịch Thông Minh</span>
                    {!hasAi && <Tag color="gold" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>ENT</Tag>}
                </div>
            )
        },
        {
            key: "/owner/ai-no-show",
            icon: <AlertOutlined />,
            label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span>AI Dự Đoán Vắng Mặt</span>
                    {!hasAi && <Tag color="gold" style={{ fontSize: 10, margin: 0, padding: "0 4px", lineHeight: "16px" }}>ENT</Tag>}
                </div>
            )
        },
        {
            key: "/owner/support",
            icon: <CustomerServiceOutlined />,
            label: "Trợ Giúp & Hỗ Trợ"
        },
        {
            key: "/owner/subscription",
            icon: <CrownOutlined style={{ color: "#faad14" }} />,
            label: <span style={{ fontWeight: 600 }}>Gói Dịch Vụ</span>
        }
    ];

    const selectedKey =
        items.find(item =>
            item.key === "/owner"
                ? (location.pathname === "/owner" || location.pathname.startsWith("/owner/dashboard"))
                : location.pathname.startsWith(item.key)
        )?.key;

    return (
        <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={items}
            onClick={(e) => {
                navigate(e.key);
                if (onMenuClick) onMenuClick();
            }}
            style={{ height: "100%" }}
        />
    );
}
