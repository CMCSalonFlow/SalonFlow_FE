import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    Table,
    Tag,
    Button,
    Typography,
    Space,
    Spin,
    message,
    Empty,
    Modal,
    Input,
    List,
    Alert
} from "antd";
import {
    CalendarOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    ShopOutlined,
    UserOutlined,
    InfoCircleOutlined,
    FileTextOutlined,
    DollarCircleOutlined,
    StarOutlined
} from "@ant-design/icons";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import ReviewModal from "@/features/review/components/ReviewModal";
import {
    getBookingsByBranchApi,
    cancelBookingApi
} from "../api/bookingApi";
import { createPaymentUrlApi } from "@/features/payment/api/paymentApi";
import { getInvoiceUrl } from "@/features/media/api/mediaApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AppointmentsPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [myBookings, setMyBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewBookingTarget, setReviewBookingTarget] = useState(null);

    useEffect(() => {
        const handleBookingReviewedEvent = (e) => {
            const reviewedId = e.detail?.bookingId;
            if (reviewedId) {
                setMyBookings((prev) =>
                    prev.map((item) =>
                        item.id === reviewedId
                            ? { ...item, reviewedAt: new Date().toISOString() }
                            : item
                    )
                );
            }
        };
        window.addEventListener("booking_reviewed", handleBookingReviewedEvent);
        return () => window.removeEventListener("booking_reviewed", handleBookingReviewedEvent);
    }, []);

    const handleDownloadInvoice = async (booking) => {
        if (!booking?.invoiceUrl) {
            message.warning("Lịch hẹn này chưa có file hóa đơn PDF.");
            return;
        }
        try {
            setInvoiceLoading(true);
            const url = await getInvoiceUrl(booking.invoiceUrl);
            if (url) {
                window.open(url, "_blank");
            } else {
                message.error("Không thể lấy liên kết tải hóa đơn.");
            }
        } catch (err) {
            console.error("Lỗi tải hóa đơn:", err);
            message.error("Có lỗi xảy ra khi tải hóa đơn PDF.");
        } finally {
            setInvoiceLoading(false);
        }
    };

    const formatCurrency = (value) =>
        Number(value || 0).toLocaleString("vi-VN");

    const loadMyBookings = useCallback(async () => {
        const currentUserId = localStorage.getItem("userId");

        if (!currentUserId) {
            message.error("Vui lòng đăng nhập để xem lịch hẹn.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);

            const branchesData = await getMyBranchesApi();

            if (branchesData && branchesData.length > 0) {

                const bookingsPromises = branchesData.map(branch =>
                    getBookingsByBranchApi(branch.id).catch(() => [])
                );

                const allResults = await Promise.all(bookingsPromises);

                const mergedBookings = allResults
                    .flat()
                    .filter(
                        booking =>
                            String(booking.customerId) === String(currentUserId)
                    );

                const now = new Date();

                const isUpcoming = (booking) => {
                    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
                        return false;
                    }
                    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
                    return bookingDateTime >= now;
                };

                mergedBookings.sort((a, b) => {
                    const aUpcoming = isUpcoming(a);
                    const bUpcoming = isUpcoming(b);

                    if (aUpcoming && !bUpcoming) return -1;
                    if (!aUpcoming && bUpcoming) return 1;

                    const dateA = new Date(`${a.bookingDate}T${a.startTime}`);
                    const dateB = new Date(`${b.bookingDate}T${b.startTime}`);

                    if (aUpcoming && bUpcoming) {
                        // Sắp diễn ra: tăng dần (gần hiện tại nhất ở đầu)
                        return dateA - dateB;
                    } else {
                        // Quá khứ: giảm dần (mới diễn ra gần đây ở đầu)
                        return dateB - dateA;
                    }
                });

                setMyBookings(mergedBookings);
            }

        } catch {
            message.error("Lỗi khi tải lịch sử đặt chỗ.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            void loadMyBookings();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [loadMyBookings]);

    const getStatusTag = (status) => {
        switch (status) {
            case "PENDING":
                return <Tag color="warning">Đang chờ</Tag>;
            case "CONFIRMED":
                return <Tag color="processing">Đã xác nhận</Tag>;
            case "COMPLETED":
                return <Tag color="success">Đã hoàn thành</Tag>;
            case "CANCELLED":
                return <Tag color="error">Đã hủy</Tag>;
            case "NO_SHOW":
                return <Tag color="default">Vắng mặt</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "PENDING":
                return "Đang chờ xử lý / Chờ cọc";
            case "CONFIRMED":
                return "Đã xác nhận";
            case "COMPLETED":
                return "Đã hoàn thành";
            case "CANCELLED":
                return "Đã hủy";
            case "NO_SHOW":
                return "Vắng mặt";
            default:
                return status;
        }
    };

    const getStatusDescription = (booking) => {
        switch (booking?.status) {
            case "PENDING":
                return "Lịch hẹn đã được khóa giữ chỗ thành công trên hệ thống. Trạng thái 'Đang chờ' này có nghĩa là hệ thống đang chờ bạn hoàn tất thanh toán tiền cọc VNPay (nếu đặt trực tuyến) hoặc đang chờ cửa hàng xác nhận và duyệt lịch hẹn của bạn (nếu chọn thanh toán tại quầy).";
            case "CONFIRMED":
                return "Lịch hẹn của bạn đã được xác nhận thành công và sẵn sàng để phục vụ. Vui lòng đến đúng giờ hẹn đã chọn.";
            case "COMPLETED":
                return "Lịch hẹn đã được thực hiện thành công. Cảm ơn bạn đã lựa chọn dịch vụ của chúng tôi!";
            case "CANCELLED":
                return `Lịch hẹn này đã bị hủy. ${booking.notes ? `Lý do hủy: "${booking.notes}"` : "Không có lý do cụ thể."}`;
            case "NO_SHOW":
                return "Bạn đã không đến đúng giờ hẹn theo lịch đặt trước.";
            default:
                return "";
        }
    };

    const getAlertType = (status) => {
        switch (status) {
            case "PENDING":
                return "warning";
            case "CONFIRMED":
                return "info";
            case "COMPLETED":
                return "success";
            case "CANCELLED":
                return "error";
            case "NO_SHOW":
                return "info";
            default:
                return "info";
        }
    };
    

    const handlePayNow = async (booking) => {
        try {
            message.loading({ content: "Đang chuyển hướng sang cổng thanh toán VNPay...", key: "payment_redirect" });
            
            const idempotencyKey = "vnpay_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
            const returnUrl = window.location.origin + "/payment/callback";
            const amount = Number(booking.depositAmount || booking.payableAmount || 0);

            if (!amount || amount <= 0) {
                message.warning("Không tìm thấy tiền cọc để thanh toán.");
                return;
            }
            
            const paymentPayload = {
                bookingId: booking.id,
                paymentMethod: "VNPAY",
                amount,
                idempotencyKey: idempotencyKey,
                returnUrl: returnUrl
            };
            
            const paymentRes = await createPaymentUrlApi(paymentPayload);
            if (paymentRes.paymentUrl) {
                window.location.href = paymentRes.paymentUrl;
            } else {
                throw new Error("Không thể tạo liên kết thanh toán VNPay.");
            }
        } catch (error) {
            message.error({ content: error.message || "Lỗi khi tạo liên kết thanh toán.", key: "payment_redirect" });
        }
    };

    const handleCancelBooking = (bookingId) => {

    let reason = "";

    Modal.confirm({
        title: "Hủy lịch hẹn",

        content: (
            <TextArea
                rows={4}
                placeholder="Nhập lý do hủy (không bắt buộc)"
                onChange={(e) => {
                    reason = e.target.value;
                }}
            />
        ),

        okText: "Hủy lịch",
        cancelText: "Đóng",

        okButtonProps: {
            danger: true
        },

        onOk: async () => {
            try {

                const result = await cancelBookingApi(
                    bookingId,
                    reason
                );

                Modal.success({
                    title: "Hủy lịch thành công",
                    content: (
                        <div>
                            <p>
                                <strong>Kết quả:</strong> {result.message}
                            </p>

                            <p>
                                <strong>Phí hủy:</strong>{" "}
                                {Number(result.feeAmount).toLocaleString()} đ
                            </p>

                            <p>
                                <strong>Miễn phí:</strong>{" "}
                                {result.isFreeCancel ? "Có" : "Không"}
                            </p>
                        </div>
                    )
                });

                await loadMyBookings();

            } catch (error) {

                message.error(
                    error.response?.data?.message ||
                    "Không thể hủy lịch"
                );

            }
        }
    });
    };

    const handleOpenStatusScreen = (variant, booking) => {
        const bookingId = booking?.id;
        const branchId = booking?.branchId || booking?.branch?.id;
        const search = new URLSearchParams();
        if (bookingId) search.set("bookingId", bookingId);
        if (branchId) search.set("branchId", branchId);

        navigate(`/booking/status/${variant}?${search.toString()}`, {
            state: {
                booking: {
                    ...booking,
                    status: variant === "cancelled" ? "CANCELLED" : (booking?.status || "CONFIRMED")
                }
            }
        });
    };

    const columns = [
        {
            title: "Mã đặt",
            dataIndex: "id",
            render: (id) => <Text strong>#{id}</Text>
        },
        {
            title: "Chi nhánh",
            dataIndex: "branchName",
            render: (text) => (
                <Space>
                    <ShopOutlined />
                    {text}
                </Space>
            )
        },
        {
            title: "Dịch vụ",
            render: (_, record) => (
                <Space wrap>
                    {record.items?.map(item => (
                        <Tag color="blue" key={item.id}>
                            {item.serviceName || item.bundleName}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Nhân viên",
            dataIndex: "assignedStaffName",
            render: (name) => (
                <Space>
                    <UserOutlined />
                    {name || "Tự động phân bổ"}
                </Space>
            )
        },
        {
            title: "Thời gian",
            render: (_, record) => (
                <>
                    <div>{record.bookingDate}</div>
                    <Text type="secondary">
                        {record.startTime.substring(0, 5)}
                        {" - "}
                        {record.endTime.substring(0, 5)}
                    </Text>
                </>
            )
        },
        {
            title: "Tổng giá trị",
            dataIndex: "totalPrice",
            render: (value) => (
                <Text strong style={{ color: "#faad14" }}>
                    {formatCurrency(value)} đ
                </Text>
            )
        },
        {
            title: "Tiền cọc",
            dataIndex: "depositAmount",
            render: (value) => (
                <Text strong style={{ color: "#f5222d" }}>
                    {formatCurrency(value)} đ
                </Text>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: getStatusTag
        },
        {
            title: "Thao tác",
            render: (_, record) => (
                <Space>
                    {(record.status === "PENDING" || record.status === "CONFIRMED") && (
                        <Button
                            danger
                            onClick={() => handleCancelBooking(record.id)}
                        >
                            Hủy lịch
                        </Button>
                    )}
                    {record.status === "COMPLETED" && (
                        record.reviewedAt ? (
                            <Tag color="gold" icon={<StarOutlined />}>Đã đánh giá</Tag>
                        ) : (
                            <Button
                                type="primary"
                                icon={<StarOutlined />}
                                style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
                                onClick={() => {
                                    setReviewBookingTarget(record);
                                    setIsReviewModalOpen(true);
                                }}
                            >
                                Đánh giá
                            </Button>
                        )
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px" }}>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20
                }}
            >
                <div>
                    <Title level={2}>
                        <CalendarOutlined /> Lịch hẹn của tôi
                    </Title>

                    <Text type="secondary">
                        Quản lý các lịch hẹn của bạn
                    </Text>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/booking")}
                >
                    Đặt lịch mới
                </Button>
            </div>

            <Card>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 80 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={myBookings}
                        pagination={{
                            pageSize: 8
                        }}
                        onRow={(record) => {
                            return {
                                onClick: (event) => {
                                    // Bỏ qua sự kiện click dòng nếu bấm vào các button (ví dụ: Hủy lịch)
                                    if (
                                        event.target.tagName === "BUTTON" ||
                                        event.target.closest("button") ||
                                        event.target.closest(".ant-btn")
                                    ) {
                                        return;
                                    }
                                    setSelectedBooking(record);
                                    setIsDetailModalOpen(true);
                                },
                                style: { cursor: "pointer" }
                            };
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    description="Bạn chưa có lịch hẹn nào."
                                >
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            navigate("/booking")
                                        }
                                    >
                                        Đặt lịch ngay
                                    </Button>
                                </Empty>
                            )
                        }}
                    />
                )}

            </Card>

            {/* Modal Chi tiết lịch hẹn */}
            <Modal
                title={
                    <Space style={{ fontSize: "18px" }}>
                        <InfoCircleOutlined style={{ color: "#1890ff" }} />
                        <span>Chi tiết lịch hẹn #{selectedBooking?.id}</span>
                    </Space>
                }
                open={isDetailModalOpen}
                onCancel={() => {
                    setIsDetailModalOpen(false);
                    setSelectedBooking(null);
                }}
                footer={[
                    selectedBooking && ["PENDING", "CONFIRMED"].includes(selectedBooking.status) && (
                        <Button
                            key="reminder"
                            onClick={() => handleOpenStatusScreen("reminder", selectedBooking)}
                        >
                            Xem màn hình nhắc 24h
                        </Button>
                    ),
                    selectedBooking?.status === "CANCELLED" && (
                        <Button
                            key="cancelled"
                            onClick={() => handleOpenStatusScreen("cancelled", selectedBooking)}
                        >
                            Xem màn hình hủy
                        </Button>
                    ),
                    selectedBooking?.status === "PENDING" && (
                        <Button
                            key="pay"
                            type="primary"
                            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                            onClick={() => handlePayNow(selectedBooking)}
                        >
                            Thanh toán tiền cọc qua VNPay
                        </Button>
                    ),
                    (Boolean(selectedBooking?.invoiceUrl) || ["CONFIRMED", "COMPLETED"].includes(selectedBooking?.status)) && (
                        <Button
                            key="invoice"
                            type="primary"
                            loading={invoiceLoading}
                            icon={<FileTextOutlined />}
                            onClick={() => handleDownloadInvoice(selectedBooking)}
                        >
                            Tải hóa đơn PDF
                        </Button>
                    ),
                    <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={650}
                centered
            >
                {selectedBooking && (
                    <div style={{ padding: "10px 0" }}>
                        {/* Status detail alert box */}
                        <Alert
                            message={
                                <span style={{ fontWeight: "bold" }}>
                                    Trạng thái: {getStatusText(selectedBooking.status)}
                                </span>
                            }
                            description={getStatusDescription(selectedBooking)}
                            type={getAlertType(selectedBooking.status)}
                            showIcon
                            style={{ marginBottom: 20, borderRadius: "8px" }}
                        />

                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: 20, padding: "8px 12px", backgroundColor: "#f5f5f5", borderRadius: "6px" }}>
                            <ShopOutlined style={{ fontSize: 18, color: "#1890ff" }} />
                            <span style={{ fontSize: 14, fontWeight: "500" }}>Chi nhánh:</span>
                            <span style={{ fontSize: 14, fontWeight: "bold" }}>{selectedBooking.branchName}</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: 20 }}>
                            <Card size="small" title="Thông tin lịch hẹn" style={{ borderRadius: "8px" }}>
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <div>
                                        <ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                                        <Text type="secondary">Thời gian: </Text>
                                        <Text strong>
                                            {selectedBooking.startTime.substring(0, 5)} - {selectedBooking.endTime.substring(0, 5)}, {selectedBooking.bookingDate}
                                        </Text>
                                    </div>
                                    <div>
                                        <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                                        <Text type="secondary">Nhân viên: </Text>
                                        <Text strong>{selectedBooking.assignedStaffName || "Hệ thống tự động phân bổ"}</Text>
                                    </div>
                                </Space>
                            </Card>

                            <Card size="small" title="Thông tin khách hàng" style={{ borderRadius: "8px" }}>
                                <Space direction="vertical" style={{ width: "100%" }}>
                                    <div>
                                        <Text type="secondary">Tên khách hàng: </Text>
                                        <Text strong>{selectedBooking.customerName || "N/A"}</Text>
                                    </div>
                                    <div>
                                        <Text type="secondary">Số điện thoại: </Text>
                                        <Text strong>{selectedBooking.customerPhone || "N/A"}</Text>
                                    </div>
                                </Space>
                            </Card>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontWeight: "bold" }}>
                                <FileTextOutlined style={{ color: "#1890ff" }} />
                                <span>Dịch vụ đã đặt</span>
                            </div>
                            <List
                                bordered
                                size="small"
                                dataSource={selectedBooking.items || []}
                                renderItem={(item) => (
                                    <List.Item style={{ display: "flex", justifyContent: "space-between" }}>
                                        <Space direction="vertical" size={0}>
                                            <Text strong>{item.serviceName || item.bundleName}</Text>
                                            <Text type="secondary" style={{ fontSize: "12px" }}>
                                                Thời lượng: {item.durationMinutes} phút
                                            </Text>
                                        </Space>
                                        <Text strong>{Number(item.price).toLocaleString()} đ</Text>
                                    </List.Item>
                                )}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#fafafa", borderRadius: "8px", border: "1px solid #f0f0f0", marginBottom: 20 }}>
                            <Space>
                                <DollarCircleOutlined style={{ color: "#faad14", fontSize: 18 }} />
                                <span style={{ fontWeight: "500" }}>Tổng giá trị đơn:</span>
                            </Space>
                            <Text strong style={{ fontSize: "18px", color: "#faad14" }}>
                                {Number(selectedBooking.totalPrice).toLocaleString()} đ
                            </Text>
                        </div>

                        {selectedBooking.notes && selectedBooking.status !== "CANCELLED" && (
                            <div style={{ marginBottom: 20, backgroundColor: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #f0f0f0" }}>
                                <div style={{ fontWeight: "500", marginBottom: "4px" }}>Ghi chú từ khách hàng:</div>
                                <Text type="secondary" style={{ fontStyle: "italic" }}>{selectedBooking.notes}</Text>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Đánh giá dịch vụ */}
            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => {
                    setIsReviewModalOpen(false);
                    setReviewBookingTarget(null);
                }}
                booking={reviewBookingTarget}
                onSuccess={(reviewedId) => {
                    const targetId = reviewedId || reviewBookingTarget?.id;
                    if (targetId) {
                        setMyBookings((prev) =>
                            prev.map((item) =>
                                item.id === targetId
                                    ? { ...item, reviewedAt: new Date().toISOString() }
                                    : item
                            )
                        );
                    }
                }}
            />

        </div>
    );
}
