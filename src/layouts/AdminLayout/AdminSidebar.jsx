import {
    Menu
} from "antd";

import {
    DashboardOutlined,
    UserOutlined,
    TeamOutlined,
    ApartmentOutlined
} from "@ant-design/icons";

import {
    useNavigate,
    useLocation
} from "react-router-dom";

export default function AdminSidebar() {

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const items = [
    {
        type: "group",
        label: "SYSTEM",
        children: [
            {
                key: "/admin",
                icon: <DashboardOutlined />,
                label: "Dashboard"
            }
        ]
    },
    {
        type: "group",
        label: "MANAGEMENT",
        children: [
            {
                key: "/admin/users",
                icon: <UserOutlined />,
                label: "Users"
            },
            {
                key: "/admin/roles",
                icon: <TeamOutlined />,
                label: "Roles"
            },
            {
                key: "/admin/branches",
                icon: <ApartmentOutlined />,
                label: "Branches"
            }
        ]
    }
];

    return (

        <Menu
            mode="inline"
            selectedKeys={[
                location.pathname
            ]}
            items={items}
            onClick={({ key }) =>
                navigate(key)
            }
            style={{
                height: "100%"
            }}
        />
    );
}
