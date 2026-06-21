import {
    DashboardOutlined,
    ShopOutlined,
    TeamOutlined,
    CalendarOutlined,
    AppstoreOutlined
} from "@ant-design/icons";

import { Menu } from "antd";

import {
    useNavigate,
    useLocation
} from "react-router-dom";

export default function OwnerSidebar() {

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const items = [
        {
            key: "/owner",
            icon:
                <DashboardOutlined />,
            label:
                "Dashboard"
        },
        {
            key:
                "/owner/branches",
            icon:
                <ShopOutlined />,
            label:
                "Branches"
        },
        {
            key:
                "/owner/staff",
            icon:
                <TeamOutlined />,
            label:
                "Staff"
        },
        {
            key:
                "/owner/services",
            icon:
                <AppstoreOutlined />,
            label:
                "Services"
        },
        {
            key:
                "/owner/appointments",
            icon:
                <CalendarOutlined />,
            label:
                "Appointments"
        }
    ];

    return (
        <Menu
            mode="inline"
            selectedKeys={[
                location.pathname
            ]}
            items={items}
            onClick={(e) =>
                navigate(e.key)
            }
            style={{
                height: "100%"
            }}
        />
    );
}