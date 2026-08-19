import {
    Avatar,
    Button,
    Dropdown,
    Space,
    Grid
} from "antd";

import {
    UserOutlined,
    LogoutOutlined,
    MenuOutlined
} from "@ant-design/icons";

import {
    logout
} from "@/core/utils/auth";

export default function AdminHeader({ showMobileToggle, onToggleMobileMenu }) {
    const screens = Grid.useBreakpoint();
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
                justifyContent: "space-between",
                alignItems: "center",
                height: "64px",
                padding: screens.md ? "0 24px" : "0 12px",
                width: "100%",
                background: "#fff"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {showMobileToggle && (
                    <Button
                        type="text"
                        icon={<MenuOutlined />}
                        onClick={onToggleMobileMenu}
                        style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                    />
                )}
                {screens.sm && (
                    <h3
                        style={{
                            margin: 0
                        }}
                    >
                        SalonFlow Admin
                    </h3>
                )}
            </div>

            <Dropdown
                menu={{
                    items
                }}
            >
                <Button
                    type="text"
                    style={{ padding: screens.md ? "4px 15px" : "4px 0" }}
                >
                    <Space size={screens.md ? 8 : 4}>
                        <Avatar
                            icon={
                                <UserOutlined />
                            }
                        />

                        {screens.sm && username}
                    </Space>
                </Button>
            </Dropdown>
        </div>
    );
}