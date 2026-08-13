import React, { useEffect, useState } from "react";
import { Card, Result, Button, Typography, Space } from "antd";
import { CheckCircleOutlined, ArrowRightOutlined, RocketOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../hooks/useSubscription";

const { Title, Paragraph, Text } = Typography;

export default function SubscriptionSuccessPage() {
    const navigate = useNavigate();
    const { refetchSubscription } = useSubscription();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Refetch active plan information to sync with DB right after return from Stripe
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
    }, [navigate, refetchSubscription]);

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
                <Result
                    status="success"
                    icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 72 }} />}
                    title={
                        <Title level={2} style={{ margin: "16px 0 8px 0", fontWeight: 800 }}>
                            Giao Dịch Thành Công!
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
            </Card>
        </div>
    );
}
