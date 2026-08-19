import React from "react";
import { Modal, Button, Typography, Space } from "antd";
import { RocketOutlined, LockOutlined, AlertOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

export default function SubscriptionLimitModal({ open, message, onClose }) {
    const navigate = useNavigate();

    const handleUpgrade = () => {
        onClose();
        navigate("/owner/subscription");
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={480}
            styles={{ body: { padding: "32px 24px" } }}
            style={{ borderRadius: 16 }}
        >
            <div style={{ textAlign: "center" }}>
                {/* Visual Icon Box */}
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
                    color: "#ff9800",
                    marginBottom: 20,
                    boxShadow: "0 4px 12px rgba(255, 152, 0, 0.15)"
                }}>
                    <RocketOutlined style={{ fontSize: 36 }} />
                </div>

                <Title level={3} style={{ margin: "0 0 12px 0", fontWeight: 800 }}>
                    Hạn Mức Đã Đạt Giới Hạn!
                </Title>

                <Paragraph style={{ 
                    fontSize: 15, 
                    color: "#595959", 
                    lineHeight: "1.6",
                    marginBottom: 24,
                    background: "#fffbe6",
                    border: "1px solid #ffe58f",
                    padding: "12px 16px",
                    borderRadius: 8,
                    textAlign: "left"
                }}>
                    <Space align="start" size={8}>
                        <AlertOutlined style={{ color: "#faad14", marginTop: 4 }} />
                        <span>{message}</span>
                    </Space>
                </Paragraph>

                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 28 }}>
                    Hãy nâng cấp gói đăng ký của bạn ngay hôm nay để mở rộng quy mô chi nhánh, tuyển dụng thêm nhân sự chuyên nghiệp và sử dụng các tính năng thông minh.
                </Paragraph>

                <Space size="middle" style={{ width: "100%", justifyContent: "center" }}>
                    <Button 
                        onClick={onClose}
                        size="large"
                        style={{ borderRadius: 8, minWidth: 100 }}
                    >
                        Để sau
                    </Button>
                    <Button 
                        type="primary" 
                        size="large"
                        icon={<RocketOutlined />}
                        onClick={handleUpgrade}
                        style={{ 
                            borderRadius: 8, 
                            minWidth: 180, 
                            fontWeight: 600,
                            background: "linear-gradient(135deg, #1890ff, #096dd9)",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)"
                        }}
                    >
                        Nâng Cấp Gói Ngay
                    </Button>
                </Space>
            </div>
        </Modal>
    );
}
