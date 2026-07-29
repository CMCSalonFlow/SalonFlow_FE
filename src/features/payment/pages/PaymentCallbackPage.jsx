import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Result, Button, Spin, Typography, Descriptions, message } from "antd";
import { RedoOutlined, HomeOutlined } from "@ant-design/icons";
import { verifyPaymentApi } from "../api/paymentApi";
import { getInvoiceUrl } from "@/features/media/api/mediaApi";

const { Title, Text } = Typography;
const BOOKING_CONTEXT_KEY = "salonflow_last_booking_context";
const BOOKING_STORAGE_KEY = "salonflow_last_booking_detail";

export default function PaymentCallbackPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const bookingContext = (() => {
        const stored = sessionStorage.getItem(BOOKING_CONTEXT_KEY);
        if (!stored) {
            return {
                bookingMode: "authenticated",
                returnPath: "/booking",
                homePath: "/home"
            };
        }

        try {
            const parsed = JSON.parse(stored);
            return {
                bookingMode: parsed.bookingMode || "authenticated",
                returnPath: parsed.returnPath || (parsed.bookingMode === "public" ? "/guest-booking" : "/booking"),
                homePath: parsed.bookingMode === "public" ? "/" : "/home"
            };
        } catch {
            return {
                bookingMode: "authenticated",
                returnPath: "/booking",
                homePath: "/home"
            };
        }
    })();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    const storedBooking = (() => {
        const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    })();

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const params = {};
                const searchParams = new URLSearchParams(location.search);
                for (const [key, value] of searchParams.entries()) {
                    params[key] = value;
                }

                if (Object.keys(params).length === 0) {
                    setErrorMsg("Không tìm thấy thông tin phản hồi từ cổng thanh toán VNPay.");
                    setLoading(false);
                    return;
                }

                const response = await verifyPaymentApi(
                    params,
                    bookingContext.bookingMode === "public" ? { skipAuth: true } : {}
                );

                console.log("Payment response:", response);

                setResult(response);
            } catch (err) {
                console.error("Xác minh thanh toán thất bại:", err);
                setErrorMsg(err.response?.data?.message || err.message || "Xác thực chữ ký giao dịch thất bại.");
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [location, bookingContext.bookingMode]);

    const handleDownloadInvoice = async () => {
        if (!result?.invoiceUrl) {
            message.info("Hệ thống đang chuyển tới trang Lịch hẹn để xem hóa đơn PDF.");
            navigate("/appointments");
            return;
        }
        try {
            setInvoiceLoading(true);
            const url = await getInvoiceUrl(result.invoiceUrl);
            if (url) {
                window.open(url, "_blank");
            } else {
                message.error("Không thể lấy liên kết tải hóa đơn.");
            }
        } catch (error) {
            console.error("Lỗi lấy invoice:", error);
            message.error("Có lỗi xảy ra khi tải hóa đơn PDF.");
        } finally {
            setInvoiceLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column" }}>
                <Spin size="large" />
                <Title level={4} style={{ marginTop: 24, color: "#1890ff" }}>Vui lòng giữ kết nối, hệ thống đang cập nhật trạng thái đặt lịch</Title>
            </div>
        );
    }

    const isSuccess = result && result.status === "SUCCESS";

    return (
        <div style={{ maxWidth: 700, margin: "60px auto", padding: "0 16px" }}>
            <Card
                style={{
                    borderRadius: 20,
                    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)",
                    border: "none",
                    background: "rgba(255, 255, 255, 0.95)"
                }}
            >
                {isSuccess ? (
                    <Result
                        status="success"
                        title={<Title level={2} style={{ color: "#52c41a", margin: 0 }}>Thanh toán thành công!</Title>}
                        subTitle="Hệ thống đã ghi nhận khoản tiền cọc trực tuyến của bạn."
                        extra={[
                            <Button
                                key="status"
                                type="primary"
                                size="large"
                                onClick={() => {
                                    const search = new URLSearchParams();
                                    if (result?.bookingId) search.set("bookingId", result.bookingId);
                                    if (storedBooking?.branchId) search.set("branchId", storedBooking.branchId);

                                    navigate(`/booking/status/confirmed?${search.toString()}`, {
                                        state: {
                                            booking: storedBooking || {
                                                id: result.bookingId,
                                                totalPrice: result.amount,
                                                depositAmount: result.amount,
                                                status: "CONFIRMED"
                                            }
                                        }
                                    });
                                }}
                                style={{ borderRadius: 8, height: 45, fontWeight: "600" }}
                            >
                                Xem chi tiết
                            </Button>,
                            (Boolean(result?.invoiceUrl) || result?.status === "SUCCESS") && (
                                <Button
                                    key="invoice"
                                    size="large"
                                    loading={invoiceLoading}
                                    onClick={handleDownloadInvoice}
                                    style={{ borderRadius: 8, height: 45, fontWeight: "600" }}
                                >
                                    Tải hóa đơn PDF
                                </Button>
                            )
                        ].filter(Boolean)}
                    >
                        <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", padding: "20px", borderRadius: 12, marginTop: 16 }}>
                            <Descriptions title="Chi tiết giao dịch" column={1} size="small" layout="horizontal">
                                <Descriptions.Item label={<Text strong>Mã đặt lịch</Text>}>
                                    <Text copyable strong>#{result.bookingId}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={<Text strong>Số tiền đã thanh toán (tiền cọc)</Text>}>
                                    <Text type="success" strong style={{ fontSize: 16 }}>
                                        {parseFloat(result.amount).toLocaleString()} đ
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label={<Text strong>Phương thức thanh toán</Text>}>
                                    VNPay Online
                                </Descriptions.Item>
                                <Descriptions.Item label={<Text strong>Trạng thái</Text>}>
                                    <Text type="success" strong>ĐÃ XÁC NHẬN (PAID)</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </Result>
                ) : (
                    <Result
                        status="error"
                        title={<Title level={2} style={{ color: "#f5222d", margin: 0 }}>Thanh toán không thành công</Title>}
                        subTitle={errorMsg || "Giao dịch thanh toán đã bị hủy hoặc gặp lỗi trong quá trình xử lý."}
                        extra={[
                            <Button
                                type="primary"
                                danger
                                size="large"
                                icon={<RedoOutlined />}
                                onClick={() => navigate(bookingContext.returnPath)}
                                style={{ borderRadius: 8, height: 45, fontWeight: "600" }}
                                key="retry"
                            >
                                Đặt lịch lại
                            </Button>,
                            <Button
                                size="large"
                                icon={<HomeOutlined />}
                                onClick={() => navigate(bookingContext.homePath)}
                                style={{ borderRadius: 8, height: 45, fontWeight: "600" }}
                                key="home"
                            >
                                Trang chủ
                            </Button>
                        ]}
                    >
                        <div style={{ background: "#fff2e8", border: "1px solid #ffbb96", padding: "16px", borderRadius: 12, marginTop: 16, textAlign: "center" }}>
                            <Text type="secondary">
                                Lịch hẹn của bạn chưa được xác nhận thanh toán. Bạn có thể thực hiện lại quy trình đặt lịch hoặc liên hệ Hotline salon để được hỗ trợ.
                            </Text>
                        </div>
                    </Result>
                )}
            </Card>
        </div>
    );
}

