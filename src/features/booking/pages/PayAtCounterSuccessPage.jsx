import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Col, Divider, Result, Row, Space, Tag, Typography, message } from "antd";
import { CalendarOutlined, ClockCircleOutlined, ShoppingOutlined, UserOutlined } from "@ant-design/icons";
import { createPaymentUrlApi } from "@/features/payment/api/paymentApi";

const { Title, Text, Paragraph } = Typography;

const STORAGE_KEY = "salonflow_last_pay_at_counter_booking";
const BOOKING_CONTEXT_KEY = "salonflow_last_booking_context";

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

export default function PayAtCounterSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const bookingContext = (() => {
        if (location.state?.bookingMode) {
            return {
                bookingMode: location.state.bookingMode,
                returnPath: location.state.bookingMode === "public" ? "/guest-booking" : "/booking"
            };
        }

        const storedContext = sessionStorage.getItem(BOOKING_CONTEXT_KEY);
        if (!storedContext) {
            return {
                bookingMode: "authenticated",
                returnPath: "/booking"
            };
        }

        try {
            const parsed = JSON.parse(storedContext);
            return {
                bookingMode: parsed.bookingMode || "authenticated",
                returnPath: parsed.returnPath || (parsed.bookingMode === "public" ? "/guest-booking" : "/booking")
            };
        } catch {
            return {
                bookingMode: "authenticated",
                returnPath: "/booking"
            };
        }
    })();

    const booking = location.state?.booking || (() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
    })();

    const bookingItems = booking?.items || [];
    const totalPrice = Number(booking?.totalPrice || 0);
    const depositAmount = Number(booking?.depositAmount || booking?.payableAmount || booking?.bookingDepositAmount || 0);
    const payableAmount = totalPrice;
    const bookingId = booking?.id;
    const branchId = booking?.branchId || booking?.branch?.id;

    const handlePayDeposit = async () => {
        try {
            if (!booking?.id) {
                message.error("Không tìm thấy mã đặt lịch để tạo thanh toán.");
                return;
            }

            const amount = payableAmount;
            if (!amount || amount <= 0) {
                message.warning("Không có số tiền cọc cần thanh toán.");
                return;
            }

            message.loading({ content: "Đang tạo liên kết thanh toán cọc...", key: "deposit_payment" });

            const idempotencyKey = "deposit_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
            const returnUrl = window.location.origin + "/payment/callback";

            const paymentRes = await createPaymentUrlApi(
                {
                    bookingId: booking.id,
                    paymentMethod: "VNPAY",
                    amount,
                    idempotencyKey,
                    returnUrl
                },
                bookingContext.bookingMode === "public" ? { skipAuth: true } : {}
            );

            if (paymentRes.paymentUrl) {
                window.location.href = paymentRes.paymentUrl;
                return;
            }

            throw new Error("Không thể tạo liên kết thanh toán cọc.");
        } catch (error) {
            message.error({
                content: error.response?.data?.message || error.message || "Không thể tạo thanh toán cọc.",
                key: "deposit_payment"
            });
        }
    };

    if (!booking) {
        return (
            <div style={{ maxWidth: 760, margin: "60px auto", padding: "0 16px" }}>
                <Card style={{ borderRadius: 20, boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)", border: "none" }}>
                        <Result
                        status="warning"
                        title={<Title level={2}>Không tìm thấy thông tin đặt lịch</Title>}
                        subTitle="Trang này dùng để nhắc bạn thanh toán cọc online sau khi chọn phương thức thanh toán tại quầy."
                        extra={[
                            <Button key="booking" type="primary" size="large" onClick={() => navigate(bookingContext.returnPath)}>
                                Quay lại đặt lịch
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
            <Card
                style={{
                    borderRadius: 24,
                    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.08)",
                    border: "none",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)"
                }}
                bodyStyle={{ padding: 0 }}
            >
                <Result
                    status="success"
                        title={<Title level={2} style={{ marginBottom: 0 }}>Đặt lịch thành công!</Title>}
                        subTitle="Lịch hẹn của bạn đã được ghi nhận và xác nhận thành công."
                        extra={[
                            <Button
                                key="status"
                                size="large"
                                onClick={() => {
                                    const search = new URLSearchParams();
                                    if (bookingId) search.set("bookingId", bookingId);
                                    if (branchId) search.set("branchId", branchId);
                                    navigate(`/booking/status/confirmed?${search.toString()}`, { state: { booking } });
                                }}
                            >
                                Xem màn hình xác nhận
                            </Button>,
                            bookingContext.bookingMode === "public" ? (
                                <Button key="booking" type="primary" size="large" onClick={() => navigate(bookingContext.returnPath)}>
                                    Đặt lịch mới
                                </Button>
                            ) : (
                                <Button key="appointments" type="primary" size="large" onClick={() => navigate("/appointments")}>
                                    Xem lịch hẹn
                                </Button>
                            ),
                            <Button key="home" size="large" onClick={() => navigate(bookingContext.bookingMode === "public" ? "/" : "/home")}>
                                Về trang chủ
                            </Button>
                        ]}
                >
                    <div style={{ background: "#ffffff", margin: "0 24px 24px", borderRadius: 16, padding: 24, border: "1px solid #f0f0f0" }}>
                        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                            <div>
                                <Text type="secondary">Mã đặt lịch</Text>
                                <div style={{ marginTop: 4 }}>
                                    <Text strong style={{ fontSize: 20 }}>#{booking.id}</Text>
                                </div>
                            </div>

                            <Divider style={{ margin: 0 }} />

                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={12}>
                                    <Space align="start">
                                        <ShoppingOutlined style={{ fontSize: 18, color: "#1677ff", marginTop: 4 }} />
                                        <div>
                                            <Text type="secondary">Chi nhánh</Text>
                                            <div><Text strong>{booking.branchName || "-"}</Text></div>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Space align="start">
                                        <CalendarOutlined style={{ fontSize: 18, color: "#1677ff", marginTop: 4 }} />
                                        <div>
                                            <Text type="secondary">Ngày hẹn</Text>
                                            <div><Text strong>{booking.bookingDate || "-"}</Text></div>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Space align="start">
                                        <ClockCircleOutlined style={{ fontSize: 18, color: "#1677ff", marginTop: 4 }} />
                                        <div>
                                            <Text type="secondary">Giờ hẹn</Text>
                                            <div>
                                                <Text strong>
                                                    {booking.startTime?.substring(0, 5) || "--:--"} - {booking.endTime?.substring(0, 5) || "--:--"}
                                                </Text>
                                            </div>
                                        </div>
                                    </Space>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Space align="start">
                                        <UserOutlined style={{ fontSize: 18, color: "#1677ff", marginTop: 4 }} />
                                        <div>
                                            <Text type="secondary">Nhân viên phục vụ</Text>
                                            <div><Text strong>{booking.assignedStaffName || "Bất kỳ nhân viên"}</Text></div>
                                        </div>
                                    </Space>
                                </Col>
                            </Row>

                            <Divider style={{ margin: 0 }} />

                            <div>
                                <Text type="secondary">Dịch vụ / gói đã chọn</Text>
                                <div style={{ marginTop: 10 }}>
                                    {bookingItems.length > 0 ? (
                                        bookingItems.map((item) => (
                                            <Tag color="blue" key={item.id || `${item.serviceName || item.bundleName}-${item.serviceId || "item"}`} style={{ marginBottom: 8, padding: "4px 10px", borderRadius: 999 }}>
                                                {item.serviceName || item.bundleName || "Dịch vụ"}
                                            </Tag>
                                        ))
                                    ) : (
                                        <Text strong>Không có dữ liệu chi tiết</Text>
                                    )}
                                </div>
                            </div>

                            {booking.notes && (
                                <>
                                    <Divider style={{ margin: 0 }} />
                                    <div>
                                        <Text type="secondary">Ghi chú</Text>
                                        <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>{booking.notes}</Paragraph>
                                    </div>
                                </>
                            )}

                            <Divider style={{ margin: 0 }} />

                            <Row gutter={[16, 12]}>
                                <Col xs={24} md={12}>
                                    <div style={{ padding: 16, borderRadius: 14, background: "#f6ffed", border: "1px solid #b7eb8f" }}>
                                        <Text type="secondary">Tổng giá trị đơn</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text strong style={{ fontSize: 22, color: "#389e0d" }}>{formatCurrency(totalPrice)} đ</Text>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={24} md={12}>
                                    <div style={{ padding: 16, borderRadius: 14, background: "#fff7e6", border: "1px solid #ffd591" }}>
                                        <Text type="secondary">Thanh toán tại quầy</Text>
                                        <div style={{ marginTop: 4 }}>
                                            <Text strong style={{ fontSize: 22, color: "#d46b08" }}>{formatCurrency(payableAmount)} đ</Text>
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Lịch hẹn của bạn hoàn toàn miễn phí đặt trước. Bạn sẽ thanh toán trực tiếp số tiền này tại salon khi đến sử dụng dịch vụ.
                                            </Text>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Space>
                    </div>
                </Result>
            </Card>
        </div>
    );
}
