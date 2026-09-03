import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Col, Divider, Result, Row, Tag, Typography, Grid } from "antd";
import {
    CalendarOutlined,
    ClockCircleOutlined,
    ShoppingOutlined,
    UserOutlined,
    HomeOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const STORAGE_KEY = "salonflow_last_pay_at_counter_booking";
const BOOKING_CONTEXT_KEY = "salonflow_last_booking_context";

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

export default function PayAtCounterSuccessPage() {
    const screens = Grid.useBreakpoint();
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
    const payableAmount = totalPrice;

    if (!booking) {
        return (
            <div style={{ maxWidth: 760, margin: screens.xs ? "24px auto" : "60px auto", padding: screens.xs ? "0 12px" : "0 16px" }}>
                <Card style={{ borderRadius: screens.xs ? 16 : 20, boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)", border: "none" }}>
                    <Result
                        status="warning"
                        title={<Title level={screens.xs ? 3 : 2}>Không tìm thấy thông tin đặt lịch</Title>}
                        subTitle="Trang này dùng để xác nhận đặt lịch sau khi chọn phương thức thanh toán tại quầy."
                        extra={[
                            <Button key="booking" type="primary" size="large" block={screens.xs} onClick={() => navigate(bookingContext.returnPath)}>
                                Quay lại đặt lịch
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 780,
            margin: screens.xs ? "16px auto 36px" : "40px auto",
            padding: screens.xs ? "0 12px" : "0 16px"
        }}>
            <Card
                style={{
                    borderRadius: screens.xs ? 20 : 24,
                    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.08)",
                    border: "none",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)"
                }}
                styles={{
                    body: {
                        padding: screens.xs ? "20px 14px 20px" : "36px 32px 32px"
                    }
                }}
            >
                <Result
                    status="success"
                    style={{ padding: screens.xs ? "12px 0 16px" : "20px 0 24px" }}
                    title={
                        <Title
                            level={2}
                            style={{
                                marginBottom: 4,
                                fontSize: screens.xs ? 22 : 28,
                                fontWeight: 800
                            }}
                        >
                            Đặt lịch thành công!
                        </Title>
                    }
                    subTitle={
                        <Text type="secondary" style={{ fontSize: screens.xs ? 13 : 15 }}>
                            Lịch hẹn của bạn đã được ghi nhận và xác nhận thành công.
                        </Text>
                    }
                    extra={
                        <div style={{
                            display: "flex",
                            flexDirection: screens.xs ? "column" : "row",
                            justifyContent: "center",
                            gap: screens.xs ? 10 : 12,
                            width: screens.xs ? "100%" : "auto",
                            marginTop: 4
                        }}>
                            {bookingContext.bookingMode === "public" ? (
                                <Button
                                    key="booking"
                                    type="primary"
                                    size="large"
                                    block={screens.xs}
                                    onClick={() => navigate(bookingContext.returnPath)}
                                    style={{
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        height: screens.xs ? 44 : 48
                                    }}
                                >
                                    Đặt lịch mới
                                </Button>
                            ) : (
                                <Button
                                    key="appointments"
                                    type="primary"
                                    size="large"
                                    block={screens.xs}
                                    onClick={() => navigate("/appointments")}
                                    style={{
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        height: screens.xs ? 44 : 48
                                    }}
                                >
                                    Xem lịch hẹn
                                </Button>
                            )}
                            <Button
                                key="home"
                                size="large"
                                block={screens.xs}
                                icon={<HomeOutlined />}
                                onClick={() => navigate(bookingContext.bookingMode === "public" ? "/" : "/home")}
                                style={{
                                    borderRadius: 12,
                                    fontWeight: 600,
                                    height: screens.xs ? 44 : 48
                                }}
                            >
                                Về trang chủ
                            </Button>
                        </div>
                    }
                />

                <div style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: screens.xs ? "16px 14px" : "24px",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
                    marginTop: screens.xs ? 12 : 20
                }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Mã đặt lịch</Text>
                                <div style={{ marginTop: 2 }}>
                                    <Text strong style={{ fontSize: screens.xs ? 20 : 24, color: "#1677ff" }}>
                                        #{booking.id}
                                    </Text>
                                </div>
                            </div>
                            <Tag color="success" style={{ borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, margin: 0 }}>
                                <CheckCircleOutlined style={{ marginRight: 4 }} />
                                Đã xác nhận
                            </Tag>
                        </div>

                        <Divider style={{ margin: 0 }} />

                        <Row gutter={screens.xs ? [12, 14] : [16, 16]}>
                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: "#e6f4ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <ShoppingOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Chi nhánh</Text>
                                        <div><Text strong style={{ fontSize: 14 }}>{booking.branchName || "-"}</Text></div>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: "#e6f4ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <CalendarOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Ngày hẹn</Text>
                                        <div><Text strong style={{ fontSize: 14 }}>{booking.bookingDate || "-"}</Text></div>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: "#e6f4ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <ClockCircleOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Giờ hẹn</Text>
                                        <div>
                                            <Text strong style={{ fontSize: 14 }}>
                                                {booking.startTime?.substring(0, 5) || "--:--"} - {booking.endTime?.substring(0, 5) || "--:--"}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                    <div style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 10,
                                        background: "#e6f4ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0
                                    }}>
                                        <UserOutlined style={{ fontSize: 18, color: "#1677ff" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Nhân viên phục vụ</Text>
                                        <div><Text strong style={{ fontSize: 14 }}>{booking.assignedStaffName || "Bất kỳ nhân viên"}</Text></div>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Divider style={{ margin: 0 }} />

                        <div>
                            <Text type="secondary" style={{ fontSize: 13 }}>Dịch vụ / gói đã chọn</Text>
                            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {bookingItems.length > 0 ? (
                                    bookingItems.map((item) => (
                                        <Tag
                                            color="blue"
                                            key={item.id || `${item.serviceName || item.bundleName}-${item.serviceId || "item"}`}
                                            style={{
                                                padding: "4px 12px",
                                                borderRadius: 20,
                                                fontSize: 13,
                                                margin: 0,
                                                fontWeight: 600,
                                                border: "1px solid #91caff"
                                            }}
                                        >
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
                                    <Text type="secondary" style={{ fontSize: 13 }}>Ghi chú</Text>
                                    <Paragraph style={{ marginBottom: 0, marginTop: 4, fontSize: 13 }}>{booking.notes}</Paragraph>
                                </div>
                            </>
                        )}

                        <Divider style={{ margin: 0 }} />

                        <Row gutter={screens.xs ? [10, 10] : [16, 12]}>
                            <Col xs={24} sm={12}>
                                <div style={{
                                    padding: screens.xs ? "14px 14px" : "16px",
                                    borderRadius: 14,
                                    background: "#f6ffed",
                                    border: "1px solid #b7eb8f"
                                }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Tổng giá trị đơn</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text strong style={{ fontSize: screens.xs ? 20 : 22, color: "#389e0d", whiteSpace: "nowrap" }}>
                                            {formatCurrency(totalPrice)} đ
                                        </Text>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={24} sm={12}>
                                <div style={{
                                    padding: screens.xs ? "14px 14px" : "16px",
                                    borderRadius: 14,
                                    background: "#fff7e6",
                                    border: "1px solid #ffd591"
                                }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Thanh toán tại quầy</Text>
                                    <div style={{ marginTop: 4 }}>
                                        <Text strong style={{ fontSize: screens.xs ? 20 : 22, color: "#d46b08", whiteSpace: "nowrap" }}>
                                            {formatCurrency(payableAmount)} đ
                                        </Text>
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5, display: "block" }}>
                                            Lịch hẹn của bạn hoàn toàn miễn phí đặt trước. Bạn sẽ thanh toán trực tiếp số tiền này tại salon khi đến sử dụng dịch vụ.
                                        </Text>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </Card>
        </div>
    );
}
