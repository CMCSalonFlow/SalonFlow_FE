import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    List,
    Typography,
    Tag,
    Button,
    Empty,
    Spin,
    Space,
    Row,
    Col,
    message,
    Divider
} from "antd";
import {
    BellOutlined,
    CheckOutlined,
    ReloadOutlined,
    CalendarOutlined,
    RightOutlined
} from "@ant-design/icons";
import {
    getMyNotificationsApi,
    markNotificationAsReadApi,
    markAllNotificationsAsReadApi
} from "@/features/notification/api/notificationApi";
import { useNotificationWebSocket } from "@/features/notification/hooks/useNotificationWebSocket";

const { Title, Text, Paragraph } = Typography;

const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date);
};

const normalizeNotifications = (items) => {
    if (!Array.isArray(items)) return [];

    return items
        .slice()
        .sort((a, b) => {
            const aTime = new Date(a?.createdAt || 0).getTime();
            const bTime = new Date(b?.createdAt || 0).getTime();
            return bTime - aTime;
        });
};

const parseNotificationPayload = (item) => {
    if (!item?.payloadJson) return null;

    try {
        return JSON.parse(item.payloadJson);
    } catch {
        return null;
    }
};

const inferBookingVariant = (item, payload) => {
    const text = [
        item?.eventType,
        item?.title,
        item?.message,
        payload?.eventType,
        payload?.type,
        payload?.status
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (text.includes("cancel") || text.includes("hủy") || text.includes("huy")) return "cancelled";
    if (text.includes("reminder") || text.includes("nhắc") || text.includes("24h")) return "reminder";
    return "confirmed";
};

const resolveNotificationBookingTarget = (item) => {
    const payload = parseNotificationPayload(item);
    const booking = payload?.booking && typeof payload.booking === "object" ? payload.booking : payload;

    const bookingId = item?.bookingId || payload?.bookingId || booking?.bookingId || booking?.id || "";
    const branchId = item?.branchId || payload?.branchId || booking?.branchId || booking?.branch?.id || "";
    const variant = inferBookingVariant(item, payload);

    return {
        bookingId: bookingId ? String(bookingId) : "",
        branchId: branchId ? String(branchId) : "",
        variant,
        booking: booking && typeof booking === "object" ? booking : null
    };
};

export default function CustomerNotificationsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const handleNewWebSocketNotification = (newNotif) => {
        if (!newNotif) return;
        setNotifications((prev) => normalizeNotifications([newNotif, ...prev.filter(item => String(item.id) !== String(newNotif.id))]));
    };

    const { unreadCount, setUnreadCount, refreshUnreadCount } = useNotificationWebSocket(handleNewWebSocketNotification);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyNotificationsApi();
            setNotifications(normalizeNotifications(data));
            void refreshUnreadCount();
        } catch (error) {
            message.error(error?.message || "Không thể tải danh sách thông báo.");
        } finally {
            setLoading(false);
        }
    }, [refreshUnreadCount]);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            loadNotifications();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [loadNotifications]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationAsReadApi(notificationId);
            setNotifications((prev) => prev.map((item) => (
                String(item.id) === String(notificationId)
                    ? { ...item, status: "READ", isRead: true, readAt: item.readAt || new Date().toISOString() }
                    : item
            )));
            setUnreadCount((prev) => Math.max(0, prev - 1));
            message.success("Đã đánh dấu đã đọc.");
        } catch (error) {
            message.error(error?.message || "Không thể đánh dấu đã đọc.");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsReadApi();
            setNotifications((prev) => prev.map((item) => ({
                ...item,
                status: "READ",
                isRead: true,
                readAt: item.readAt || new Date().toISOString()
            })));
            setUnreadCount(0);
            message.success("Đã đánh dấu tất cả thông báo là đã đọc.");
        } catch (error) {
            message.error(error?.message || "Không thể đánh dấu tất cả đã đọc.");
        }
    };

    const handleOpenRelated = (item) => {
        if (item?.bookingId || item?.sourceType === "BOOKING" || item?.eventType) {
            const target = resolveNotificationBookingTarget(item);
            if (target.bookingId) {
                const search = new URLSearchParams();
                search.set("bookingId", target.bookingId);
                if (target.branchId) search.set("branchId", target.branchId);

                navigate(`/booking/status/${target.variant}?${search.toString()}`, {
                    state: target.booking ? { booking: target.booking } : undefined
                });
                return;
            }

            navigate("/appointments");
            return;
        }
        navigate("/home");
    };

    const unreadOnly = notifications.filter((item) => {
        const status = String(item?.status || "").toUpperCase();
        return status !== "READ" && !item?.isRead;
    }).length;

    return (
        <div style={{ padding: "24px 0 40px" }}>
            <Row gutter={[24, 24]} align="middle" style={{ marginBottom: 20 }}>
                <Col xs={24} md={14}>
                    <Title level={2} style={{ marginBottom: 8 }}>
                        Thông báo của bạn
                    </Title>
                    <Paragraph style={{ marginBottom: 0, color: "#666" }}>
                        Xem thông báo lịch hẹn, thanh toán và các cập nhật từ SalonFlow.
                    </Paragraph>
                </Col>
                <Col xs={24} md={10} style={{ textAlign: "right" }}>
                    <Space wrap>
                        <Tag color="blue" icon={<BellOutlined />}>
                            {`${unreadCount} chưa đọc`}
                        </Tag>
                        <Button
                            icon={<CheckOutlined />}
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0 && unreadOnly === 0}
                        >
                            Đánh dấu tất cả đã đọc
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={loadNotifications}>
                            Tải lại
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Card style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.04)" }}>
                <Spin spinning={loading}>
                    {notifications.length === 0 ? (
                        <Empty
                            description="Chưa có thông báo nào"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <List
                            itemLayout="vertical"
                            dataSource={notifications}
                            split={false}
                            renderItem={(item) => {
                                const isRead = String(item?.status || "").toUpperCase() === "READ";
                                return (
                                    <List.Item
                                        style={{
                                            padding: 0,
                                            marginBottom: 16,
                                            border: 0
                                        }}
                                    >
                                        <Card
                                            hoverable
                                            onClick={() => handleOpenRelated(item)}
                                            style={{
                                                borderRadius: 16,
                                                border: isRead ? "1px solid #f0f0f0" : "1px solid #91caff",
                                                background: isRead ? "#fff" : "#f0f9ff"
                                            }}
                                        >
                                            <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                                <Space wrap>
                                                    <Text strong style={{ fontSize: 16 }}>
                                                        {item?.title || "Thông báo"}
                                                    </Text>
                                                    {!isRead && <Tag color="processing">Chưa đọc</Tag>}
                                                    {item?.eventType && <Tag>{item.eventType}</Tag>}
                                                    {item?.channel && <Tag color="geekblue">{item.channel}</Tag>}
                                                </Space>

                                                <Text style={{ color: "#444" }}>
                                                    {item?.message || "Không có nội dung."}
                                                </Text>

                                                {item?.payloadJson ? (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Dữ liệu: {item.payloadJson}
                                                    </Text>
                                                ) : null}

                                                <Divider style={{ margin: "8px 0" }} />

                                                <Space wrap>
                                                    <Space size={6}>
                                                        <CalendarOutlined />
                                                        <Text type="secondary">
                                                            {formatDateTime(item?.createdAt)}
                                                        </Text>
                                                    </Space>
                                                    {item?.readAt ? (
                                                        <Space size={6}>
                                                            <CheckOutlined />
                                                            <Text type="secondary">
                                                                Đã đọc lúc {formatDateTime(item.readAt)}
                                                            </Text>
                                                        </Space>
                                                    ) : null}
                                                </Space>

                                                <Space wrap style={{ marginTop: 4 }}>
                                                    {!isRead ? (
                                                        <Button
                                                            type="primary"
                                                            icon={<CheckOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(item.id);
                                                            }}
                                                        >
                                                            Đánh dấu đã đọc
                                                        </Button>
                                                    ) : null}

                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenRelated(item);
                                                        }}
                                                    >
                                                        Mở liên quan
                                                        <RightOutlined />
                                                    </Button>
                                                </Space>
                                            </Space>
                                        </Card>
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </Spin>
            </Card>

            <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
                Tổng chưa đọc: {unreadCount} | Chưa đọc trong danh sách: {unreadOnly}
            </div>
        </div>
    );
}
