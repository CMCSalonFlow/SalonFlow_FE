import {
    Layout,
    Menu,
    Button,
    Dropdown,
    Avatar,
    Space,
    Badge,
    Tooltip,
    notification,
    Grid,
    Drawer,
    Typography
} from "antd";

import {
    UserOutlined,
    LogoutOutlined,
    BellOutlined,
    BellFilled,
    CalendarOutlined,
    MenuOutlined
} from "@ant-design/icons";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "@/core/utils/auth";
import api from "@/core/api/axios";

const { Text } = Typography;
import { useFirebaseMessaging } from "@/features/notification/hooks/useFirebaseMessaging";
import { useNotificationWebSocket } from "@/features/notification/hooks/useNotificationWebSocket";
import BrandLogo from "@/core/components/BrandLogo";

const { Header } = Layout;

const BellMutedIcon = ({ style }) => (
    <span role="img" aria-label="bell-muted" className="anticon" style={{ display: "inline-flex", alignItems: "center", position: "relative", ...style }}>
        <BellOutlined style={{ opacity: 0.55 }} />
        <span
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "115%",
                height: "2px",
                backgroundColor: "#ff4d4f",
                transform: "translate(-50%, -50%) rotate(-45deg)",
                borderRadius: "2px"
            }}
        />
    </span>
);

