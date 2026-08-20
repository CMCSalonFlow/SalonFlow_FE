import { Layout, Button, Dropdown, Avatar, Space, Tag } from "antd";
import {
    CalendarOutlined,
    UnorderedListOutlined,
    LogoutOutlined,
    UserOutlined,
    ScissorOutlined,
    FileTextOutlined
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
            key: "/staff/schedule",
            icon: <CalendarOutlined />,
            label: "Lịch Làm Việc Cá Nhân"
        },
        {
            key: "/staff/appointments",
            icon: <UnorderedListOutlined />,
            label: "Danh Sách Khách Sắp Tới"
        },
        {
            key: "/staff/leave-requests",
            icon: <FileTextOutlined />,
            label: "Xin Nghỉ Phép Cá Nhân"
        }
    ];

    const currentKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || "/staff/schedule";

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
                    height: 64,
                    lineHeight: "64px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    overflow: "hidden"
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
                        onClick={() => navigate("/staff/schedule")}
                    >
                        <ScissorOutlined style={{ color: "#1890ff", fontSize: 24 }} />
                        <span>SalonFlow <Tag color="blue" style={{ fontSize: 11, marginLeft: 4 }}>WORKSTATION THỢ</Tag></span>
                    </div>
                </div>

                {/* Thanh điều hướng Tab dạng Capsule/Pill hiện đại */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = currentKey === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => navigate(item.key)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 20px",
                                    height: 40,
                                    borderRadius: 20,
                                    border: "none",
                                    background: isActive
                                        ? "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)"
                                        : "transparent",
                                    color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isActive ? "0 4px 14px rgba(22, 119, 255, 0.35)" : "none",
                                    outline: "none"
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                        e.currentTarget.style.color = "#ffffff";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                                    }
                                }}
                            >
                                <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

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
