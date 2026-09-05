import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Button, Typography, Row, Col, Space, Divider, message, Spin, Tag, Modal, Form, Input, Upload } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, ArrowLeftOutlined, EditOutlined, CameraOutlined } from "@ant-design/icons";
import api from "@/core/api/axios";
import { uploadMediaApi } from "@/features/media/api/mediaApi";
import LoyaltyPointsSection from "../components/LoyaltyPointsSection";

const { Title, Text } = Typography;

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

    const handleAvatarUpload = async ({ file }) => {
        try {
            setUploadingAvatar(true);
            const res = await uploadMediaApi(file);
            const uploadedUrl = res?.url || res?.fileUrl || res?.mediaUrl || (typeof res === "string" ? res : null);
            if (!uploadedUrl) {
                message.error("Không lấy được đường dẫn ảnh sau khi tải lên.");
                return;
            }

            const payload = {
                fullName: user?.fullName,
                phone: user?.phone || "",
                avatarUrl: uploadedUrl
            };
            const response = await api.put(`/api/v1/users/${userId}`, payload);
            message.success("Cập nhật ảnh đại diện thành công!");
            setUser(response.data);
            if (response.data?.avatarUrl) {
                localStorage.setItem("avatarUrl", response.data.avatarUrl);
            }
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi tải ảnh đại diện lên.");
        } finally {
            setUploadingAvatar(false);
        }
    };

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
            if (response.data?.fullName) {
                localStorage.setItem("fullName", response.data.fullName);
            }
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

                {/* Header Profile: Giao diện Hàng Ngang Liền Mạch */}
                <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "12px 8px 24px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", marginBottom: 24 }}>
                    {/* Left: Avatar with Camera button */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar
                            size={90}
                            src={user?.avatarUrl}
                            icon={<UserOutlined />}
                            style={{
                                border: "3px solid #1677ff",
                                boxShadow: "0 6px 18px rgba(22, 119, 255, 0.2)",
                                backgroundColor: user?.avatarUrl ? "transparent" : "#1677ff",
                                color: "#fff"
                            }}
                        />
                        <Upload
                            showUploadList={false}
                            accept="image/*"
                            customRequest={handleAvatarUpload}
                            disabled={uploadingAvatar}
                        >
                            <Button
                                shape="circle"
                                icon={uploadingAvatar ? <Spin size="small" /> : <CameraOutlined />}
                                size="small"
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: "#1677ff",
                                    color: "#fff",
                                    borderColor: "#fff",
                                    boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                                    cursor: "pointer"
                                }}
                                title="Đổi ảnh đại diện"
                            />
                        </Upload>
                    </div>

                    {/* Middle: Full Name, Email, Phone */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                        <Title level={3} style={{ margin: "0 0 8px 0", color: "#1e1b4b", fontWeight: 700 }}>
                            {user?.fullName || user?.username}
                        </Title>

                        <Space size="large" wrap style={{ color: "#475569" }}>
                            <Space style={{ fontSize: 14 }}>
                                <MailOutlined style={{ color: "#1677ff", fontSize: 16 }} />
                                <Text style={{ color: "#334155", fontWeight: 600 }}>{user?.email}</Text>
                            </Space>
                            <Space style={{ fontSize: 14 }}>
                                <PhoneOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                                <Text style={{ color: "#334155", fontWeight: 600 }}>{user?.phone || "Chưa cập nhật SĐĐT"}</Text>
                            </Space>
                        </Space>
                    </div>

                    {/* Far Right: Edit Profile Button */}
                    <div style={{ flexShrink: 0 }}>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={handleOpenEditModal}
                            style={{
                                borderRadius: 12,
                                fontWeight: 600,
                                height: 42,
                                padding: "0 20px",
                                backgroundColor: "#1677ff",
                                borderColor: "#1677ff",
                                boxShadow: "0 4px 14px rgba(22, 119, 255, 0.3)"
                            }}
                        >
                            Chỉnh sửa hồ sơ
                        </Button>
                    </div>
                </div>

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

