import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Empty,
    Result,
    Row,
    Space,
    Tag,
    Typography,
    Spin,
    Alert
} from "antd";
import {
    BellOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    HomeOutlined,
    QrcodeOutlined,
    ShopOutlined,
    UserOutlined
} from "@ant-design/icons";
import { getBookingByIdApi, getBookingsByBranchApi } from "../api/bookingApi";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";

const { Title, Text, Paragraph } = Typography;

const BOOKING_STORAGE_KEY = "salonflow_last_booking_detail";
const PAYMENT_STORAGE_KEY = "salonflow_last_pay_at_counter_booking";

const STATUS_VARIANTS = {
    confirmed: {
        title: "Xác nhận đặt lịch",
        subtitle: "Booking đã được ghi nhận và backend sẽ tự gửi email xác nhận.",
        resultStatus: "success",
        accent: "#1677ff",
        softBg: "linear-gradient(135deg, rgba(22,119,255,0.12), rgba(82,196,26,0.08))",
        tagColor: "blue",
        icon: <CheckCircleOutlined />,
        badgeText: "Đã xác nhận",
        steps: [
            "Email xác nhận đã được tạo ở backend.",
            "QR code sẽ hiển thị nếu booking response có dữ liệu inline.",
            "Bạn có thể mở lịch hẹn để kiểm tra chi tiết hoặc đổi lịch."
        ],
        primaryAction: { label: "Mở lịch hẹn của tôi", to: "/appointments" },
        secondaryAction: { label: "Đặt lịch mới", to: "/booking" }
    },
    reminder: {
        title: "Nhắc lịch 24h trước",
        subtitle: "Màn hình này mô phỏng nội dung nhắc lịch tự động từ backend.",
        resultStatus: "info",
        accent: "#fa8c16",
        softBg: "linear-gradient(135deg, rgba(250,140,22,0.14), rgba(24,144,255,0.08))",
        tagColor: "gold",
        icon: <BellOutlined />,
        badgeText: "Nhắc lịch",
        steps: [
            "Kiểm tra thời gian, chi nhánh và nhân viên trước khi đến salon.",
            "Nếu cần thanh toán cọc, hãy hoàn tất trước giờ hẹn.",
            "Có thể mở màn hình chi tiết booking để đối chiếu nhanh."
        ],
        primaryAction: { label: "Mở lịch hẹn", to: "/appointments" },
        secondaryAction: { label: "Về trang chủ", to: "/" }
    },
    cancelled: {
        title: "Thông báo hủy lịch",
        subtitle: "Booking đã bị hủy, kèm tóm tắt lý do và phí hủy nếu có.",
        resultStatus: "error",
        accent: "#cf1322",
        softBg: "linear-gradient(135deg, rgba(207,19,34,0.12), rgba(255,77,79,0.08))",
        tagColor: "red",
        icon: <CloseCircleOutlined />,
        badgeText: "Đã hủy",
        steps: [
            "Lịch hẹn này không còn hiệu lực.",
            "Nếu có phí hủy, hệ thống sẽ hiển thị ngay trong chi tiết booking.",
            "Bạn có thể đặt lại lịch mới cho khung giờ khác."
        ],
        primaryAction: { label: "Đặt lịch lại", to: "/booking" },
        secondaryAction: { label: "Mở lịch hẹn", to: "/appointments" }
    }
};

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

const formatDateValue = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium"
    }).format(date);
};

const readStoredBooking = () => {
    const keys = [BOOKING_STORAGE_KEY, PAYMENT_STORAGE_KEY];

    for (const key of keys) {
        const raw = sessionStorage.getItem(key);
        if (!raw) continue;

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch {
            // Ignore invalid stored payloads.
        }
    }

    return null;
};

const resolveQrSource = (booking) => {
    const qrValue =
        booking?.qrCodeBase64 ||
        booking?.qrCode ||
        booking?.qrImageBase64 ||
        booking?.qrImage;

    if (!qrValue || typeof qrValue !== "string") return null;
    if (qrValue.startsWith("data:image")) return qrValue;
    if (qrValue.startsWith("http")) return qrValue;

    return `data:image/png;base64,${qrValue}`;
};

const normalizeBookingId = (value) => {
    if (value === undefined || value === null) return "";
    return String(value).trim();
};

