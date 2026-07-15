import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Col, Divider, Result, Row, Space, Tag, Typography } from "antd";
import { CalendarOutlined, ClockCircleOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function RecurringSuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy thông tin từ state được truyền từ trang đặt lịch
    const data = location.state || {};
    const {
        branchName,
        serviceName,
        staffName,
        pattern,
        startDate,
        endDate,
        time,
        note,
        totalCreated
    } = data;

    return (
        <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
            <Card
                style={{
                    borderRadius: 24,
                    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.08)",
                    border: "none",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #ffffff 0%, #f9fbff 100%)"
                }}
            >
                <Result
                    status="success"
                    title={
                        <Title level={2} style={{ margin: "12px 0 0 0", color: "#2f54eb" }}>
                            Đặt lịch định kỳ thành công!
                        </Title>
                    }
                    subTitle={
                        <Paragraph style={{ fontSize: 16, color: "#595959", maxWidth: 600, margin: "12px auto 0" }}>
                            Hệ thống đã ghi nhận chuỗi lịch hẹn lặp của bạn. Dưới đây là thông tin tóm tắt thiết lập chuỗi.
                        </Paragraph>
                    }
                    extra={[
                        <Button
                            key="appointments"
                            type="primary"
                            size="large"
                            onClick={() => navigate("/appointments")}
                            style={{
                                borderRadius: 10,
                                height: 48,
                                padding: "0 32px",
                                fontSize: 16,
                                fontWeight: 600,
                                background: "linear-gradient(90deg, #1d39c4 0%, #2f54eb 100%)",
                                border: "none"
                            }}
                        >
                            Quản lý lịch hẹn
                        </Button>,
                        <Button
                            key="home"
                            size="large"
                            onClick={() => navigate("/")}
                            style={{ borderRadius: 10, height: 48, padding: "0 24px", fontSize: 16 }}
                        >
                            Quay lại Trang chủ
                        </Button>
                    ]}
                >
                    <div style={{ background: "#ffffff", padding: "28px 24px", borderRadius: 20, border: "1px solid #f0f0f0" }}>
                        <Title level={4} style={{ marginTop: 0, marginBottom: 20, color: "#262626" }}>
                            Thông tin thiết lập định kỳ
                        </Title>

                        <Row gutter={[16, 20]}>
                            <Col span={24}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <ShopOutlined style={{ fontSize: 18, color: "#8c8c8c", marginTop: 3 }} />
                                    <div>
                                        <div style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: 0.5 }}>Chi nhánh</div>
                                        <Text strong style={{ fontSize: 15 }}>{branchName || "-"}</Text>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <CalendarOutlined style={{ fontSize: 18, color: "#8c8c8c", marginTop: 3 }} />
                                    <div>
                                        <div style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: 0.5 }}>Chu kỳ đặt</div>
                                        <Text strong style={{ fontSize: 15 }}>
                                            {pattern === "WEEKLY" ? "Hàng tuần" : "Mỗi 2 tuần"}
                                        </Text>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <ClockCircleOutlined style={{ fontSize: 18, color: "#8c8c8c", marginTop: 3 }} />
                                    <div>
                                        <div style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: 0.5 }}>Khung giờ cố định</div>
                                        <Tag color="gold" style={{ fontSize: 14, padding: "2px 8px", margin: "4px 0 0 0" }}>
                                            {time ? time.substring(0, 5) : "-"}
                                        </Tag>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <CalendarOutlined style={{ fontSize: 18, color: "#8c8c8c", marginTop: 3 }} />
                                    <div>
                                        <div style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: 0.5 }}>Thời gian chuỗi</div>
                                        <Text strong style={{ fontSize: 15 }}>
                                            Từ {startDate} đến {endDate}
                                        </Text>
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} sm={12}>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <UserOutlined style={{ fontSize: 18, color: "#8c8c8c", marginTop: 3 }} />
                                    <div>
                                        <div style={{ fontSize: 12, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: 0.5 }}>Nhân viên thực hiện</div>
                                        <Text strong style={{ fontSize: 15 }}>{staffName || "-"}</Text>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        <Divider style={{ margin: "20px 0" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text type="secondary">Dịch vụ đăng ký:</Text>
                            <Text strong style={{ fontSize: 16 }}>{serviceName || "-"}</Text>
                        </div>

                        {note && (
                            <div style={{ marginTop: 16, background: "#f5f5f5", padding: "12px 16px", borderRadius: 8 }}>
                                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Ghi chú gửi salon:</div>
                                <Text style={{ fontStyle: "italic", fontSize: 14 }}>{note}</Text>
                            </div>
                        )}
                    </div>
                </Result>
            </Card>
        </div>
    );
}
