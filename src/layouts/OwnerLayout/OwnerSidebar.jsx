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
    RobotOutlined,
    QrcodeOutlined
} from "@ant-design/icons";

import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

export default function OwnerSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        {
            key: "/owner",
            icon: <DashboardOutlined />,
            label: "Dashboard"
        },
        {
            key: "/owner/reports",
            icon: <FileExcelOutlined />,
            label: "Xuất Báo Cáo (Excel/PDF)"
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
            label: "AI Smart Schedule"
        },
        {
            key: "/owner/ai-no-show",
            icon: <AlertOutlined />,
            label: "AI No-Show Prediction"
        },
        {
            key: "/owner/services/ai",
            icon: <RobotOutlined />,
            label: "Service AI"
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
            key: "/owner/bookings",
            icon: <CheckCircleOutlined />,
            label: "Check-in / Complete"
        },
        {
            key: "/owner/check-in-scanner",
            icon: <QrcodeOutlined />,
            label: "Quét QR Check-in"
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
