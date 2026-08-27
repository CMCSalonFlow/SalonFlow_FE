import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, Space, Table, Tag, Segmented, Spin, Badge, Divider, Modal, Alert, message } from "antd";
import {
    CrownOutlined,
    CheckCircleOutlined,
    HistoryOutlined,
    TransactionOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    RocketOutlined,
    LockOutlined,
    PhoneOutlined
} from "@ant-design/icons";
import { useSubscription } from "../hooks/useSubscription";
import {
    getSubscriptionHistoryApi,
    getActiveSubscriptionApi,
    createVietQrSubscriptionCheckoutApi,
    confirmSubscriptionBankTransferApi
} from "../api/subscriptionApi";

const { Title, Text, Paragraph } = Typography;

export default function SubscriptionPage() {
    const { subscription, loading: subLoading, checkout, openPortal, cancelSubscription, refetchSubscription } = useSubscription();
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState("MONTHLY"); // MONTHLY or YEARLY
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [manageModalOpen, setManageModalOpen] = useState(false);
    const [vietQrModalOpen, setVietQrModalOpen] = useState(false);
    const [vietQrData, setVietQrData] = useState(null);
    const [confirmingBank, setConfirmingBank] = useState(false);

    const handleOpenVietQrModal = async (plan = "PRO", cycle = billingCycle) => {
        try {
            message.loading({ content: "Đang tạo mã VietQR...", key: "vietqr_create" });
            const successUrl = `${window.location.origin}/owner/subscription/success`;
            const cancelUrl = `${window.location.origin}/owner/subscription/cancel`;
            const res = await createVietQrSubscriptionCheckoutApi({
                plan,
                billingCycle: cycle,
                successUrl,
                cancelUrl
            });
            message.destroy("vietqr_create");
            if (res?.id) {
                const amount = res.price || (cycle === "YEARLY" ? 4788000 : 499000);
                const bankCode = "MBBank";
                const accountNo = "0001247370390";
                const accountName = "NGUYEN TRUNG DUC";
                const transferContent = `SF SUB${res.id}`;
                const encodedAccountName = encodeURIComponent(accountName);
                const encodedMemo = encodeURIComponent(transferContent);
                const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedAccountName}`;

                setVietQrData({
                    subId: res.id,
                    amount: amount,
                    content: transferContent,
                    accountNo: accountNo,
                    accountName: accountName,
                    qrUrl: qrUrl
                });
                setVietQrModalOpen(true);
            }
        } catch (err) {
            message.destroy("vietqr_create");
            message.error(err.response?.data?.message || "Tạo mã VietQR thất bại");
        }
    };

    useEffect(() => {
        const fetchHistory = async () => {
            setHistoryLoading(true);
            try {
                const data = await getSubscriptionHistoryApi();
                setHistory(data || []);
            } catch (error) {
                console.error("Lỗi lấy lịch sử thanh toán:", error);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [subscription?.id, subscription?.status]);

    // Tự động kiểm tra (auto polling 3s/lần) khi mở Modal VietQR
    useEffect(() => {
        if (!vietQrModalOpen || !vietQrData?.subId) return;

        const interval = setInterval(async () => {
            try {
                const currentSub = await getActiveSubscriptionApi();
                if (currentSub && currentSub.id === vietQrData.subId && currentSub.status === "ACTIVE") {
                    clearInterval(interval);
                    message.success("Thanh toán chuyển khoản thành công! Gói dịch vụ đã được kích hoạt tự động.");
                    setVietQrModalOpen(false);
                    refetchSubscription();
                }
            } catch (err) {
                console.error("Lỗi tự động kiểm tra thanh toán:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [vietQrModalOpen, vietQrData?.subId, refetchSubscription]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price || 0);
    };

    const getPlanTagColor = (plan) => {
        switch (plan) {
            case "FREE": return "default";
            case "PRO": return "blue";
            case "ENTERPRISE": return "gold";
            default: return "default";
        }
    };

    const getStatusTagColor = (status) => {
        switch (status) {
            case "ACTIVE": return "success";
            case "PAST_DUE": return "warning";
            case "CANCELED": return "error";
            case "EXPIRED": return "default";
            default: return "default";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "ACTIVE": return "Đang hoạt động";
            case "PAST_DUE": return "Nợ cước";
            case "CANCELED": return "Đã hủy gia hạn";
            case "EXPIRED": return "Đã hết hạn";
            default: return status;
        }
    };

    const currentPlan = subscription?.plan || "FREE";
    const currentStatus = subscription?.status || "ACTIVE";

    // Table Columns for History
    const historyColumns = [
        {
            title: "Mã GD",
            dataIndex: "id",
            key: "id",
            render: (text) => <Text strong>#{text}</Text>
        },
        {
            title: "Gói dịch vụ",
            dataIndex: "plan",
            key: "plan",
            render: (plan) => (
                <Tag color={getPlanTagColor(plan)} style={{ fontWeight: 600 }}>
                    {plan}
                </Tag>
            )
        },
        {
            title: "Số tiền",
            dataIndex: "price",
            key: "price",
            render: (price) => <Text style={{ color: "#4f46e5", fontWeight: 600 }}>{formatPrice(price)}</Text>
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={getStatusTagColor(status)}>
                    {getStatusText(status)}
                </Tag>
            )
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "startDate",
            key: "startDate",
            render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "---"
        },
        {
            title: "Ngày kết thúc",
            dataIndex: "endDate",
            key: "endDate",
            render: (date) => date ? new Date(date).toLocaleDateString("vi-VN") : "---"
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => date ? new Date(date).toLocaleString("vi-VN") : "---"
        }
    ];

    if (subLoading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải thông tin gói dịch vụ..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }}>
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    <CrownOutlined style={{ marginRight: 8, color: "#faad14" }} /> Quản lý Gói Đăng Ký
                </Title>
                <Text type="secondary">Nâng cấp gói dịch vụ để mở rộng quy mô chi nhánh, nhân sự và sử dụng trí tuệ nhân tạo AI nâng cao doanh thu.</Text>
            </div>

            {/* Current Active Plan Card */}
            <Card
                style={{
                    borderRadius: 20,
                    marginBottom: 32,
                    background: currentPlan === "ENTERPRISE"
                        ? "linear-gradient(135deg, #141414, #262626)"
                        : currentPlan === "PRO"
                            ? "linear-gradient(135deg, #096dd9, #1d39c4)"
                            : "linear-gradient(135deg, #595959, #8c8c8c)",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                    border: "none"
                }}
            >
                <Row align="middle" justify="space-between" gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        <Space direction="vertical" size={4}>
                            <Space align="center">
                                <Badge status={currentStatus === "ACTIVE" ? "processing" : "default"} />
                                <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                                    GÓI HIỆN TẠI
                                </Text>
                            </Space>
                            <Title level={1} style={{ margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                                Gói {currentPlan}
                                <Tag color={currentPlan === "ENTERPRISE" ? "gold" : currentPlan === "PRO" ? "blue" : "default"}>
                                    {getStatusText(currentStatus)}
                                </Tag>
                            </Title>
                            <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 15, marginTop: 8, display: "block" }}>
                                {currentPlan === "FREE" && "Hạn mức tối thiểu cho cơ sở nhỏ: 1 chi nhánh, tối đa 3 nhân sự."}
                                {currentPlan === "PRO" && "Đầy đủ tính năng phân tích nâng cao, 3 chi nhánh, tối đa 10 nhân sự."}
                                {currentPlan === "ENTERPRISE" && "Không giới hạn chi nhánh/nhân sự, tối ưu hóa doanh nghiệp bằng AI thông minh."}
                            </Text>
                            {subscription && (
                                <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13, marginTop: 12, display: "block" }}>
                                    Hiệu lực từ: <strong>{new Date(subscription.startDate).toLocaleDateString("vi-VN")}</strong> đến <strong>{new Date(subscription.endDate).toLocaleDateString("vi-VN")}</strong>
                                    {subscription.billingCycle && ` • Thanh toán: ${subscription.billingCycle}`}
                                </Text>
                            )}
                        </Space>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: "right" }}>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            {currentPlan !== "FREE" && (
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<CreditCardOutlined />}
                                    onClick={() => setManageModalOpen(true)}
                                    style={{
                                        borderRadius: 8,
                                        background: "rgba(255, 255, 255, 0.2)",
                                        borderColor: "rgba(255, 255, 255, 0.3)",
                                        color: "#fff",
                                        fontWeight: 600,
                                        width: "100%"
                                    }}
                                >
                                    Quản lý hóa đơn & Hủy gói
                                </Button>
                            )}
                            <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 12, display: "block" }}>
                                Cổng quản lý thanh toán bảo mật bởi Stripe
                            </Text>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Pricing Section Title */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <Title level={3}>Bảng Giá Dịch Vụ Nâng Cấp</Title>
                <Paragraph type="secondary">Lựa chọn gói dịch vụ phù hợp nhất để bứt phá hiệu quả kinh doanh cho Salon của bạn.</Paragraph>

                <Segmented
                    size="large"
                    options={[
                        { label: "Thanh toán Hàng Tháng", value: "MONTHLY" },
                        { label: "Thanh toán Hàng Năm (Tiết kiệm 20%)", value: "YEARLY" }
                    ]}
                    value={billingCycle}
                    onChange={setBillingCycle}
                    style={{ borderRadius: 10, marginTop: 12 }}
                />
            </div>

            {/* Pricing Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
                {/* FREE Plan Card */}
                <Col xs={24} md={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 16,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            border: currentPlan === "FREE" ? "2px solid #8c8c8c" : "1px solid #f0f0f0",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <Title level={4} style={{ color: "#8c8c8c", margin: 0 }}>Gói FREE</Title>
                            <div style={{ margin: "16px 0 24px" }}>
                                <Text strong style={{ fontSize: 32 }}>0 đ</Text>
                                <Text type="secondary"> / tháng</Text>
                            </div>
                            <Divider style={{ margin: "12px 0" }} />
                            <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 24 }}>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Tối đa <strong>1 chi nhánh</strong></Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Tối đa <strong>3 nhân viên</strong></Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Quản lý lịch hẹn & POS cơ bản</Text></div>
                                <div><LockOutlined style={{ color: "#bfbfbf", marginRight: 8 }} /> <Text type="secondary">Phân tích báo cáo nâng cao</Text></div>
                                <div><LockOutlined style={{ color: "#bfbfbf", marginRight: 8 }} /> <Text type="secondary">Tính năng thông minh AI</Text></div>
                            </Space>
                        </div>
                        <Button
                            disabled
                            size="large"
                            style={{ width: "100%", borderRadius: 8 }}
                        >
                            {currentPlan === "FREE" ? "Đang sử dụng" : "Mặc định"}
                        </Button>
                    </Card>
                </Col>

                {/* PRO Plan Card */}
                <Col xs={24} md={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 16,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            border: currentPlan === "PRO" ? "2px solid #1890ff" : "1px solid #f0f0f0",
                            boxShadow: "0 8px 25px rgba(24, 144, 255, 0.08)",
                            position: "relative"
                        }}
                    >
                        {currentPlan === "PRO" && (
                            <div style={{
                                position: "absolute",
                                top: -12,
                                right: 24,
                                background: "#1890ff",
                                color: "#fff",
                                padding: "4px 12px",
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: "bold"
                            }}>
                                Gói đang dùng
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <Space align="center" style={{ marginBottom: 4 }}>
                                <Title level={4} style={{ color: "#1890ff", margin: 0 }}>Gói PRO</Title>
                                <RocketOutlined style={{ color: "#1890ff" }} />
                            </Space>
                            <div style={{ margin: "16px 0 24px" }}>
                                <Text strong style={{ fontSize: 32 }}>
                                    {billingCycle === "MONTHLY" ? "499.000 đ" : "399.000 đ"}
                                </Text>
                                <Text type="secondary"> / tháng</Text>
                                {billingCycle === "YEARLY" && (
                                    <div style={{ marginTop: 4 }}><Tag color="green">Thanh toán theo năm: {formatPrice(4788000)} / năm</Tag></div>
                                )}
                            </div>
                            <Divider style={{ margin: "12px 0" }} />
                            <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 24 }}>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Tối đa <strong>3 chi nhánh</strong></Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Tối đa <strong>10 nhân viên</strong></Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Quản lý lịch hẹn & POS nâng cao</Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text strong style={{ color: "#1890ff" }}>Phân tích báo cáo chuyên sâu</Text></div>
                                <div><LockOutlined style={{ color: "#bfbfbf", marginRight: 8 }} /> <Text type="secondary">Tính năng thông minh AI</Text></div>
                            </Space>
                        </div>
                        {currentPlan === "FREE" ? (
                            <Button
                                type="primary"
                                size="large"
                                icon={<TransactionOutlined />}
                                onClick={() => handleOpenVietQrModal("PRO", billingCycle)}
                                style={{
                                    width: "100%",
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg, #1890ff, #096dd9)",
                                    border: "none",
                                    boxShadow: "0 4px 10px rgba(24, 144, 255, 0.2)"
                                }}
                            >
                                Nâng Cấp Lên PRO
                            </Button>
                        ) : currentPlan === "PRO" ? (
                            <Button
                                type="primary"
                                ghost
                                size="large"
                                onClick={() => setManageModalOpen(true)}
                                style={{ width: "100%", borderRadius: 8 }}
                            >
                                Quản lý thanh toán & Hủy gói
                            </Button>
                        ) : (
                            <Button
                                disabled
                                size="large"
                                style={{ width: "100%", borderRadius: 8 }}
                            >
                                Đã mở khóa ở gói cao hơn
                            </Button>
                        )}
                    </Card>
                </Col>

                {/* ENTERPRISE Plan Card */}
                <Col xs={24} md={8}>
                    <Card
                        hoverable
                        style={{
                            borderRadius: 16,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            border: currentPlan === "ENTERPRISE" ? "2px solid #faad14" : "1px solid #f0f0f0",
                            boxShadow: "0 8px 25px rgba(250, 173, 20, 0.08)"
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <Space align="center" style={{ marginBottom: 4 }}>
                                <Title level={4} style={{ color: "#faad14", margin: 0 }}>Gói ENTERPRISE</Title>
                                <CrownOutlined style={{ color: "#faad14" }} />
                            </Space>
                            <div style={{ margin: "16px 0 24px" }}>
                                <Text strong style={{ fontSize: 28 }}>Liên Hệ Admin</Text>
                                <Text type="secondary"> / Thỏa thuận ký kết</Text>
                            </div>
                            <Divider style={{ margin: "12px 0" }} />
                            <Space direction="vertical" size={12} style={{ width: "100%", marginBottom: 24 }}>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text><strong>Không giới hạn</strong> chi nhánh (999)</Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text><strong>Không giới hạn</strong> nhân viên (999)</Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text>Phân tích báo cáo chuyên sâu</Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text strong style={{ color: "#faad14" }}>AI No-Show Prediction</Text></div>
                                <div><CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} /> <Text strong style={{ color: "#faad14" }}>AI Smart Scheduling & Content Creator</Text></div>
                            </Space>
                        </div>
                        {currentPlan !== "ENTERPRISE" ? (
                            <Button
                                type="primary"
                                size="large"
                                icon={<PhoneOutlined />}
                                onClick={() => setContactModalOpen(true)}
                                style={{
                                    width: "100%",
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg, #faad14, #d48806)",
                                    border: "none",
                                    boxShadow: "0 4px 10px rgba(250, 173, 20, 0.2)"
                                }}
                            >
                                Liên Hệ Kích Hoạt
                            </Button>
                        ) : (
                            <Button
                                disabled
                                size="large"
                                style={{ width: "100%", borderRadius: 8 }}
                            >
                                Đang sử dụng
                            </Button>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* History Table Card */}
            <Card
                title={
                    <Space>
                        <TransactionOutlined style={{ color: "#4f46e5" }} />
                        <span>Lịch sử giao dịch & Đăng ký gói</span>
                    </Space>
                }
                style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}
            >
                <Table
                    columns={historyColumns}
                    dataSource={history}
                    rowKey="id"
                    loading={historyLoading}
                    pagination={{ pageSize: 5 }}
                    locale={{
                        emptyText: "Chưa có giao dịch nâng cấp nào."
                    }}
                />
            </Card>

            {/* Manage Subscription & Direct Cancellation Modal */}
            <Modal
                title={
                    <Space>
                        <CreditCardOutlined style={{ color: "#1890ff" }} />
                        <span>Quản Lý Hóa Đơn & Hủy Gói Dịch Vụ</span>
                    </Space>
                }
                open={manageModalOpen}
                onCancel={() => setManageModalOpen(false)}
                footer={null}
                centered
            >
                <div style={{ padding: "12px 0" }}>
                    <Alert
                        message={`Gói dịch vụ hiện tại: ${currentPlan}`}
                        description={`Hiệu lực: từ ${new Date(subscription?.startDate).toLocaleDateString("vi-VN")} đến ${new Date(subscription?.endDate).toLocaleDateString("vi-VN")}`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 20 }}
                    />

                    <Paragraph>
                        Bạn có thể hủy gói dịch vụ trực tiếp ngay trên ứng dụng để quay về gói FREE (Miễn phí).
                    </Paragraph>

                    <Button
                        type="primary"
                        danger
                        block
                        size="large"
                        onClick={async () => {
                            Modal.confirm({
                                title: "Xác nhận hủy gói dịch vụ?",
                                content: "Khi hủy gói, salon của bạn sẽ ngay lập tức trở về gói FREE mặc định.",
                                okText: "Hủy Gói Ngay",
                                okType: "danger",
                                cancelText: "Quay Lại",
                                onOk: async () => {
                                    const ok = await cancelSubscription();
                                    if (ok) {
                                        setManageModalOpen(false);
                                        refetchSubscription();
                                    }
                                }
                            });
                        }}
                    >
                        ❌ Hủy Gói Dịch Vụ Ngay (Trở về gói FREE)
                    </Button>
                </div>
            </Modal>

            {/* VietQR Payment Modal */}
            <Modal
                title="Thanh Toán Chuyển Khoản VietQR"
                open={vietQrModalOpen}
                onCancel={() => setVietQrModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setVietQrModalOpen(false)}>
                        Đóng
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        loading={confirmingBank}
                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                        onClick={async () => {
                            if (!vietQrData?.subId) return;
                            setConfirmingBank(true);
                            try {
                                await confirmSubscriptionBankTransferApi(vietQrData.subId);
                                message.success("Kích hoạt gói dịch vụ thành công!");
                                setVietQrModalOpen(false);
                                refetchSubscription();
                            } catch (err) {
                                message.error(err.response?.data?.message || "Kích hoạt thất bại. Vui lòng thử lại!");
                            } finally {
                                setConfirmingBank(false);
                            }
                        }}
                    >
                        Tôi Đã Chuyển Khoản Thành Công
                    </Button>
                ]}
                centered
                width={480}
            >
                {vietQrData && (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                        <div style={{
                            background: "#ffffff",
                            padding: 12,
                            borderRadius: 16,
                            display: "inline-block",
                            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                            border: "1px solid #f0f0f0"
                        }}>
                            <img
                                src={vietQrData.qrUrl}
                                alt="VietQR Payment Code"
                                style={{ width: "100%", maxWidth: 260, height: "auto", display: "block" }}
                            />
                            <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
                                <Tag color="blue" style={{ fontSize: 10, margin: 0, fontWeight: 600 }}>napas 247</Tag>
                                <Tag color="orange" style={{ fontSize: 10, margin: 0, fontWeight: 600 }}>VietQR</Tag>
                            </div>
                        </div>
                        <Text style={{ color: "#8c8c8c", fontSize: 12, display: "block", marginTop: 8 }}>
                            Sử dụng App Ngân hàng hoặc Ví điện tử để quét mã
                        </Text>

                        <div style={{ marginTop: 16, textAlign: "left", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                            <Row gutter={[8, 10]}>
                                <Col span={10}><Text type="secondary">Ngân hàng:</Text></Col>
                                <Col span={14}><Text strong>MB Bank (Ngân Hàng Quân Đội)</Text></Col>
                                <Col span={10}><Text type="secondary">Số tài khoản:</Text></Col>
                                <Col span={14}><Text strong copyable={{ text: vietQrData.accountNo }} style={{ color: "#1890ff", fontSize: 15 }}>{vietQrData.accountNo}</Text></Col>
                                <Col span={10}><Text type="secondary">Chủ tài khoản:</Text></Col>
                                <Col span={14}><Text strong>{vietQrData.accountName}</Text></Col>
                                <Col span={10}><Text type="secondary">Số tiền thanh toán:</Text></Col>
                                <Col span={14}><Text strong style={{ color: "#52c41a", fontSize: 18 }}>{formatPrice(vietQrData.amount)}</Text></Col>
                                <Col span={10}><Text type="secondary">Nội dung chuyển khoản:</Text></Col>
                                <Col span={14}><Text strong style={{ color: "#d46b08", fontSize: 16 }} copyable={{ text: vietQrData.content }}>{vietQrData.content}</Text></Col>
                            </Row>
                        </div>

                    </div>
                )}
            </Modal>

            {/* Contact Enterprise Modal */}
            <Modal
                title={
                    <Space>
                        <CrownOutlined style={{ color: "#faad14" }} />
                        <span>Đăng Ký Gói ENTERPRISE</span>
                    </Space>
                }
                open={contactModalOpen}
                onCancel={() => setContactModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setContactModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                centered
            >
                <div style={{ padding: "12px 0" }}>
                    <Paragraph>
                        Gói <strong>ENTERPRISE</strong> được thiết kế chuyên biệt cho các chuỗi salon lớn muốn ứng dụng trí tuệ nhân tạo (AI) vào việc vận hành và tự động dự đoán hành vi khách hàng.
                    </Paragraph>
                    <Paragraph strong>Quy trình kích hoạt:</Paragraph>
                    <ol style={{ paddingLeft: 20 }}>
                        <li>Liên hệ bộ phận Sales của SalonFlow qua Hotline: <strong>1900 8888</strong> hoặc Email: <strong>enterprise@salonflow.vn</strong>.</li>
                        <li>Đội ngũ kỹ thuật sẽ tư vấn, khảo sát nhu cầu tích hợp và ký kết hợp đồng.</li>
                        <li>Super Admin của hệ thống sẽ kích hoạt thủ công tài khoản Enterprise cho Salon của bạn ngay lập tức.</li>
                    </ol>
                    <div style={{ marginTop: 20, padding: 12, background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8 }}>
                        <Text type="warning" strong>Lưu ý:</Text> Với môi trường thử nghiệm, Admin có thể kích hoạt trực tiếp từ trang quản lý Salon của Super Admin.
                    </div>
                </div>
            </Modal>
        </div>
    );
}
