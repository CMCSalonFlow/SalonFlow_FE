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
    const [headerAvatarUrl, setHeaderAvatarUrl] = useState(localStorage.getItem("avatarUrl") || "");

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (isLogin && userId) {
            api.get(`/api/v1/users/${userId}`)
                .then((res) => {
                    if (res.data?.fullName) {
                        localStorage.setItem("fullName", res.data.fullName);
                        setHeaderFullName(res.data.fullName);
                    }
                    if (res.data?.avatarUrl) {
                        localStorage.setItem("avatarUrl", res.data.avatarUrl);
                        setHeaderAvatarUrl(res.data.avatarUrl);
                    }
                })
                .catch(() => { });
        }
    }, [isLogin]);

    useEffect(() => {
        const handleProfileUpdate = (e) => {
            const data = e?.detail;
            if (data) {
                if (data.avatarUrl !== undefined) {
                    setHeaderAvatarUrl(data.avatarUrl || "");
                    localStorage.setItem("avatarUrl", data.avatarUrl || "");
                }
                if (data.fullName && data.fullName.trim()) {
                    setHeaderFullName(data.fullName.trim());
                    localStorage.setItem("fullName", data.fullName.trim());
                }
            }
        };
        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, []);

    const storedFullName = headerFullName || localStorage.getItem("fullName");
    const avatarSrc = headerAvatarUrl || localStorage.getItem("avatarUrl");
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
                padding: screens.xs ? "0 12px" : "0 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                position: "sticky",
                top: 0,
                zIndex: 1000,
                width: "100%",
                height: 64,
                gap: 16
            }}
        >
            <div
                onClick={() => navigate(isLogin ? "/home" : "/")}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
            >
                <BrandLogo theme="light" subtitle="" size="small" />
            </div>

            {screens.lg ? (
                <>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
                        <Menu
                            mode="horizontal"
                            selectedKeys={[selectedKey]}
                            items={menuItems}
                            onClick={({ key }) => navigate(key)}
                            style={{
                                borderBottom: 0,
                                fontSize: "15px",
                                fontWeight: 600,
                                background: "transparent",
                                width: "100%",
                                maxWidth: 640,
                                justifyContent: "center",
                                lineHeight: "64px"
                            }}
                        />
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                        {isLogin ? (
                            <Space size={12}>
                                <Dropdown menu={userMenu} placement="bottomRight">
                                    <Button type="text" style={{ height: 40, padding: "0 8px", display: "flex", alignItems: "center" }}>
                                        <Space size={8}>
                                            <Avatar src={avatarSrc} icon={<UserOutlined />} style={{ backgroundColor: avatarSrc ? "transparent" : "#1677ff" }} />
                                            <span style={{ fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {displayName}
                                            </span>
                                        </Space>
                                    </Button>
                                </Dropdown>

                                <Badge count={unreadCount} size="small" overflowCount={99}>
                                    <Button
                                        type="text"
                                        icon={<BellOutlined style={{ fontSize: 18 }} />}
                                        onClick={() => navigate("/notifications")}
                                        style={{ display: "flex", alignItems: "center", height: 40 }}
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
                            <Space size={8}>
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
                    </div>
                </>
            ) : (
                <div style={{ display: "flex", alignItems: "center", gap: screens.xs ? 4 : 8 }}>
                    {isLogin && (
                        <>
                            <Badge count={unreadCount} size="small" overflowCount={99}>
                                <Button
                                    type="text"
                                    icon={<BellOutlined style={{ fontSize: 18 }} />}
                                    onClick={() => navigate("/notifications")}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                />
                            </Badge>

                            <Dropdown menu={userMenu} trigger={["click"]} placement="bottomRight">
                                <div style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: "0 2px" }}>
                                    <Avatar
                                        src={avatarSrc}
                                        icon={<UserOutlined />}
                                        size={32}
                                        style={{ backgroundColor: avatarSrc ? "transparent" : "#1677ff" }}
                                    />
                                </div>
                            </Dropdown>
                        </>
                    )}
                    <Button
                        icon={<MenuOutlined style={{ fontSize: 18 }} />}
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

                {!isLogin && (
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
