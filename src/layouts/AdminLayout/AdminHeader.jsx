import {
    Avatar,
    Button,
    Dropdown,
    Space
} from "antd";

import {
    UserOutlined,
    LogoutOutlined
} from "@ant-design/icons";

import {
    logout
} from "@/core/utils/auth";

export default function AdminHeader() {

    const username =
        localStorage.getItem(
            "username"
        );

    const items = [
        {
            key: "logout",
            label: "Logout",
            icon: <LogoutOutlined />,
            onClick: logout
        }
    ];

    return (
        <div
            style={{
                display: "flex",
                justifyContent:
                    "space-between",
                alignItems: "center",
                height: "64px",
                padding: "0 24px",
                background: "#fff"
            }}
        >
            <h3
                style={{
                    margin: 0
                }}
            >
                SalonFlow Admin
            </h3>

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
    );
}