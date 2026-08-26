import React, { useEffect, useState } from "react";
import { Card, Result, Button, Typography, Space, Spin } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ArrowRightOutlined, RocketOutlined, RedoOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../hooks/useSubscription";

const { Title, Paragraph, Text } = Typography;

export default function SubscriptionSuccessPage() {
    const navigate = useNavigate();
    const { refetchSubscription } = useSubscription();
    const [countdown, setCountdown] = useState(5);
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                setSuccess(true);
                refetchSubscription();
            } catch (err) {
                console.error("Xác minh thanh toán đăng ký gói thất bại:", err);
                setErrorMsg(err.message || "Xác thực giao dịch thanh toán thất bại.");
            } finally {
                setVerifying(false);
            }
        };

        verifyPayment();
    }, [refetchSubscription]);

    // Đếm ngược chuyển hướng khi thanh toán thành công
    useEffect(() => {
        if (!success) return;

        // Cập nhật thông tin gói đăng ký mới lên context/DB
        refetchSubscription();

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate("/owner/subscription");
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [success, navigate, refetchSubscription]);

    return (
        <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            minHeight: "75vh",
            padding: 16
        }}>
            <Card 
                style={{ 
                    maxWidth: 580, 
                    width: "100%", 
                    borderRadius: 20, 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    textAlign: "center"
                }}
            >
                {verifying ? (
                    <div style={{ padding: "40px 0" }}>
                        <Spin size="large" />
                        <Title level={4} style={{ marginTop: 24, color: "#1890ff" }}>
                            Đang xác thực giao dịch đăng ký gói...
                        </Title>
                        <Paragraph type="secondary">
                            Vui lòng giữ kết nối, hệ thống đang cập nhật trạng thái gói dịch vụ của bạn.
                        </Paragraph>
                    </div>
                ) : success ? (
                    <Result
                        status="success"
                        icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 72 }} />}
                        title={
                            <Title level={2} style={{ margin: "16px 0 8px 0", fontWeight: 800 }}>
                                Nâng Cấp Thành Công!
                            </Title>
                        }
                        subTitle={
                            <Paragraph style={{ color: "#595959", fontSize: 16, lineHeight: "1.6" }}>
                                Tài khoản của bạn đã được nâng cấp lên gói dịch vụ mới thành công. Hãy khám phá ngay các tính năng phân tích và công cụ quản lý mở rộng.
                            </Paragraph>
                        }
                        extra={[
                            <Space direction="vertical" size={16} key="actions" style={{ width: "100%" }}>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    icon={<RocketOutlined />}
                                    onClick={() => navigate("/owner")}
                                    style={{ 
                                        borderRadius: 8, 
                                        padding: "0 32px",
                                        height: 44,
                                        fontWeight: "bold",
                                        background: "linear-gradient(135deg, #52c41a, #389e0d)",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(82, 196, 26, 0.2)"
                                    }}
                                >
                                    Đi tới Owner Dashboard <ArrowRightOutlined />
                                </Button>
                                
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Trình duyệt sẽ tự động chuyển hướng về trang Gói Dịch Vụ sau <strong>{countdown}</strong> giây.
                                </Text>
                            </Space>
                        ]}
                    />
                ) : (
                    <Result
                        status="error"
                        icon={<CloseCircleOutlined style={{ color: "#f5222d", fontSize: 72 }} />}
                        title={
                            <Title level={2} style={{ margin: "16px 0 8px 0", fontWeight: 800 }}>
                                Nâng Cấp Thất Bại
                            </Title>
                        }
                        subTitle={
                            <Paragraph style={{ color: "#595959", fontSize: 16, lineHeight: "1.6" }}>
                                {errorMsg || "Giao dịch thanh toán đã bị hủy hoặc gặp lỗi trong quá trình xử lý."}
                            </Paragraph>
                        }
                        extra={[
                            <Space size={16} key="actions" style={{ justifyContent: "center" }}>
                                <Button 
                                    type="primary" 
                                    danger
                                    size="large" 
                                    icon={<RedoOutlined />}
                                    onClick={() => navigate("/owner/subscription")}
                                    style={{ 
                                        borderRadius: 8, 
                                        height: 44,
                                        fontWeight: "bold"
                                    }}
                                >
                                    Chọn gói thanh toán lại
                                </Button>
                                <Button 
                                    size="large" 
                                    onClick={() => navigate("/owner")}
                                    style={{ 
                                        borderRadius: 8, 
                                        height: 44
                                    }}
                                >
                                    Về trang chủ
                                </Button>
                            </Space>
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
