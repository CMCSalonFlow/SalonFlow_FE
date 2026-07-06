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

import { useNavigate } from "react-router-dom";

import { logout } from "@/core/utils/auth";

const { Header } = Layout;

export default function PublicHeader() {

    const navigate = useNavigate();

    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    const isLogin = !!token;

    const menuItems = [
        {
            key: "/",
            label: "Trang chủ"
        },
        {
            key: "/search",
            label: "Tìm salon"
        },
        {
            key: "/services",
            label: "Dịch vụ"
        }
    ];

    const userMenu = {
        items: [
            {
                key: "appointments",
                label: "Lịch hẹn",
                onClick: () => navigate("/appointments")
            },
            {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Đăng xuất",
                onClick: logout
            }
        ]
    };

    return (

        <Header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                borderBottom: "1px solid #eee"
            }}
        >

            <div
                style={{
                    fontWeight: 700,
                    color: "#1677ff",
                    fontSize: 24,
                    cursor: "pointer"
                }}
                onClick={() => navigate("/")}
            >
                SalonFlow
            </div>

            <Menu
                mode="horizontal"
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{
                    flex: 1,
                    justifyContent: "center",
                    borderBottom: 0
                }}
            />

            {
                isLogin ? (

                    <Dropdown menu={userMenu}>

                        <Button type="text">

                            <Space>

                                <Avatar icon={<UserOutlined />} />

                                {username}

                            </Space>

                        </Button>

                    </Dropdown>

                ) : (

                    <Space>

                        <Button
                            onClick={() => navigate("/login")}
                        >
                            Đăng nhập
                        </Button>

                        <Button
                            type="primary"
                            onClick={() => navigate("/register")}
                        >
                            Đăng ký
                        </Button>

                    </Space>

                )
            }

        </Header>

    );

}