export default function AppHeader() {
    const screens = Grid.useBreakpoint();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { unreadCount } = useNotificationWebSocket();

    const navigate = useNavigate();
    const location = useLocation();

    const accessToken = localStorage.getItem("accessToken");
    const isLogin = !!accessToken;

    const [headerFullName, setHeaderFullName] = useState(localStorage.getItem("fullName") || "");

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (isLogin && userId) {
            api.get(`/api/v1/users/${userId}`)
                .then((res) => {
                    if (res.data?.fullName) {
                        localStorage.setItem("fullName", res.data.fullName);
                        setHeaderFullName(res.data.fullName);
                    }
                })
                .catch(() => {});
        }
    }, [isLogin]);

    const storedFullName = headerFullName || localStorage.getItem("fullName");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const rawName = (storedFullName && storedFullName.trim()) || storedUser?.fullName || localStorage.getItem("username") || "Tài khoản";

    const displayName = (rawName.includes("@") && !storedFullName)
        ? rawName.split("@")[0].replace(/\./g, " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase())
        : rawName;

    const handleForegroundMessage = useCallback((payload) => {
        const title = payload?.notification?.title || payload?.data?.title || "SalonFlow";
        const body = payload?.notification?.body || payload?.data?.body || "Bạn có thông báo mới.";
        const targetUrl = payload?.data?.url || "/appointments";

        notification.info({
            message: title,
            description: body,
            placement: "topRight",
            duration: 5,
            onClick: () => navigate(targetUrl)
        });
    }, [navigate]);

    const {
        permission,
        loading: messagingLoading,
        supported: messagingSupported,
        isDisabledByUser,
        enableMessaging,
        disableMessaging
    } = useFirebaseMessaging({
        autoSync: isLogin,
        onMessageReceived: handleForegroundMessage
    });

    const isNotificationOn =
        isLogin &&
        messagingSupported &&
        permission === "granted" &&
        !isDisabledByUser;

    const handleEnableNotifications = async () => {
        try {
            await enableMessaging();
            notification.success({
                message: "Đã bật thông báo thành công",
                description: "Bạn sẽ nhận được thông báo thời gian thực về lịch hẹn và ưu đãi."
            });
        } catch (error) {
            notification.error({
                message: "Không thể bật thông báo",
                description: error?.message || "Đã xảy ra lỗi khi đăng ký FCM token."
            });
        }
    };

    const handleDisableNotifications = async () => {
        try {
            await disableMessaging();
            notification.info({
                message: "Đã tắt thông báo",
                description: "Bạn đã tắt nhận thông báo đẩy. Bạn có thể bật lại bất cứ lúc nào."
            });
        } catch (error) {
            notification.error({
                message: "Không thể tắt thông báo",
                description: error?.message || "Đã xảy ra lỗi khi hủy token thông báo."
            });
        }
    };

    const menuItems = isLogin
        ? [
            {
                key: "/home",
                label: "Trang chủ"
            },
            {
                key: "/search",
                label: "Tìm salon"
            },
            {
                key: "/hair-ai",
                label: "Hair AI"
            },
            {
                key: "/booking",
                label: "Đặt lịch"
            },
            {
                key: "/appointments",
                label: "Lịch hẹn"
            }
        ]
        : [
            {
                key: "/",
                label: "Trang chủ"
            },
            {
                key: "/search",
                label: "Tìm salon"
            },
            {
                key: "/guest-booking",
                label: "Đặt lịch"
            }
        ];

    const selectedKey = menuItems.find(item => {
        if (item.key === "/" || item.key === "/home") {
            return location.pathname === "/" || location.pathname === "/home";
        }
        return location.pathname.startsWith(item.key);
    })?.key || (isLogin ? "/home" : "/");

    const rolesStr = localStorage.getItem("roles");
    const roles = (() => {
        try {
            return rolesStr ? JSON.parse(rolesStr) : [];
        } catch {
            return [];
        }
    })();

    const isSalonOwner = roles.includes("SALON_OWNER");
    const isSuperAdmin = roles.includes("SUPER_ADMIN");
    const isManagerRole = roles.includes("MANAGER") || roles.includes("BRANCH_MANAGER");
    const isStaffRole = roles.includes("STAFF");
    const hasAdminOrOwnerAccess = isSalonOwner || isSuperAdmin || isManagerRole || isStaffRole;

    const getDashboardLabel = () => {
        if (isSuperAdmin) return "Trang Super Admin";
        if (isSalonOwner) return "Trang Quản Lý Salon";
        if (isManagerRole) return "Trang Lễ Tân / Quản Lý";
        return "Trang Workstation Thợ";
    };

    const getDashboardPath = () => {
        if (isSuperAdmin) return "/admin";
        if (isSalonOwner) return "/owner";
        if (isManagerRole) return "/manager/pos";
        return "/staff/schedule";
    };

    const userMenu = {
        items: [
            ...(hasAdminOrOwnerAccess ? [
                {
                    key: "dashboard",
                    icon: <UserOutlined style={{ color: "#1890ff" }} />,
                    label: getDashboardLabel(),
                    onClick: () => navigate(getDashboardPath())
                },
                { type: "divider" }
            ] : []),

            {
                key: "profile",
                icon: <UserOutlined />,
                label: "Hồ sơ",
                onClick: () => navigate("/profile")
            },
            {
                key: "appointments",
                icon: <CalendarOutlined />,
                label: "Lịch hẹn",
                onClick: () => navigate("/appointments")
            },
            {
                type: "divider"
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
                borderBottom: "1px solid #eee",
                padding: screens.xs ? "0 10px" : "0 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                width: "100%"
            }}
        >
            <div
                onClick={() => navigate(isLogin ? "/home" : "/")}
                style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
                <BrandLogo theme="light" subtitle="" size="small" />
            </div>

            {screens.md ? (
                <>
                    <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", justifyContent: "center" }}>
                        <Menu
                            mode="horizontal"
                            selectedKeys={[selectedKey]}
                            items={menuItems}
                            onClick={({ key }) => navigate(key)}
                            style={{
                                borderBottom: 0,
                                fontSize: "16px",
                                fontWeight: 600,
                                background: "transparent",
                                display: "flex",
                                justifyContent: "center",
                                gap: "24px"
                            }}
                        />
                    </div>

                    {isLogin ? (
                        <Space size={12}>
                            <Dropdown menu={userMenu}>
                                <Button type="text">
                                    <Space>
                                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1677ff" }} />
                                        <span>{displayName}</span>
                                    </Space>
                                </Button>
                            </Dropdown>

                            <Badge count={unreadCount} size="small" overflowCount={99}>
                                <Button
                                    type="text"
                                    icon={<BellOutlined />}
                                    onClick={() => navigate("/notifications")}
                                >
                                    Thông báo
                                </Button>
                            </Badge>

                            {messagingSupported ? (
                                <Tooltip
                                    title={
                                        permission === "denied"
                                            ? "Trình duyệt đang chặn thông báo. Hãy mở quyền trong cài đặt trình duyệt."
                                            : isNotificationOn
                                            ? "Đang BẬT nhận thông báo. Bấm để TẮT"
                                            : "Đang TẮT nhận thông báo. Bấm để BẬT"
                                    }
                                >
                                    <Button
                                        type="text"
                                        shape="circle"
                                        size="large"
                                        loading={messagingLoading}
                                        disabled={permission === "denied"}
                                        onClick={isNotificationOn ? handleDisableNotifications : handleEnableNotifications}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: isNotificationOn ? "#e6f4ff" : "#f5f5f5",
                                            border: `1px solid ${isNotificationOn ? "#91caff" : "#d9d9d9"}`,
                                            boxShadow: isNotificationOn ? "0 2px 8px rgba(22, 119, 255, 0.18)" : "none",
                                            transition: "all 0.3s ease"
                                        }}
                                        icon={
                                            isNotificationOn ? (
                                                <BellFilled style={{ fontSize: 18, color: "#1677ff" }} />
                                            ) : (
                                                <BellMutedIcon style={{ fontSize: 18 }} />
                                            )
                                        }
                                    />
                                </Tooltip>
                            ) : null}
                        </Space>
                    ) : (
                        <Space>
                            <Button
                                type="primary"
                                onClick={() => navigate("/guest-booking")}
                            >
                                Đặt lịch ngay
                            </Button>

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
                    )}
                </>
            ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isLogin && (
                        <Badge count={unreadCount} size="small" overflowCount={99}>
                            <Button
                                type="text"
                                icon={<BellOutlined />}
                                onClick={() => navigate("/notifications")}
                                style={{ display: "flex", alignItems: "center" }}
                            />
                        </Badge>
                    )}
                    <Button
                        icon={<MenuOutlined />}
                        onClick={() => setDrawerVisible(true)}
                        type="text"
                        size="large"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                    />
                </div>
            )}

            <Drawer
                title="SalonFlow"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ wrapper: { width: 260 } }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={({ key }) => {
                        navigate(key);
                        setDrawerVisible(false);
                    }}
                    style={{
                        borderRight: 0,
                        fontSize: "17px",
                        fontWeight: 600
                    }}
                />

                {isLogin ? (
                    <div style={{ marginTop: 24, padding: "0 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1677ff" }} />
                            <Text strong>{displayName}</Text>
                        </div>
                        <Button
                            block
                            type="dashed"
                            icon={<UserOutlined />}
                            onClick={() => { navigate("/profile"); setDrawerVisible(false); }}
                            style={{ marginBottom: 8 }}
                        >
                            Hồ sơ
                        </Button>
                        <Button
                            block
                            type="dashed"
                            icon={<CalendarOutlined />}
                            onClick={() => { navigate("/appointments"); setDrawerVisible(false); }}
                            style={{ marginBottom: 8 }}
                        >
                            Lịch hẹn
                        </Button>
                        <Button
                            block
                            danger
                            icon={<LogoutOutlined />}
                            onClick={() => { logout(); setDrawerVisible(false); }}
                        >
                            Đăng xuất
                        </Button>
                    </div>
                ) : (
                    <div style={{ marginTop: 24, padding: "0 8px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <Button type="primary" block onClick={() => { navigate("/guest-booking"); setDrawerVisible(false); }}>
                            Đặt lịch ngay
                        </Button>
                        <Button block onClick={() => { navigate("/login"); setDrawerVisible(false); }}>
                            Đăng nhập
                        </Button>
                        <Button type="primary" block onClick={() => { navigate("/register"); setDrawerVisible(false); }}>
                            Đăng ký
                        </Button>
                    </div>
                )}
            </Drawer>
        </Header>
    );
}
