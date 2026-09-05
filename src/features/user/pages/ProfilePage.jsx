import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card, Avatar, Button, Typography, Row, Col, Space, Divider, message,
    Spin, Tag, Modal, Form, Input, Upload, Descriptions, Badge
} from "antd";
import {
    UserOutlined, MailOutlined, PhoneOutlined, ArrowLeftOutlined, EditOutlined,
    CameraOutlined, LockOutlined, CrownOutlined, SafetyCertificateOutlined,
    CheckCircleOutlined, IdcardOutlined
} from "@ant-design/icons";
import api from "@/core/api/axios";
import { uploadMediaApi } from "@/features/media/api/mediaApi";
import LoyaltyPointsSection from "../components/LoyaltyPointsSection";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

const { Title, Text, Paragraph } = Typography;

export default function ProfilePage() {
    const navigate = useNavigate();
    const { subscription, features } = useSubscription();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal Edit Profile
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [form] = Form.useForm();

    // Modal Change Password
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [passwordForm] = Form.useForm();

    const userId = localStorage.getItem("userId");
    const rolesStr = localStorage.getItem("roles");
    const roles = (() => {
        try {
            return rolesStr ? JSON.parse(rolesStr) : [];
        } catch {
            return [];
        }
    })();

    const isOwner = roles.includes("SALON_OWNER") || roles.includes("ROLE_SALON_OWNER");
    const isManager = roles.includes("MANAGER") || roles.includes("BRANCH_MANAGER") || roles.includes("ROLE_MANAGER");
    const isStaff = roles.includes("STAFF") || roles.includes("ROLE_STAFF");
    const isStaffOrOwner = isOwner || isManager || isStaff || roles.includes("SUPER_ADMIN");
    const showLoyalty = !isStaffOrOwner && (roles.includes("CUSTOMER") || roles.includes("ROLE_CUSTOMER"));

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
            if (response.data?.fullName) {
                localStorage.setItem("fullName", response.data.fullName);
            }
            window.dispatchEvent(new CustomEvent("profileUpdated", { detail: response.data }));
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
        setIsEditModalOpen(true);
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
            if (response.data?.avatarUrl) {
                localStorage.setItem("avatarUrl", response.data.avatarUrl);
            }
            window.dispatchEvent(new CustomEvent("profileUpdated", { detail: response.data }));
            setIsEditModalOpen(false);
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Không thể cập nhật thông tin.";
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePassword = async (values) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        try {
            setPasswordSubmitting(true);
            await api.post("/api/v1/auth/change-password", {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword
            });
            message.success("Đổi mật khẩu thành công!");
            setIsPasswordModalOpen(false);
            passwordForm.resetFields();
        } catch (error) {
            message.error(error?.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.");
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const getRoleLabel = () => {
        if (isOwner) return "Chủ Salon (Owner)";
        if (isManager) return "Lễ tân / Quản lý";
        if (isStaff) return "Thợ làm dịch vụ";
        return "Khách hàng";
    };

    const getRoleTagColor = () => {
        if (isOwner) return "purple";
        if (isManager) return "gold";
        if (isStaff) return "blue";
        return "green";
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải thông tin tài khoản..." />
            </div>
        );
    }

    const currentPlanName = subscription?.plan || "ENTERPRISE";

    return (
        <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
            {/* Thẻ Khung Liền Mạch Thống Nhất */}
            <Card
                bordered={false}
                style={{
                    borderRadius: 24,
                    overflow: "hidden",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                    background: "#ffffff"
                }}
                bodyStyle={{ padding: 0 }}
            >
                {/* 1. Phía trên: Cover Banner Nền Sáng Trắng Nổi Bật */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                        padding: "24px 32px",
                        borderBottom: "1px solid #f1f5f9"
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            type="text"
                            icon={<ArrowLeftOutlined style={{ color: "#475569" }} />}
                            onClick={() => navigate(-1)}
                            style={{ color: "#475569", padding: 0 }}
                        >
                            Quay lại
                        </Button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 280 }}>
                            <div style={{ position: "relative", flexShrink: 0 }}>
                                <Avatar
                                    size={90}
                                    src={user?.avatarUrl}
                                    icon={<UserOutlined />}
                                    style={{
                                        border: "3px solid #1677ff",
                                        boxShadow: "0 6px 18px rgba(22, 119, 255, 0.15)",
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
                                            bottom: 2,
                                            right: 2,
                                            backgroundColor: "#1677ff",
                                            color: "#fff",
                                            borderColor: "#fff",
                                            boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
                                            cursor: "pointer"
                                        }}
                                        title="Đổi ảnh đại diện"
                                    />
                                </Upload>
                            </div>

                            <div>
                                <Title level={2} style={{ margin: "0 0 6px 0", color: "#0f172a", fontWeight: 700 }}>
                                    {user?.fullName || user?.username}
                                </Title>

                                <Space size="large" wrap style={{ color: "#475569", fontSize: 14 }}>
                                    <span><MailOutlined style={{ color: "#1677ff", marginRight: 6 }} />{user?.email}</span>
                                    <span><PhoneOutlined style={{ color: "#52c41a", marginRight: 6 }} />{user?.phone || "Chưa cập nhật SĐĐT"}</span>
                                </Space>
                            </div>
                        </div>

                        {/* 2 Buttons căn ngang hàng với Avatar */}
                        <Space wrap style={{ flexShrink: 0 }}>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={handleOpenEditModal}
                                style={{ borderRadius: 10, fontWeight: 600, height: 40 }}
                            >
                                Chỉnh sửa hồ sơ
                            </Button>
                            <Button
                                icon={<LockOutlined />}
                                onClick={() => setIsPasswordModalOpen(true)}
                                style={{ borderRadius: 10, fontWeight: 600, color: "#334155", height: 40 }}
                            >
                                Đổi mật khẩu
                            </Button>
                        </Space>
                    </div>
                </div>

                {/* 2. Phía dưới: Thông tin Gói Dịch vụ & Hạn mức (Chủ Salon) */}
                {isOwner && (
                    <div style={{ padding: "28px 32px", background: "#ffffff" }}>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 16, color: "#0f172a" }}>Gói Dịch Vụ & Hạn Mức</Text>
                        </div>

                        <Row gutter={[24, 16]} align="middle">
                            <Col xs={24} md={10}>
                                <div style={{ background: "#f8fafc", padding: 20, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>GÓI ĐANG ĐĂNG KÝ</Text>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <Tag color="gold" style={{ fontSize: 15, padding: "6px 14px", borderRadius: 8, fontWeight: 800 }}>
                                            <CrownOutlined /> {currentPlanName} PLAN
                                        </Tag>
                                        <Badge status="processing" text="Active" />
                                    </div>
                                    <Button
                                        type="primary"
                                        ghost
                                        block
                                        icon={<CrownOutlined />}
                                        onClick={() => navigate("/owner/subscription")}
                                        style={{ borderRadius: 10, fontWeight: 600, marginTop: 4 }}
                                    >
                                        Quản lý Gói dịch vụ
                                    </Button>
                                </div>
                            </Col>
                            <Col xs={24} md={14}>
                                <Text strong style={{ fontSize: 14, color: "#1e293b", display: "block", marginBottom: 10 }}>
                                    Quyền lợi kích hoạt theo gói dịch vụ:
                                </Text>
                                <Row gutter={[12, 12]}>
                                    <Col span={12}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                                            <CheckCircleOutlined style={{ color: "#16a34a" }} />
                                            <span>AI Phân tích Cảm xúc Review</span>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                                            <CheckCircleOutlined style={{ color: "#16a34a" }} />
                                            <span>AI Dự đoán Vắng mặt (No-Show)</span>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                                            <CheckCircleOutlined style={{ color: "#16a34a" }} />
                                            <span>Quản lý Đa chi nhánh & Nhân sự</span>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                                            <CheckCircleOutlined style={{ color: "#16a34a" }} />
                                            <span>Báo cáo Giờ cao điểm chuyên sâu</span>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                )}

                {/* 3. Section Điểm thưởng (Chỉ dành cho Khách hàng) */}
                {showLoyalty && (
                    <div style={{ padding: "28px 32px", background: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                        <LoyaltyPointsSection userId={user?.id} />
                    </div>
                )}
            </Card>

            {/* Modal Chỉnh sửa Họ tên / SĐT */}
            <Modal
                title="Cập nhật thông tin cá nhân"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
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

            {/* Modal Đổi mật khẩu */}
            <Modal
                title="Đổi mật khẩu tài khoản"
                open={isPasswordModalOpen}
                onCancel={() => {
                    setIsPasswordModalOpen(false);
                    passwordForm.resetFields();
                }}
                onOk={() => passwordForm.submit()}
                confirmLoading={passwordSubmitting}
                okText="Đổi mật khẩu"
                cancelText="Hủy"
                destroyOnClose
                style={{ top: 100 }}
            >
                <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới" },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới" }]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
