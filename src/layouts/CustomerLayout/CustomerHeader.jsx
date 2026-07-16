import {
    Layout,
    Menu,
    Button,
    Dropdown,
    Avatar,
    Space
} from "antd";

import {
    UserOutlined,
    LogoutOutlined
} from "@ant-design/icons";

import {
    useNavigate
} from "react-router-dom";

import {
    logout
} from "@/core/utils/auth";

const { Header } = Layout;

export default function CustomerHeader() {

    const navigate =
        useNavigate();

    const fullName = localStorage.getItem("fullName");
    const username = localStorage.getItem("username");
    const displayName = fullName || username;

    const menuItems = [
        {
            key: "/home",
            label: "Trang chủ"
        },
        {
            key: "/search",
            label: "Tìm salon"
        },
        {
            key: "/branches",
            label: "Chi nhánh"
        },
        {
            key: "/appointments",
            label: "Lịch hẹn"
        }
    ];

    const userMenu = {
        items: [
            {
                key: "profile",
                label: "Hồ sơ",
                onClick: () =>
                    navigate("/profile")
            },
            {
                key: "logout",
                icon:
                    <LogoutOutlined />,
                label: "Đăng xuất",
                onClick: logout
            }
        ]
    };

    return (
        <Header
            style={{
                display: "flex",
                justifyContent:
                    "space-between",
                alignItems:
                    "center",
                background: "#fff",
                borderBottom:
                    "1px solid #eee"
            }}
        >
            <div
                style={{
                    color: "#1677ff",
                    fontWeight: 700,
                    fontSize: 22
                }}
            >
                SalonFlow
            </div>

            <Menu
                mode="horizontal"
                items={menuItems}
                onClick={({ key }) =>
                    navigate(key)
                }
                style={{
                    flex: 1,
                    justifyContent:
                        "center",
                    borderBottom: 0
                }}
            />

            <Dropdown
                menu={userMenu}
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

                        {displayName}
                    </Space>
                </Button>
            </Dropdown>
        </Header>
    );
}