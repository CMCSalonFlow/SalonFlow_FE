import { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Avatar, Space, Tag, Grid, Drawer, Menu, Typography } from "antd";
import {
    DesktopOutlined,
    QrcodeOutlined,
    CreditCardOutlined,
    LogoutOutlined,
    UserOutlined,
    ShopOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
    FileTextOutlined,
    MenuOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logout } from "@/core/utils/auth";
import BrandLogo from "@/core/components/BrandLogo";

import { getUserByIdApi } from "@/features/user/api/userApi";

const { Header, Content } = Layout;
const { Text } = Typography;

export function ManagerLayout() {
    const screens = Grid.useBreakpoint();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [fullName, setFullName] = useState(() => {
        const stored = localStorage.getItem("fullName") || JSON.parse(localStorage.getItem("user") || "{}")?.fullName || localStorage.getItem("username") || "Manager";
        if (stored && stored.includes("@")) {
            const namePart = stored.split("@")[0];
            return namePart.replace(/\./g, " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        }
        return stored;
    });

    useEffect(() => {
        const syncUserProfile = async () => {
            try {
                const userId = localStorage.getItem("userId");
                if (!userId) return;
                const userData = await getUserByIdApi(userId);
                const realName = userData?.fullName || userData?.name;
                if (realName && !realName.includes("@")) {
                    setFullName(realName);
                    localStorage.getItem("fullName") !== realName && localStorage.setItem("fullName", realName);
                }
            } catch (err) {
                console.warn("Could not sync user profile:", err);
            }
        };
        syncUserProfile();
    }, []);

    const navItems = [
        {
            key: "/manager/walk-in",
            icon: <DesktopOutlined />,
            label: "Tiếp Đón & Đặt Lịch Nhanh"
        },
        {
            key: "/manager/bookings",
            icon: <CheckCircleOutlined />,
            label: "Check-in & Phục Vụ"
        },
        {
            key: "/manager/off-days",
            icon: <CalendarOutlined />,
            label: "Duyệt Nghỉ Chi Nhánh"
        },
        {
            key: "/manager/leave-requests",
            icon: <FileTextOutlined />,
            label: "Xin Nghỉ Phép"
        }
    ];

    const currentKey = navItems.find(item => location.pathname.startsWith(item.key))?.key || "/manager/walk-in";

    const userMenu = {
        items: [
            {
                key: "user-info",
                label: (
                    <div style={{ padding: "4px 0" }}>
                        <div style={{ fontWeight: "bold", fontSize: 14 }}>{fullName}</div>
                        <div style={{ fontSize: "12px", color: "#8c8c8c" }}>Vai trò: Quản lý / Lễ tân</div>
                    </div>
                ),
                disabled: true
            },
            { type: "divider" },
            {
                key: "customer-home",
                icon: <ShopOutlined />,
                label: "Trang Khách Hàng",
                onClick: () => navigate("/home")
            },
            {
                key: "profile",
                icon: <UserOutlined />,
                label: "Hồ Sơ Cá Nhân",
                onClick: () => navigate("/profile")
            },
            { type: "divider" },
            {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Đăng Xuất",
                danger: true,
                onClick: logout
            }
        ]
    };

    const paddingVal = screens.sm ? "20px 24px" : "12px 8px";

    return (
        <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
            <Header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#fff",
                    borderBottom: "1px solid #eee",
                    padding: screens.xs ? "0 12px" : "0 24px",
                    height: 64,
                    lineHeight: "64px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    position: "sticky",
                    top: 0,
                    zIndex: 1000,
                    width: "100%"
                }}
            >
                {/* Brand Logo */}
                <div
                    onClick={() => navigate("/manager/walk-in")}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
                >
                    <BrandLogo theme="light" subtitle="RECEPTION & POS" size="small" />
                </div>

                {screens.md ? (
                    <>
                        {/* Desktop Navigation Pills */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1, margin: "0 16px" }}>
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
                                            padding: "6px 16px",
                                            height: 38,
                                            borderRadius: 20,
                                            border: "none",
                                            background: isActive
                                                ? "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)"
                                                : "transparent",
                                            color: isActive ? "#ffffff" : "#475569",
                                            fontWeight: isActive ? 600 : 500,
                                            fontSize: 14,
                                            cursor: "pointer",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            boxShadow: isActive ? "0 4px 12px rgba(250, 140, 22, 0.3)" : "none",
                                            outline: "none"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = "#f1f5f9";
                                                e.currentTarget.style.color = "#0f172a";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = "transparent";
                                                e.currentTarget.style.color = "#475569";
                                            }
                                        }}
                                    >
                                        <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* User Profile on Desktop */}
                        <Dropdown menu={userMenu} placement="bottomRight">
                            <Button type="text" style={{ height: 40, borderRadius: 20, padding: "0 12px" }}>
                                <Space>
                                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#fa8c16" }} />
                                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{fullName}</span>
                                </Space>
                            </Button>
                        </Dropdown>
                    </>
                ) : (
                    /* Mobile View: Avatar + Hamburger Menu Button */
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: "#fa8c16" }} />
                        <Button
                            icon={<MenuOutlined />}
                            onClick={() => setDrawerVisible(true)}
                            type="text"
                            size="large"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        />
                    </div>
                )}

                {/* Mobile Drawer (Trượt từ bên phải giống Customer) */}
                <Drawer
                    title="SalonFlow Manager"
                    placement="right"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    styles={{ wrapper: { width: 280 } }}
                >
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar size={42} icon={<UserOutlined />} style={{ backgroundColor: "#fa8c16" }} />
                            <div>
                                <Text strong style={{ fontSize: 15, display: "block", color: "#0f172a" }}>{fullName}</Text>
                                <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>Quản lý / Lễ tân</Tag>
                            </div>
                        </div>
                    </div>

                    <Menu
                        mode="inline"
                        selectedKeys={[currentKey]}
                        items={navItems.map(item => ({
                            key: item.key,
                            icon: item.icon,
                            label: item.label
                        }))}
                        onClick={({ key }) => {
                            navigate(key);
                            setDrawerVisible(false);
                        }}
                        style={{
                            borderRight: 0,
                            fontSize: "15px",
                            fontWeight: 600
                        }}
                    />

                    <div style={{ marginTop: 24, padding: "0 8px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <Button
                            block
                            type="dashed"
                            icon={<ShopOutlined />}
                            onClick={() => {
                                navigate("/home");
                                setDrawerVisible(false);
                            }}
                        >
                            Trang khách hàng
                        </Button>
                        <Button
                            block
                            type="dashed"
                            icon={<UserOutlined />}
                            onClick={() => {
                                navigate("/profile");
                                setDrawerVisible(false);
                            }}
                        >
                            Hồ sơ cá nhân
                        </Button>
                        <Button
                            block
                            danger
                            icon={<LogoutOutlined />}
                            onClick={() => {
                                logout();
                                setDrawerVisible(false);
                            }}
                        >
                            Đăng xuất
                        </Button>
                    </div>
                </Drawer>
            </Header>

            <Content style={{ padding: paddingVal, background: "#f5f7fa" }}>
                <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                    <Outlet />
                </div>
            </Content>
        </Layout>
    );
}

export default ManagerLayout;
