import React from "react";
import { Card, Result, Button, Typography, Space } from "antd";
import { CloseCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

export default function SubscriptionCancelPage() {
    const navigate = useNavigate();

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
                    status="warning"
                    icon={<CloseCircleOutlined style={{ color: "#fa8c16", fontSize: 72 }} />}
                    title={
                        <Title level={2} style={{ margin: "16px 0 8px 0", fontWeight: 800 }}>
                            Giao Dịch Đã Hủy!
                        </Title>
                    }
                    subTitle={
                        <Paragraph style={{ color: "#595959", fontSize: 16, lineHeight: "1.6" }}>
                            Giao dịch nâng cấp gói dịch vụ của bạn đã bị hủy bỏ hoặc không thể hoàn tất. Tài khoản không có bất kỳ khoản phí phát sinh nào.
                        </Paragraph>
                    }
                    extra={
                        <Space size="middle" key="actions">
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/owner/subscription")}
                                style={{ 
                                    borderRadius: 8, 
                                    padding: "0 24px",
                                    height: 44,
                                    fontWeight: "bold"
                                }}
                            >
                                Quay Lại Gói Dịch Vụ
                            </Button>
                        </Space>
                    }
                />
            </Card>
        </div>
    );
}
