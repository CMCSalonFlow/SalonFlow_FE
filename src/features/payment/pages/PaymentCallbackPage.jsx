import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Button, Result, Spin, Typography, Space, Divider, Row, Col, Tag } from "antd";
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled, LoadingOutlined, HomeOutlined, CalendarOutlined } from "@ant-design/icons";
import { getPaymentStatusApi } from "../api/paymentApi";

const { Title, Text } = Typography;

export default function PaymentCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const bookingId = searchParams.get("bookingId");

    useEffect(() => {
        if (!bookingId) {
            setErrorMsg("Không tìm thấy thông tin lịch hẹn (bookingId) trong liên kết callback.");
            setLoading(false);
            return;
        }

        // Đợi 2 giây trước khi call API để đảm bảo Webhook (IPN) đã được xử lý xong
        const timer = setTimeout(() => {
            fetchPaymentStatus();
        }, 2000);

        return () => clearTimeout(timer);
    }, [bookingId]);

    const fetchPaymentStatus = async () => {
        try {
            setLoading(true);
            const data = await getPaymentStatusApi(bookingId);
            setPaymentInfo(data);
        } catch (error) {
            console.error("Lỗi lấy trạng thái thanh toán:", error);
            setErrorMsg("Không thể đồng bộ trạng thái thanh toán từ hệ thống. Vui lòng liên hệ hỗ trợ.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: "#1890ff" }} spin />} />
                <Title level={4} style={{ marginTop: 24, color: "#595959" }}>Đang xác thực giao dịch thanh toán...</Title>
                <Text type="secondary">Vui lòng không tắt hoặc tải lại trang này</Text>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
                <Card style={{ borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
                    <Result
                        status="error"
                        title="Đã xảy ra lỗi"
                        subTitle={errorMsg}
                        extra={[
                            <Button type="primary" key="home" icon={<HomeOutlined />} size="large" onClick={() => navigate("/home")}>
                                Quay về Trang chủ
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    const { status, amount, paymentMethod, paymentId } = paymentInfo || {};

    const renderResult = () => {
        if (status === "SUCCESS") {
            return (
                <Result
                    icon={<CheckCircleFilled style={{ fontSize: 72, color: "#52c41a" }} />}
                    title={<Title level={2} style={{ color: "#237804" }}>Thanh toán thành công!</Title>}
                    subTitle={`Lịch hẹn #${bookingId} của bạn đã được xác nhận.`}
                    extra={[
                        <Button type="primary" key="appointments" icon={<CalendarOutlined />} size="large" onClick={() => navigate("/appointments")}>
                            Lịch hẹn của tôi
                        </Button>,
                        <Button key="home" icon={<HomeOutlined />} size="large" onClick={() => navigate("/home")}>
                            Trang chủ
                        </Button>
                    ]}
                >
                    <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", padding: "24px", borderRadius: 16, marginTop: 16 }}>
                        <Row gutter={[16, 12]} style={{ textAlign: "left" }}>
                            <Col span={12}><Text type="secondary">Mã thanh toán:</Text></Col>
                            <Col span={12} style={{ textAlign: "right" }}><Text strong>#{paymentId}</Text></Col>
                            
                            <Col span={12}><Text type="secondary">Cổng thanh toán:</Text></Col>
                            <Col span={12} style={{ textAlign: "right" }}><Tag color="cyan">{paymentMethod}</Tag></Col>
                            
                            <Col span={12}><Text type="secondary">Số tiền thanh toán:</Text></Col>
                            <Col span={12} style={{ textAlign: "right" }}>
                                <Text strong style={{ color: "#52c41a", fontSize: 18 }}>
                                    {parseFloat(amount).toLocaleString()} đ
                                </Text>
                            </Col>

                            <Col span={12}><Text type="secondary">Trạng thái:</Text></Col>
                            <Col span={12} style={{ textAlign: "right" }}><Tag color="success">ĐÃ THANH TOÁN</Tag></Col>
                        </Row>
                    </div>
                </Result>
            );
        } else if (status === "PENDING") {
            return (
                <Result
                    icon={<InfoCircleFilled style={{ fontSize: 72, color: "#faad14" }} />}
                    title={<Title level={2} style={{ color: "#ad6800" }}>Giao dịch đang xử lý</Title>}
                    subTitle="Hệ thống đang chờ cập nhật kết quả từ ví/cổng thanh toán."
                    extra={[
                        <Button type="primary" key="refresh" size="large" onClick={fetchPaymentStatus}>
                            Tải lại trạng thái
                        </Button>,
                        <Button key="appointments" size="large" onClick={() => navigate("/appointments")}>
                            Xem lịch hẹn
                        </Button>
                    ]}
                >
                    <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", padding: "24px", borderRadius: 16, marginTop: 16 }}>
                        <Text type="secondary">Mã lịch hẹn của bạn là </Text><Text strong>#{bookingId}</Text>
                        <br />
                        <Text type="secondary">Nếu tài khoản của bạn đã bị trừ tiền nhưng trạng thái chưa cập nhật, vui lòng đợi vài phút hoặc bấm nút **Tải lại trạng thái**.</Text>
                    </div>
                </Result>
            );
        } else {
            // FAILED hoặc CANCELLED
            return (
                <Result
                    icon={<CloseCircleFilled style={{ fontSize: 72, color: "#f5222d" }} />}
                    title={<Title level={2} style={{ color: "#a8071a" }}>Thanh toán thất bại</Title>}
                    subTitle="Giao dịch thanh toán không thành công hoặc đã bị hủy từ phía người dùng."
                    extra={[
                        <Button type="primary" key="retry" size="large" onClick={() => navigate("/booking")}>
                            Đặt lịch lại
                        </Button>,
                        <Button key="home" icon={<HomeOutlined />} size="large" onClick={() => navigate("/home")}>
                            Quay về Trang chủ
                        </Button>
                    ]}
                >
                    <div style={{ background: "#fff1f0", border: "1px solid #ffa39e", padding: "24px", borderRadius: 16, marginTop: 16 }}>
                        <Text type="secondary">Mã đặt lịch liên quan: </Text><Text strong>#{bookingId}</Text>
                        <br />
                        <Text type="secondary">Bạn có thể thực hiện đặt lại lịch hẹn mới và thanh toán lại qua các phương thức khác.</Text>
                    </div>
                </Result>
            );
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
            <Card 
                style={{ 
                    width: "100%", 
                    maxWidth: 600, 
                    borderRadius: 24, 
                    boxShadow: "0 15px 40px rgba(0,0,0,0.06)",
                    background: "#ffffff"
                }}
            >
                {renderResult()}
            </Card>
        </div>
    );
}
