import { useEffect, useState } from "react";
import {
    Card,
    Typography,
    Button,
    Row,
    Col,
    Form,
    Input,
    InputNumber,
    Switch,
    Tag,
    Space,
    Modal,
    Spin,
    message,
    Divider
} from "antd";
import {
    EditOutlined,
    SettingOutlined
} from "@ant-design/icons";
import {
    getAdminSubscriptionPlansApi,
    updateSubscriptionPlanApi
} from "../api/subscriptionApi";

const { Title, Text } = Typography;

export const getFixedFeaturesForPlan = (planItem) => {
    const plan = planItem?.plan;
    if (plan === "FREE") {
        return [
            `Tối đa ${planItem.maxBranches || 1} chi nhánh`,
            `Tối đa ${planItem.maxStaffPerBranch || 3} nhân viên`,
            "Quản lý lịch hẹn & POS cơ bản"
        ];
    }
    if (plan === "PRO") {
        return [
            `Tối đa ${planItem.maxBranches || 3} chi nhánh`,
            `Tối đa ${planItem.maxStaffPerBranch || 10} nhân viên`,
            "Quản lý lịch hẹn & POS nâng cao",
            "Phân tích báo cáo chuyên sâu"
        ];
    }
    // ENTERPRISE
    return [
        "Không giới hạn chi nhánh (999)",
        "Không giới hạn nhân viên (999)",
        "Quản lý lịch hẹn & POS nâng cao",
        "Phân tích báo cáo chuyên sâu",
        "AI No-Show Prediction (Dự báo bùng lịch)",
        "AI Smart Scheduling & Content Creator"
    ];
};

