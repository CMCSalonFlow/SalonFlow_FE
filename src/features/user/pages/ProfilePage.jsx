import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Button, Typography, Row, Col, Space, Divider, message, Spin, Tag, Modal, Form, Input } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import api from "@/core/api/axios";
import LoyaltyPointsSection from "../components/LoyaltyPointsSection";

const { Title, Text } = Typography;

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

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

    const handleOpenEditModal = () => {
        form.setFieldsValue({
            fullName: user?.fullName || "",
            phone: user?.phone || "",
        });
        setIsModalOpen(true);
    };

    const handleUpdateProfile = async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                fullName: values.fullName?.trim() || user?.fullName,
                phone: values.phone?.trim() || "",
                avatarUrl: user?.avatarUrl,
            };
            const response = await api.put(`/api/v1/users/${userId}`, payload);
            message.success("Cập nhật thông tin thành công!");
            setUser(response.data);
            setIsModalOpen(false);
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Không thể cập nhật số điện thoại.";
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

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
                <Card 
                    title="Thông tin cá nhân" 
                    bordered={false} 
                    style={{ borderRadius: 16, background: "#fff" }}
                    extra={
                        <Button 
                            type="primary" 
                            ghost 
                            icon={<EditOutlined />} 
                            onClick={handleOpenEditModal}
                            style={{ borderRadius: 8 }}
                        >
                            Chỉnh sửa
                        </Button>
                    }
                >
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

            {/* Modal chỉnh sửa thông tin / số điện thoại */}
            <Modal
                title="Cập nhật thông tin cá nhân"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                okText="Lưu thay đổi"
                cancelText="Hủy"
                destroyOnClose
                style={{ top: 100 }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" maxLength={100} />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: "Vui lòng nhập số điện thoại" },
                            {
                                pattern: /^(0|84)[3|5|7|8|9][0-9]{8}$/,
                                message: "Số điện thoại không đúng định dạng (Ví dụ: 0987654321)"
                            }
                        ]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="Ví dụ: 0987654321" maxLength={15} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

