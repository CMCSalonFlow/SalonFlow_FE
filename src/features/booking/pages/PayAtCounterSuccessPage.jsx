import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Divider, Result, Tag, Typography, Grid } from "antd";
import { CheckCircleOutlined, HomeOutlined, CalendarOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

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
            <div style={{ maxWidth: 640, margin: screens.xs ? "24px auto" : "60px auto", padding: screens.xs ? "0 12px" : "0 16px" }}>
                <Card style={{ borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                    <Result
                        status="warning"
                        title={<Title level={3}>Không tìm thấy thông tin đặt lịch</Title>}
                        subTitle="Trang này dùng để xác nhận đặt lịch sau khi chọn thanh toán tại quầy."
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
            maxWidth: 640,
            margin: screens.xs ? "16px auto 36px" : "40px auto",
            padding: screens.xs ? "0 12px" : "0 16px"
        }}>
            <Card
                style={{
                    borderRadius: screens.xs ? 20 : 24,
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.07)",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                    background: "#ffffff"
                }}
                styles={{
                    body: {
                        padding: screens.xs ? "24px 18px" : "36px 40px 32px"
                    }
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#f0fdf4",
                        border: "1.5px solid #bbf7d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px",
                        boxShadow: "0 6px 20px rgba(34, 197, 94, 0.15)"
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 36, color: "#16a34a" }} />
                    </div>
                    <Title level={2} style={{ margin: "0 0 6px 0", fontWeight: 800, color: "#0f172a", fontSize: screens.xs ? 22 : 26 }}>
                        Đặt lịch thành công!
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15, color: "#64748b" }}>
                        Mã đặt lịch: <Text strong style={{ color: "#1677ff", fontSize: 18, fontWeight: 800 }}>#{booking.id}</Text>
                    </Text>
                </div>

                {/* Clean List Box */}
                <div style={{
                    background: "#f8fafc",
                    borderRadius: 16,
                    padding: screens.xs ? "18px 16px" : "22px 24px",
                    border: "1px solid #e2e8f0"
                }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 15 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ color: "#64748b", fontSize: 15 }}>Chi nhánh</Text>
                            <Text strong style={{ color: "#0f172a", fontSize: 15 }}>{booking.branchName || "-"}</Text>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ color: "#64748b", fontSize: 15 }}>Thời gian hẹn</Text>
                            <Text strong style={{ color: "#0f172a", fontSize: 15 }}>
                                {booking.startTime?.substring(0, 5) || "--:--"} - {booking.endTime?.substring(0, 5) || "--:--"} | {booking.bookingDate || "-"}
                            </Text>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ color: "#64748b", fontSize: 15 }}>Nhân viên phục vụ</Text>
                            <Text strong style={{ color: "#0f172a", fontSize: 15 }}>{booking.assignedStaffName || "Bất kỳ nhân viên"}</Text>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ color: "#64748b", fontSize: 15 }}>Dịch vụ đã chọn</Text>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end", maxWidth: "65%" }}>
                                {bookingItems.length > 0 ? (
                                    bookingItems.map((item) => (
                                        <Tag
                                            color="blue"
                                            key={item.id || `${item.serviceName || item.bundleName}`}
                                            style={{ padding: "3px 12px", borderRadius: 12, fontSize: 14, margin: 0, fontWeight: 600 }}
                                        >
                                            {item.serviceName || item.bundleName || "Dịch vụ"}
                                        </Tag>
                                    ))
                                ) : (
                                    <Text strong style={{ fontSize: 15 }}>Dịch vụ làm đẹp</Text>
                                )}
                            </div>
                        </div>

                        {booking.notes && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ color: "#64748b", fontSize: 15 }}>Ghi chú</Text>
                                <Text style={{ fontSize: 15, color: "#334155" }}>{booking.notes}</Text>
                            </div>
                        )}
                    </div>

                    <Divider style={{ margin: "18px 0 16px", borderColor: "#cbd5e1" }} dashed />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong style={{ fontSize: 16, color: "#334155" }}>Tổng tiền thanh toán</Text>
                        <Text strong style={{ fontSize: 24, color: "#d46b08", fontWeight: 800 }}>
                            {formatCurrency(payableAmount)} đ
                        </Text>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div style={{
                    display: "flex",
                    flexDirection: screens.xs ? "column" : "row",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 26
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
                                height: 48,
                                minWidth: 170,
                                fontSize: 15,
                                background: "linear-gradient(90deg, #1677ff 0%, #0958d9 100%)",
                                boxShadow: "0 4px 14px rgba(22, 119, 255, 0.25)"
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
                                height: 48,
                                minWidth: 170,
                                fontSize: 15,
                                background: "linear-gradient(90deg, #1677ff 0%, #0958d9 100%)",
                                boxShadow: "0 4px 14px rgba(22, 119, 255, 0.25)"
                            }}
                        >
                            <CalendarOutlined /> Xem lịch hẹn
                        </Button>
                    )}
                    <Button
                        key="home"
                        size="large"
                        block={screens.xs}
                        onClick={() => navigate(bookingContext.bookingMode === "public" ? "/" : "/home")}
                        style={{
                            borderRadius: 12,
                            fontWeight: 600,
                            height: 48,
                            fontSize: 15,
                            minWidth: 170
                        }}
                    >
                        Về trang chủ
                    </Button>
                </div>
            </Card>
        </div>
    );
}