export default function AdminSubscriptionPlanConfigPage() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form] = Form.useForm();

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const res = await getAdminSubscriptionPlansApi();
            const data = res?.data || res || [];
            if (Array.isArray(data)) {
                setConfigs(data);
            }
        } catch (err) {
            console.error(err);
            message.error("Không thể tải cấu hình các gói dịch vụ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleOpenEdit = (planItem) => {
        setEditingPlan(planItem);
        form.setFieldsValue({
            name: planItem.name,
            description: planItem.description,
            monthlyPrice: planItem.monthlyPrice,
            yearlyPrice: planItem.yearlyPrice,
            maxBranches: planItem.maxBranches,
            maxStaffPerBranch: planItem.maxStaffPerBranch,
            hasAnalytics: planItem.hasAnalytics,
            hasAi: planItem.hasAi,
            badgeText: planItem.badgeText
        });
        setEditModalOpen(true);
    };

    const handleSubmit = async (values) => {
        if (!editingPlan) return;
        try {
            setSubmitting(true);
            const fixedFeatures = getFixedFeaturesForPlan({ ...editingPlan, ...values });
            const payload = {
                ...values,
                features: fixedFeatures,
                isPopular: false
            };

            await updateSubscriptionPlanApi(editingPlan.plan, payload);
            message.success(`Cập nhật cấu hình gói [${editingPlan.name}] thành công!`);
            setEditModalOpen(false);
            fetchConfigs();
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return "0 đ";
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
    };

    return (
        <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>
                    Cấu hình Bảng giá & Giới hạn Gói dịch vụ
                </Title>
                <Text style={{ color: "#64748b", fontSize: 14 }}>
                    Tùy chỉnh đơn giá thanh toán và hạn ngạch tài nguyên cho các gói SaaS hệ thống.
                </Text>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <Spin size="large" tip="Đang tải cấu hình các gói..." />
                </div>
            ) : (
                <Row gutter={[24, 24]}>
                    {configs.map((planItem) => {
                        const isPro = planItem.plan === "PRO";
                        const isEnt = planItem.plan === "ENTERPRISE";
                        const featuresDisplay = getFixedFeaturesForPlan(planItem);

                        const primaryColor = isPro ? "#2563eb" : isEnt ? "#d97706" : "#64748b";
                        const borderColor = isPro ? "#bfdbfe" : isEnt ? "#fef3c7" : "#e2e8f0";

                        return (
                            <Col xs={24} md={8} key={planItem.plan}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        borderColor: borderColor,
                                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        position: "relative"
                                    }}
                                    bodyStyle={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}
                                >
                                    {/* Top Badge */}
                                    {planItem.badgeText && (
                                        <div style={{ position: "absolute", top: 16, right: 20 }}>
                                            <Tag color={isPro ? "blue" : isEnt ? "gold" : "default"} style={{ fontWeight: 700, borderRadius: 10, padding: "2px 10px", margin: 0 }}>
                                                {planItem.badgeText}
                                            </Tag>
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div style={{ marginBottom: 16 }}>
                                        <Title level={4} style={{ margin: 0, fontWeight: 800, color: primaryColor }}>
                                            {planItem.name}
                                        </Title>
                                        <Text style={{ color: "#64748b", fontSize: 12.5 }}>
                                            {planItem.description || `Mã gói: ${planItem.plan}`}
                                        </Text>
                                    </div>

                                    {/* Price Box */}
                                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 12, marginBottom: 20, border: "1px solid #f1f5f9" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                                            <Text style={{ color: "#64748b", fontSize: 13 }}>Giá Theo Tháng:</Text>
                                            <Text strong style={{ fontSize: 18, color: "#0f172a", fontWeight: 800 }}>
                                                {planItem.monthlyPrice > 0 ? formatCurrency(planItem.monthlyPrice) : "0 đ"} <span style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>/tháng</span>
                                            </Text>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                            <Text style={{ color: "#64748b", fontSize: 13 }}>Giá Theo Năm:</Text>
                                            <Text strong style={{ fontSize: 14.5, color: "#475569", fontWeight: 700 }}>
                                                {planItem.yearlyPrice > 0 ? formatCurrency(planItem.yearlyPrice) : "0 đ"} <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>/năm</span>
                                            </Text>
                                        </div>
                                    </div>

                                    {/* Quota Specs */}
                                    <div style={{ marginBottom: 16 }}>
                                        <Text strong style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 10 }}>
                                            HẠN NGẠCH QUY MÔ
                                        </Text>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                                                <Text style={{ color: "#475569" }}>Chi nhánh tối đa:</Text>
                                                <Text strong style={{ color: "#0f172a" }}>{planItem.maxBranches} chi nhánh</Text>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                                                <Text style={{ color: "#475569" }}>Nhân viên / branch:</Text>
                                                <Text strong style={{ color: "#0f172a" }}>{planItem.maxStaffPerBranch} nhân viên</Text>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                                                <Text style={{ color: "#475569" }}>Phân tích Báo cáo:</Text>
                                                <Tag color={planItem.hasAnalytics ? "green" : "default"} style={{ margin: 0, borderRadius: 6 }}>
                                                    {planItem.hasAnalytics ? "Có tích hợp" : "Khóa"}
                                                </Tag>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                                                <Text style={{ color: "#475569" }}>Tính năng AI:</Text>
                                                <Tag color={planItem.hasAi ? "purple" : "default"} style={{ margin: 0, borderRadius: 6 }}>
                                                    {planItem.hasAi ? "Có tích hợp" : "Khóa"}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>

                                    <Divider style={{ margin: "12px 0 16px" }} />

                                    {/* Feature Bullets */}
                                    <div style={{ flex: 1, marginBottom: 20 }}>
                                        <Text strong style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 10 }}>
                                            DANH SÁCH TÍNH NĂNG ĐẶC QUYỀN
                                        </Text>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {featuresDisplay.map((feat, idx) => (
                                                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#334155" }}>
                                                    <span style={{ color: primaryColor, fontWeight: 700, lineHeight: 1 }}>•</span>
                                                    <span>{feat}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Edit Button */}
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        block
                                        onClick={() => handleOpenEdit(planItem)}
                                        style={{
                                            height: 42,
                                            fontWeight: 700,
                                            borderRadius: 10,
                                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                            borderColor: "#2563eb",
                                            boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)"
                                        }}
                                    >
                                        Chỉnh sửa cấu hình gói
                                    </Button>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Modal Edit Plan Config */}
            <Modal
                title={
                    <Space align="center">
                        <SettingOutlined style={{ color: "#2563eb" }} />
                        <span>Chỉnh sửa Cấu hình Gói [{editingPlan?.name}]</span>
                    </Space>
                }
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                footer={null}
                width={640}
                centered
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item
                                label="Tên hiển thị gói"
                                name="name"
                                rules={[{ required: true, message: "Vui lòng nhập tên gói!" }]}
                            >
                                <Input placeholder="Gói PRO" size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item label="Nhãn Badge góc thẻ" name="badgeText">
                                <Input placeholder="Phổ biến / Cao cấp..." size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Mô tả ngắn gọn" name="description">
                        <Input.TextArea rows={2} placeholder="Mô tả đối tượng Salon phù hợp sử dụng gói..." />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Giá thanh toán Theo Tháng (VND)"
                                name="monthlyPrice"
                                rules={[{ required: true, message: "Vui lòng nhập giá tháng!" }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    size="large"
                                    min={0}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                    parser={value => value.replace(/\./g, '')}
                                    addonAfter="đ/tháng"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Giá thanh toán Theo Năm (VND)"
                                name="yearlyPrice"
                                rules={[{ required: true, message: "Vui lòng nhập giá năm!" }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    size="large"
                                    min={0}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                    parser={value => value.replace(/\./g, '')}
                                    addonAfter="đ/năm"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Số Chi nhánh tối đa được tạo"
                                name="maxBranches"
                                rules={[{ required: true, message: "Nhập số chi nhánh tối đa!" }]}
                            >
                                <InputNumber style={{ width: "100%" }} size="large" min={1} max={999} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Số Nhân viên tối đa / Chi nhánh"
                                name="maxStaffPerBranch"
                                rules={[{ required: true, message: "Nhập số nhân viên tối đa!" }]}
                            >
                                <InputNumber style={{ width: "100%" }} size="large" min={1} max={999} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
                        <Col span={12}>
                            <Form.Item label="Mở Báo cáo Analytics" name="hasAnalytics" valuePropName="checked">
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Mở Tính năng AI" name="hasAi" valuePropName="checked">
                                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: "right", borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                        <Space size={12}>
                            <Button onClick={() => setEditModalOpen(false)} size="large">
                                Hủy bỏ
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submitting} size="large" style={{ borderRadius: 8, fontWeight: 700, padding: "0 28px" }}>
                                LƯU CẤU HÌNH GÓI
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
