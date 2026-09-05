import { useState, useEffect } from "react";
import { Layout, Button, Dropdown, Avatar, Space, Tag, Grid, Drawer, Menu, Typography } from "antd";
import {
    CalendarOutlined,
    UnorderedListOutlined,
    LogoutOutlined,
    UserOutlined,
    ShopOutlined,
    FileTextOutlined,
    MenuOutlined
} from "@ant-design/icons";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { logout } from "@/core/utils/auth";
import BrandLogo from "@/core/components/BrandLogo";
import { getUserByIdApi } from "@/features/user/api/userApi";

const { Header, Content } = Layout;
const { Text } = Typography;

export function StaffLayout() {
    const screens = Grid.useBreakpoint();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [avatarUrl, setAvatarUrl] = useState(() => {
        const stored = localStorage.getItem("avatarUrl");
        return (stored && stored !== "null" && stored !== "undefined") ? stored : "";
    });
    const [fullName, setFullName] = useState(() => {
        const stored = localStorage.getItem("fullName") || JSON.parse(localStorage.getItem("user") || "{}")?.fullName || localStorage.getItem("username") || "Staff";
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
                if (userData?.avatarUrl) {
                    setAvatarUrl(userData.avatarUrl);
                    localStorage.setItem("avatarUrl", userData.avatarUrl);
                }
            } catch (err) {
                console.warn("Could not sync user profile:", err);
            }
        };
        syncUserProfile();
    }, []);

    useEffect(() => {
        const handleProfileUpdate = (e) => {
            const data = e?.detail;
            if (data) {
                if (data.avatarUrl !== undefined) {
                    setAvatarUrl(data.avatarUrl || "");
                    localStorage.setItem("avatarUrl", data.avatarUrl || "");
                }
                if (data.fullName && data.fullName.trim()) {
                    setFullName(data.fullName.trim());
                    localStorage.setItem("fullName", data.fullName.trim());
                }
            }
        };
        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, []);

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

    const validAvatarUrl = (avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined" && avatarUrl.trim() !== "") ? avatarUrl : null;

    const userMenu = {
        items: [
            {
                key: "profile",
                icon: <UserOutlined />,
                label: "Hồ Sơ Cá Nhân",
                onClick: () => navigate("/staff/profile")
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

    const isSchedulePage = location.pathname.startsWith("/staff/schedule");
    const paddingVal = isSchedulePage ? 0 : (screens.sm ? "20px 24px" : "12px 8px");

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
                    onClick={() => navigate("/staff/schedule")}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
                >
                    <BrandLogo theme="light" subtitle="WORKSTATION THỢ" size="small" />
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
                                                ? "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)"
                                                : "transparent",
                                            color: isActive ? "#ffffff" : "#475569",
                                            fontWeight: isActive ? 600 : 500,
                                            fontSize: 14,
                                            cursor: "pointer",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            boxShadow: isActive ? "0 4px 12px rgba(22, 119, 255, 0.3)" : "none",
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
                        <Dropdown menu={userMenu} placement="bottomRight" arrow>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "4px 12px 4px 6px",
                                    borderRadius: 24,
                                    background: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <Avatar
                                    src={validAvatarUrl || undefined}
                                    onError={() => false}
                                    style={{
                                        background: validAvatarUrl ? "transparent" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                        color: "#fff",
                                        fontWeight: 700
                                    }}
                                    size={32}
                                    icon={<UserOutlined style={{ color: "#fff" }} />}
                                >
                                    {!validAvatarUrl && fullName?.[0]?.toUpperCase()}
                                </Avatar>

                                {screens.sm && (
                                    <div style={{ lineHeight: 1.2 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fullName}</div>
                                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>Nhân viên</div>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </>
                ) : (
                    /* Mobile View: Avatar + Hamburger Menu Button */
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar
                            src={validAvatarUrl || undefined}
                            onError={() => false}
                            icon={<UserOutlined style={{ color: "#fff" }} />}
                            size="small"
                            style={{ background: validAvatarUrl ? "transparent" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff" }}
                        />
                        <Button
                            icon={<MenuOutlined />}
                            onClick={() => setDrawerVisible(true)}
                            type="text"
                            size="large"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        />
                    </div>
                )}

                {/* Mobile Drawer (Trượt từ bên phải đồng bộ Manager/Customer) */}
                <Drawer
                    title="SalonFlow Staff"
                    placement="right"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    styles={{ wrapper: { width: 280 } }}
                >
                    <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar
                                src={validAvatarUrl || undefined}
                                onError={() => false}
                                size={42}
                                icon={<UserOutlined style={{ color: "#fff" }} />}
                                style={{ background: validAvatarUrl ? "transparent" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff", fontWeight: 700 }}
                            >
                                {!validAvatarUrl && fullName?.[0]?.toUpperCase()}
                            </Avatar>
                            <div>
                                <Text strong style={{ fontSize: 15, display: "block", color: "#0f172a" }}>{fullName}</Text>
                                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>Kỹ thuật viên / Thợ</Tag>
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
                            icon={<UserOutlined />}
                            onClick={() => {
                                navigate("/staff/profile");
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
                {isSchedulePage ? (
                    <Outlet />
                ) : (
                    <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                        <Outlet />
                    </div>
                )}
            </Content>
        </Layout>
    );
}

export default StaffLayout;
