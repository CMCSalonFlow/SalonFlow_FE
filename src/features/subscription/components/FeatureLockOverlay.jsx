import React from "react";
import { Button, Typography, Space } from "antd";
import { LockOutlined, CrownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function FeatureLockOverlay({ 
    allowed, 
    requiredPlan = "PRO", // "PRO" hoặc "ENTERPRISE"
    description = "Mở khóa các phân tích nâng cao, biểu đồ chuyên sâu và tính năng tự động hóa.",
    children 
}) {
    const navigate = useNavigate();

    if (allowed) {
        return children;
    }

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
            {/* Blurred Background Children */}
            <div style={{
                filter: "blur(5px)",
                opacity: 0.4,
                pointerEvents: "none",
                userSelect: "none"
            }}>
                {children}
            </div>

            {/* Glassmorphic Lock Overlay */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 10,
                padding: 24,
                textAlign: "center",
                borderRadius: 8
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    backgroundColor: requiredPlan === "ENTERPRISE" ? "#fff0f6" : "#e6f7ff",
                    color: requiredPlan === "ENTERPRISE" ? "#eb2f96" : "#1890ff",
                    marginBottom: 16,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                    border: `1px solid ${requiredPlan === "ENTERPRISE" ? "#ffadd2" : "#91d5ff"}`
                }}>
                    {requiredPlan === "ENTERPRISE" ? (
                        <CrownOutlined style={{ fontSize: 28 }} />
                    ) : (
                        <LockOutlined style={{ fontSize: 26 }} />
                    )}
                </div>

                <Title level={4} style={{ margin: "0 0 8px 0", fontWeight: 800 }}>
                    Tính Năng Yêu Cầu Gói {requiredPlan}
                </Title>
                
                <Text style={{ 
                    maxWidth: 380, 
                    color: "#595959", 
                    fontSize: 14, 
                    lineHeight: "1.5", 
                    marginBottom: 20,
                    display: "block"
                }}>
                    {description}
                </Text>

                <Button 
                    type="primary" 
                    size="large"
                    icon={requiredPlan === "ENTERPRISE" ? <CrownOutlined /> : <LockOutlined />}
                    onClick={() => navigate("/owner/subscription")}
                    style={{ 
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 40,
                        padding: "0 24px",
                        background: requiredPlan === "ENTERPRISE" 
                            ? "linear-gradient(135deg, #d89614, #aa7c11)" // gold for enterprise
                            : "linear-gradient(135deg, #1890ff, #096dd9)",
                        borderColor: "transparent",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
                    }}
                >
                    Nâng Cấp Gói {requiredPlan} Ngay
                </Button>
            </div>
        </div>
    );
}
