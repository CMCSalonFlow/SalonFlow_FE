import {
    Layout,
    Menu,
    Button,
    Dropdown,
    Avatar,
    Space,
    Badge,
    Tooltip,
    notification
} from "antd";

import {
    UserOutlined,
    LogoutOutlined,
    BellOutlined,
    BellFilled,
    CalendarOutlined
} from "@ant-design/icons";

import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout } from "@/core/utils/auth";
import { useFirebaseMessaging } from "@/features/notification/hooks/useFirebaseMessaging";
import { useNotificationWebSocket } from "@/features/notification/hooks/useNotificationWebSocket";

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
    const { unreadCount } = useNotificationWebSocket();

    const navigate = useNavigate();
    const location = useLocation();

    const fullName = localStorage.getItem("fullName");
    const username = localStorage.getItem("username");
    const displayName = fullName || username || "Tài khoản";
    const accessToken = localStorage.getItem("accessToken");
    const isLogin = !!accessToken;

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
                key: "/services",
                label: "Dịch vụ"
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
                key: "/services",
                label: "Dịch vụ"
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

    const userMenu = {
        items: [
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
                padding: "0 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
        >
            <div
                style={{
                    color: "#1677ff",
                    fontWeight: 700,
                    fontSize: 22,
                    cursor: "pointer"
                }}
                onClick={() => navigate(isLogin ? "/home" : "/")}
            >
                SalonFlow
            </div>

            <Menu
                mode="horizontal"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{
                    flex: 1,
                    justifyContent: "center",
                    borderBottom: 0
                }}
            />

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
        </Header>
    );
}
