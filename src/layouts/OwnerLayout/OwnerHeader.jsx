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

export default function OwnerHeader() {

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
                height: 64,
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 24px",
                borderBottom:
                    "1px solid #f0f0f0"
            }}
        >
            <h3
                style={{
                    margin: 0
                }}
            >
                SalonFlow Owner
            </h3>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16
                }}
            >
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
        </div>
    );
}