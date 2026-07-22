import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Button, Typography, Row, Col, Space, Divider, message, Spin, Tag } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import api from "@/core/api/axios";
import LoyaltyPointsSection from "../components/LoyaltyPointsSection";

const { Title, Text } = Typography;

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Lấy thông tin User hiện tại từ localStorage
    const userId = localStorage.getItem("userId");

    const fetchUserProfile = async () => {
        if (!userId) {
            message.error("Vui lòng đăng nhập lại.");
            navigate("/login");
            return;
        }
        try {
            setLoading(true);
            const response = await api.get(`/api/v1/users/${userId}`);
            setUser(response.data);
        } catch (error) {
            message.error("Không thể tải thông tin tài khoản.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải thông tin tài khoản..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 850, margin: "40px auto", padding: "0 20px" }}>
            <Card
                style={{
                    borderRadius: 24,
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                    background: "linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)",
                    border: "none",
                    overflow: "hidden"
                }}
            >
                {/* Back Button */}
                <Button 
                    type="text" 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate(-1)} 
                    style={{ marginBottom: 16 }}
                >
                    Quay lại
                </Button>

                {/* Header Profile */}
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <Avatar
                        size={100}
                        src={user?.avatarUrl}
                        icon={<UserOutlined />}
                        style={{
                            border: "4px solid #1677ff",
                            boxShadow: "0 4px 15px rgba(22, 119, 255, 0.2)",
                            marginBottom: 16
                        }}
                    />
                    <Title level={3} style={{ marginBottom: 4 }}>
                        {user?.fullName || user?.username}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        @{user?.username}
                    </Text>
                    <div style={{ marginTop: 12 }}>
                        {(user?.roles || []).map(role => (
                            <Tag key={role} color="blue" style={{ borderRadius: 6, fontWeight: 500, padding: "2px 8px" }}>
                                {role}
                            </Tag>
                        ))}
                    </div>
                </div>

                <Divider style={{ margin: "24px 0" }} />

                {/* Thông tin chi tiết */}
                <Card title="Thông tin cá nhân" bordered={false} style={{ borderRadius: 16, background: "#fff" }}>
                    <Row gutter={[24, 16]}>
                        <Col xs={24} sm={12}>
                            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                                <MailOutlined /> Email
                            </Text>
                            <Text strong>{user?.email}</Text>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                                <PhoneOutlined /> Số điện thoại
                            </Text>
                            <Text strong>{user?.phone || "Chưa cập nhật"}</Text>
                        </Col>
                    </Row>
                </Card>

                {/* Section Điểm thưởng (Loyalty Points) */}
                <LoyaltyPointsSection userId={user?.id} />
            </Card>
        </div>
    );
}
