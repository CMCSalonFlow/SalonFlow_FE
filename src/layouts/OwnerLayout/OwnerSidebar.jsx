import {
    DashboardOutlined,
    ShopOutlined,
    TeamOutlined,
    CalendarOutlined,
    AppstoreOutlined,
    HomeOutlined,
    ClockCircleOutlined,
    TagsOutlined,
    DollarOutlined
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