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
            key: "/admin",
            icon:
                <DashboardOutlined />,
            label: "Dashboard"
        },
        {
            key: "/admin/users",
            icon:
                <UserOutlined />,
            label: "Users"
        },
        {
            key: "/admin/roles",
            icon:
                <TeamOutlined />,
            label: "Roles"
        },
        {
            key: "/admin/branches",
            icon:
                <ApartmentOutlined />,
            label: "Branches"
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