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
    CheckCircleOutlined
} from "@ant-design/icons";

import {
    useCallback
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    logout
} from "@/core/utils/auth";
import { useFirebaseMessaging } from "@/features/notification/hooks/useFirebaseMessaging";
import { useNotificationWebSocket } from "@/features/notification/hooks/useNotificationWebSocket";

const { Header } = Layout;

export default function CustomerHeader() {
    const { unreadCount } = useNotificationWebSocket();

    const navigate =
        useNavigate();

    const fullName = localStorage.getItem("fullName");
    const username = localStorage.getItem("username");
    const displayName = fullName || username;
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
        enableMessaging
    } = useFirebaseMessaging({
        autoSync: isLogin,
        onMessageReceived: handleForegroundMessage
    });

    const canShowMessagingButton =
        isLogin &&
        messagingSupported &&
        permission !== "granted";

    const handleEnableNotifications = async () => {
        try {
            await enableMessaging();
            notification.success({
                message: "Đã bật thông báo",
                description: "Firebase Messaging đã được kết nối cho tài khoản customer này."
            });
        } catch (error) {
            notification.error({
                message: "Không thể bật thông báo",
                description: error?.message || "Đã xảy ra lỗi khi đăng ký FCM token."
            });
        }
    };

    const menuItems = [
        {
            key: "/home",
            label: "Trang chủ"
        },
        {
            key: "/search",
            label: "Tìm salon"
        },
        {
            key: "/branches",
            label: "Chi nhánh"
        },
        {
            key: "/appointments",
            label: "Lịch hẹn"
        },
        {
            key: "/notifications",
            label: "Thông báo"
        }
    ];

    const userMenu = {
        items: [
            {
                key: "profile",
                label: "Hồ sơ",
                onClick: () =>
                    navigate("/profile")
            },
            {
                key: "logout",
                icon:
                    <LogoutOutlined />,
                label: "Đăng xuất",
                onClick: logout
            }
        ]
    };

    return (
        <Header
            style={{
                display: "flex",
                justifyContent:
                    "space-between",
                alignItems:
                    "center",
                background: "#fff",
                borderBottom:
                    "1px solid #eee"
            }}
        >
            <div
                style={{
                    color: "#1677ff",
                    fontWeight: 700,
                    fontSize: 22
                }}
            >
                SalonFlow
            </div>

            <Menu
                mode="horizontal"
                items={menuItems}
                onClick={({ key }) =>
                    navigate(key)
                }
                style={{
                    flex: 1,
                    justifyContent:
                        "center",
                    borderBottom: 0
                }}
            />

            <Dropdown
                menu={userMenu}
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

                        {displayName}
                    </Space>
                </Button>
            </Dropdown>

            {isLogin ? (
                <Badge count={unreadCount} size="small" overflowCount={99}>
                    <Button
                        type="text"
                        icon={<BellOutlined />}
                        onClick={() => navigate("/notifications")}
                        style={{ marginLeft: 8 }}
                    >
                        Thông báo
                    </Button>
                </Badge>
            ) : null}

            {canShowMessagingButton ? (
                <Tooltip title="Bật thông báo đơn hàng, lịch hẹn">
                    <Badge dot={permission === "default"}>
                        <Button
                            type="primary"
                            icon={<BellOutlined />}
                            loading={messagingLoading}
                            onClick={handleEnableNotifications}
                            style={{ marginLeft: 12 }}
                        >
                            Bật thông báo
                        </Button>
                    </Badge>
                </Tooltip>
            ) : isLogin && permission === "granted" ? (
                <Button
                    type="default"
                    icon={<CheckCircleOutlined />}
                    disabled
                    style={{ marginLeft: 12 }}
                >
                    Đã bật thông báo
                </Button>
            ) : isLogin && permission === "denied" ? (
                <Button
                    danger
                    disabled
                    style={{ marginLeft: 12 }}
                >
                    Thông báo đã bị chặn
                </Button>
            ) : null}
        </Header>
    );
}
