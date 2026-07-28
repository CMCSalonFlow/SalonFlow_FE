import { Layout, Menu, Button, Dropdown, Avatar, Space, Tag } from "antd";
import {
    DesktopOutlined,
    CalendarOutlined,
    UnorderedListOutlined,
    LogoutOutlined,
    UserOutlined,
    ShopOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logout } from "@/core/utils/auth";

const { Header, Content } = Layout;

export function StaffLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const username = localStorage.getItem("username") || "Staff";
    const fullName = localStorage.getItem("fullName") || username;

    const navItems = [
        {
            key: "/staff/pos",
            icon: <DesktopOutlined />,
            label: "Hệ Thống POS (Walk-in)"
        },
        {
            key: "/staff/schedule",
            icon: <CalendarOutlined />,
            label: "Lịch Làm Việc"
        }
    ];

    const currentKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || "/staff/pos";

    const userMenu = {
        items: [
            {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Đăng xuất",
                onClick: logout
            }
        ]
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
            <Header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#001529",
                    padding: "0 24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                        style={{
                            fontWeight: 800,
                            color: "#fff",
                            fontSize: 20,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer"
                        }}
                        onClick={() => navigate("/staff/pos")}
                    >
                        <ShopOutlined style={{ color: "#1890ff", fontSize: 24 }} />
                        <span>SalonFlow <Tag color="blue" style={{ fontSize: 11, marginLeft: 4 }}>POS TERMINAL</Tag></span>
                    </div>
                </div>

                <Menu
                    theme="dark"
                    mode="horizontal"
                    selectedKeys={[currentKey]}
                    items={navItems}
                    onClick={({ key }) => navigate(key)}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        borderBottom: 0,
                        background: "transparent"
                    }}
                />

                <Dropdown menu={userMenu}>
                    <Button type="text" style={{ color: "#fff" }}>
                        <Space>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                            <span>{fullName}</span>
                        </Space>
                    </Button>
                </Dropdown>
            </Header>

            <Content style={{ padding: "20px 24px", background: "#f5f7fa" }}>
                <Outlet />
            </Content>
        </Layout>
    );
}

export default StaffLayout;
