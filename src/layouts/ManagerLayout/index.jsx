import { Layout, Button, Dropdown, Avatar, Space, Tag } from "antd";
import {
    DesktopOutlined,
    QrcodeOutlined,
    CreditCardOutlined,
    LogoutOutlined,
    UserOutlined,
    ShopOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logout } from "@/core/utils/auth";

const { Header, Content } = Layout;

export function ManagerLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const username = localStorage.getItem("username") || "Manager";
    const fullName = localStorage.getItem("fullName") || username;

    const navItems = [
        {
            key: "/manager/walk-in",
            icon: <CreditCardOutlined />,
            label: "Đặt Lịch & POS Tại Quầy (Walk-in)"
        },
        {
            key: "/manager/bookings",
            icon: <CheckCircleOutlined />,
            label: "Check-in & Hoàn Thành"
        },
        {
            key: "/manager/checkout",
            icon: <QrcodeOutlined />,
            label: "Thanh Toán & QR Checkout"
        }
    ];

    const currentKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || "/manager/walk-in";


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
                        onClick={() => navigate("/manager/walk-in")}

                    >
                        <ShopOutlined style={{ color: "#fa8c16", fontSize: 24 }} />
                        <span>SalonFlow <Tag color="gold" style={{ fontSize: 11, marginLeft: 4 }}>RECEPTION & POS</Tag></span>
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
                                        ? "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)"
                                        : "transparent",
                                    color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: 14,
                                    cursor: "pointer",
                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: isActive ? "0 4px 14px rgba(250, 140, 22, 0.35)" : "none",
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
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#fa8c16" }} />
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

export default ManagerLayout;