export default function BookingStatusPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const variant = STATUS_VARIANTS[params.variant] ? params.variant : "confirmed";
    const config = STATUS_VARIANTS[variant];

    const locationBooking = location.state?.booking || null;
    const storedBooking = useMemo(() => readStoredBooking(), []);

    const queryBookingId = searchParams.get("bookingId") || location.state?.bookingId || "";
    const queryBranchId = searchParams.get("branchId") || location.state?.branchId || "";

    const [booking, setBooking] = useState(locationBooking || storedBooking);
    const [loading, setLoading] = useState(Boolean(queryBookingId) || !booking);
    const [errorMsg, setErrorMsg] = useState("");
    const [resolvedFrom, setResolvedFrom] = useState(locationBooking ? "state" : (storedBooking ? "storage" : ""));

    useEffect(() => {
        let cancelled = false;

        const persistBooking = (value) => {
            try {
                sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(value));
            } catch {
                // Best effort only.
            }
        };

        const scanMyBookings = async (targetBookingId) => {
            const branches = await getMyBranchesApi();
            for (const branch of branches || []) {
                const items = await getBookingsByBranchApi(branch.id).catch(() => []);
                const found = (items || []).find((item) => normalizeBookingId(item?.id) === targetBookingId);
                if (found) {
                    return found;
                }
            }
            return null;
        };

        const resolveBooking = async () => {
            try {
                setLoading(true);
                setErrorMsg("");

                const targetBookingId = normalizeBookingId(queryBookingId || locationBooking?.id || storedBooking?.id);
                const targetBranchId = normalizeBookingId(queryBranchId || locationBooking?.branchId || locationBooking?.branch?.id || storedBooking?.branchId || storedBooking?.branch?.id);

                if (locationBooking && !targetBookingId) {
                    setBooking(locationBooking);
                    setResolvedFrom("state");
                    persistBooking(locationBooking);
                    return;
                }

                if (storedBooking && !targetBookingId) {
                    setBooking(storedBooking);
                    setResolvedFrom("storage");
                    return;
                }

                if (!targetBookingId) {
                    setErrorMsg("Không tìm thấy mã booking để tải chi tiết thật.");
                    return;
                }

                let resolved = null;

                if (targetBranchId) {
                    resolved = await getBookingByIdApi(targetBranchId, targetBookingId);
                } else if (storedBooking && normalizeBookingId(storedBooking.id) === targetBookingId) {
                    resolved = storedBooking;
                } else {
                    resolved = await scanMyBookings(targetBookingId).catch(() => null);
                }

                if (!cancelled) {
                    if (resolved) {
                        setBooking(resolved);
                        setResolvedFrom(targetBranchId ? "api" : "scan");
                        persistBooking(resolved);
                    } else {
                        setErrorMsg("Không tải được booking từ backend. Vui lòng thử mở từ lịch hẹn hoặc thông báo gốc.");
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    setErrorMsg(error?.response?.data?.message || error?.message || "Không thể tải chi tiết booking.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        resolveBooking();

        return () => {
            cancelled = true;
        };
    }, [queryBookingId, queryBranchId, locationBooking, storedBooking]);

    const qrSrc = resolveQrSource(booking);
    const serviceItems = Array.isArray(booking?.items) ? booking.items : [];
    const totalPrice = Number(booking?.totalPrice || 0);
    const depositAmount = Number(booking?.depositAmount || booking?.payableAmount || 0);
    const cancelFeeAmount = Number(booking?.cancelFeeAmount || booking?.feeAmount || 0);

    const handleGo = (path) => navigate(path);

    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "calc(100vh - 160px)",
                padding: "24px 0 40px",
                background:
                    "radial-gradient(circle at top left, rgba(22,119,255,0.14), transparent 30%), radial-gradient(circle at top right, rgba(250,140,22,0.10), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #f6f8fc 100%)"
            }}
        >
            <Card
                style={{
                    maxWidth: 1120,
                    margin: "0 auto",
                    borderRadius: 28,
                    overflow: "hidden",
                    border: "none",
                    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)"
                }}
                bodyStyle={{ padding: 0 }}
            >
                <div
                    style={{
                        padding: 28,
                        background: config.softBg,
                        borderBottom: "1px solid #edf2f7"
                    }}
                >
                    <Space size="middle" align="center" style={{ marginBottom: 14 }}>
                        <div
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 18,
                                display: "grid",
                                placeItems: "center",
                                background: "#fff",
                                color: config.accent,
                                boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
                                fontSize: 22
                            }}
                        >
                            {config.icon}
                        </div>
                        <div>
                            <Tag color={config.tagColor} style={{ marginBottom: 8, borderRadius: 999, paddingInline: 12 }}>
                                {config.badgeText}
                            </Tag>
                            <Title level={2} style={{ margin: 0 }}>
                                {config.title}
                            </Title>
                        </div>
                    </Space>
                    <Paragraph style={{ marginBottom: 0, maxWidth: 780, color: "#475569", fontSize: 16 }}>
                        {config.subtitle}
                    </Paragraph>
                </div>

                <div style={{ padding: 28 }}>
                    {errorMsg ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="Không thể tải dữ liệu thật"
                            description={errorMsg}
                            style={{ marginBottom: 20, borderRadius: 16 }}
                        />
                    ) : null}

                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={15}>
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 22,
                                    background: "#ffffff",
                                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)"
                                }}
                            >
                                {booking ? (
                                    <>
                                        <Result
                                            status={config.resultStatus}
                                            icon={null}
                                            title={
                                                <Space size={10} wrap>
                                                    {config.icon}
                                                    <span>{config.title}</span>
                                                    <Tag color={config.tagColor} style={{ marginInlineStart: 8 }}>
                                                        {booking.status || config.badgeText}
                                                    </Tag>
                                                </Space>
                                            }
                                            subTitle={`Màn hình này dùng chung cho booking confirmation, reminder 24h và thông báo hủy. Nguồn dữ liệu: ${resolvedFrom || "unknown"}.`}
                                            style={{ paddingTop: 0 }}
                                        />

                                        <Descriptions
                                            bordered
                                            column={1}
                                            size="middle"
                                            labelStyle={{ width: 180, color: "#64748b" }}
                                            contentStyle={{ fontWeight: 600 }}
                                        >
                                            <Descriptions.Item label="Mã đặt lịch">
                                                #{booking.id || "-"}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Chi nhánh">
                                                <Space>
                                                    <ShopOutlined />
                                                    <span>{booking.branchName || booking.branch?.name || "-"}</span>
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Ngày hẹn">
                                                <Space>
                                                    <CalendarOutlined />
                                                    <span>{formatDateValue(booking.bookingDate)}</span>
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Giờ hẹn">
                                                <Space>
                                                    <ClockCircleOutlined />
                                                    <span>
                                                        {booking.startTime?.substring?.(0, 5) || "--:--"}
                                                        {" - "}
                                                        {booking.endTime?.substring?.(0, 5) || "--:--"}
                                                    </span>
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Nhân viên">
                                                <Space>
                                                    <UserOutlined />
                                                    <span>{booking.assignedStaffName || booking.staffName || "Tự động phân bổ"}</span>
                                                </Space>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Khách hàng">
                                                {booking.customerName || booking.customer?.name || "-"}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Tiền cọc">
                                                {formatCurrency(depositAmount)} đ
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Tổng giá trị">
                                                {formatCurrency(totalPrice)} đ
                                            </Descriptions.Item>
                                            {variant === "cancelled" ? (
                                                <Descriptions.Item label="Phí hủy">
                                                    {formatCurrency(cancelFeeAmount)} đ
                                                </Descriptions.Item>
                                            ) : null}
                                        </Descriptions>

                                        {booking.notes ? (
                                            <div
                                                style={{
                                                    marginTop: 18,
                                                    padding: 16,
                                                    borderRadius: 16,
                                                    background: "#f8fafc",
                                                    border: "1px solid #e2e8f0"
                                                }}
                                            >
                                                <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
                                                    Ghi chú khách hàng
                                                </Text>
                                                <Text>{booking.notes}</Text>
                                            </div>
                                        ) : null}

                                        {variant === "cancelled" && (booking.cancelReason || booking.cancellationMessage) ? (
                                            <div
                                                style={{
                                                    marginTop: 18,
                                                    padding: 16,
                                                    borderRadius: 16,
                                                    background: "#fff1f0",
                                                    border: "1px solid #ffa39e"
                                                }}
                                            >
                                                <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
                                                    Lý do / ghi chú hủy
                                                </Text>
                                                <Text>{booking.cancelReason || booking.cancellationMessage}</Text>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="Chưa có dữ liệu booking để hiển thị."
                                    >
                                        <Space wrap>
                                            <Button type="primary" onClick={() => handleGo(config.primaryAction.to)}>
                                                {config.primaryAction.label}
                                            </Button>
                                            <Button onClick={() => handleGo(config.secondaryAction.to)}>
                                                {config.secondaryAction.label}
                                            </Button>
                                        </Space>
                                    </Empty>
                                )}
                            </Card>
                        </Col>

                        <Col xs={24} lg={9}>
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                <Card
                                    bordered={false}
                                    style={{
                                        borderRadius: 22,
                                        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)"
                                    }}
                                >
                                    <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                                        Tiếp theo
                                    </Text>
                                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                        {config.steps.map((step) => (
                                            <div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                <CheckCircleOutlined style={{ color: config.accent, marginTop: 2 }} />
                                                <Text>{step}</Text>
                                            </div>
                                        ))}
                                    </Space>
                                </Card>

                                <Card
                                    bordered={false}
                                    style={{
                                        borderRadius: 22,
                                        background: "#ffffff",
                                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)"
                                    }}
                                >
                                    <Space align="center" style={{ marginBottom: 12 }}>
                                        <QrcodeOutlined style={{ fontSize: 18, color: config.accent }} />
                                        <Text strong>QR inline</Text>
                                    </Space>

                                    {qrSrc ? (
                                        <div style={{ textAlign: "center" }}>
                                            <img
                                                src={qrSrc}
                                                alt="QR code booking"
                                                style={{
                                                    width: 220,
                                                    maxWidth: "100%",
                                                    borderRadius: 16,
                                                    border: "1px solid #e2e8f0",
                                                    background: "#fff"
                                                }}
                                            />
                                            <Text type="secondary" style={{ display: "block", marginTop: 10 }}>
                                                QR này được đồng bộ từ dữ liệu booking thật hoặc fallback từ backend response.
                                            </Text>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                padding: 18,
                                                borderRadius: 16,
                                                background: "#f8fafc",
                                                border: "1px dashed #cbd5e1",
                                                textAlign: "center"
                                            }}
                                        >
                                            <Text strong>Chưa có QR inline từ response</Text>
                                            <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                                                Backend có thể nhúng ảnh base64 vào email, còn FE sẽ giữ màn hình trạng thái này.
                                            </Text>
                                        </div>
                                    )}
                                </Card>

                                <Card
                                    bordered={false}
                                    style={{
                                        borderRadius: 22,
                                        background: "#ffffff",
                                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)"
                                    }}
                                >
                                    <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                                        Dịch vụ đã đặt
                                    </Text>
                                    {serviceItems.length > 0 ? (
                                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                            {serviceItems.map((item, index) => (
                                                <div
                                                    key={item.id || `${item.serviceName || item.bundleName}-${index}`}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        gap: 12,
                                                        padding: "10px 12px",
                                                        borderRadius: 14,
                                                        background: "#f8fafc"
                                                    }}
                                                >
                                                    <Text strong>{item.serviceName || item.bundleName || "Dịch vụ"}</Text>
                                                    <Text type="secondary">
                                                        {formatCurrency(item.price)} đ
                                                    </Text>
                                                </div>
                                            ))}
                                        </Space>
                                    ) : (
                                        <Text type="secondary">Chưa có danh sách dịch vụ trong response.</Text>
                                    )}
                                </Card>
                            </Space>
                        </Col>
                    </Row>

                    <Divider style={{ margin: "28px 0 20px" }} />

                    <Space wrap>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => handleGo(config.primaryAction.to)}
                        >
                            {config.primaryAction.label}
                        </Button>
                        <Button
                            size="large"
                            onClick={() => handleGo(config.secondaryAction.to)}
                        >
                            {config.secondaryAction.label}
                        </Button>
                        <Button
                            size="large"
                            icon={<HomeOutlined />}
                            onClick={() => handleGo("/")}
                        >
                            Về trang chủ
                        </Button>
                    </Space>
                </div>
            </Card>
        </div>
    );
}
