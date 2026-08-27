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
    PhoneOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { useSubscription } from "../hooks/useSubscription";
import {
    getSubscriptionHistoryApi,
    getActiveSubscriptionApi,
    createVietQrSubscriptionCheckoutApi,
    confirmSubscriptionBankTransferApi,
    getPublicSubscriptionPlansApi
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
    const [planConfigs, setPlanConfigs] = useState([]);

    useEffect(() => {
        getPublicSubscriptionPlansApi()
            .then(res => {
                const data = res?.data || res || [];
                if (Array.isArray(data) && data.length > 0) setPlanConfigs(data);
            })
            .catch(err => console.error("Lỗi lấy cấu hình gói:", err));
    }, []);

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
                const entPrice = planConfigs.find(c => c.plan === "ENTERPRISE");
                const proPrice = planConfigs.find(c => c.plan === "PRO");
                let amount = res.price;
                if (!amount) {
                    if (plan === "ENTERPRISE") {
                        amount = cycle === "YEARLY" ? (entPrice?.yearlyPrice || 9990000) : (entPrice?.monthlyPrice || 999000);
                    } else {
                        amount = cycle === "YEARLY" ? (proPrice?.yearlyPrice || 4788000) : (proPrice?.monthlyPrice || 499000);
                    }
                }
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
    const calculateSavePercent = (monthly, yearly) => {
        if (!monthly || !yearly || monthly <= 0 || yearly <= 0) return 0;
        const fullYear = monthly * 12;
        if (fullYear <= yearly) return 0;
        return Math.round(((fullYear - yearly) / fullYear) * 100);
    };

    const maxSavePercent = Math.max(
        calculateSavePercent(
            planConfigs.find(c => c.plan === "PRO")?.monthlyPrice,
            planConfigs.find(c => c.plan === "PRO")?.yearlyPrice
        ),
        calculateSavePercent(
            planConfigs.find(c => c.plan === "ENTERPRISE")?.monthlyPrice,
            planConfigs.find(c => c.plan === "ENTERPRISE")?.yearlyPrice
        )
    );

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }}>
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>
                    <CrownOutlined style={{ marginRight: 8, color: "#faad14" }} /> Quản lý Gói Đăng Ký
                </Title>
                <Text type="secondary">Nâng cấp gói dịch vụ để mở rộng quy mô chi nhánh, nhân sự và sử dụng trí tuệ nhân tạo AI nâng cao doanh thu.</Text>
            </div>

            {/* Current Active Subscription Banner */}
            <Card
                style={{
                    borderRadius: 20,
                    marginBottom: 32,
                    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)",
                    border: "none"
                }}
                bodyStyle={{ padding: "28px 32px" }}
            >
                <Row align="middle" justify="space-between" gutter={[24, 20]}>
                    {/* Left Column: Plan Title & Description */}
                    <Col xs={24} md={14}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Badge status={currentStatus === "ACTIVE" ? "processing" : "default"} />
                                <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>
                                    GÓI DỊCH VỤ ĐANG SỬ DỤNG
                                </Text>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                <Title level={2} style={{ margin: 0, color: "#ffffff", fontWeight: 800 }}>
                                    Gói {currentPlan}
                                </Title>
                                <Tag color={currentPlan === "ENTERPRISE" ? "gold" : currentPlan === "PRO" ? "cyan" : "default"} style={{ fontSize: 12, padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>
                                    {getStatusText(currentStatus)}
                                </Tag>
                            </div>

                            <Text style={{ color: "rgba(255, 255, 255, 0.95)", fontSize: 14, lineHeight: "1.6" }}>
                                {currentPlan === "FREE" && "Hạn mức tối thiểu cho cơ sở nhỏ: 1 chi nhánh, tối đa 3 nhân sự."}
                                {currentPlan === "PRO" && "Đầy đủ tính năng phân tích nâng cao, 3 chi nhánh, tối đa 10 nhân sự."}
                                {currentPlan === "ENTERPRISE" && "Không giới hạn chi nhánh/nhân sự, tối ưu hóa doanh nghiệp bằng AI thông minh."}
                            </Text>
                        </div>
                    </Col>

                    {/* Right Column: Glass Card with Validity & Billing Info */}
                    {subscription && (
                        <Col xs={24} md={10}>
                            <div style={{
                                background: "rgba(255, 255, 255, 0.12)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: 14,
                                padding: "16px 20px",
                                backdropFilter: "blur(8px)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 13 }}>
                                        Thời gian hiệu lực:
                                    </Text>
                                    <Text strong style={{ color: "#ffffff", fontSize: 13 }}>
                                        {new Date(subscription.startDate).toLocaleDateString("vi-VN")} - {new Date(subscription.endDate).toLocaleDateString("vi-VN")}
                                    </Text>
                                </div>

                                {subscription.billingCycle && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Text style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 13 }}>
                                            Hình thức thanh toán:
                                        </Text>
                                        <Text strong style={{ color: "#ffffff", fontSize: 13 }}>
                                            {subscription.billingCycle === "YEARLY" ? "Hàng Năm" : "Hàng Tháng"}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </Col>
                    )}
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
                        { label: "Thanh toán Hàng Năm", value: "YEARLY" }
                    ]}
                    value={billingCycle}
                    onChange={setBillingCycle}
                    style={{ borderRadius: 12, padding: 4, background: "#f1f5f9" }}
                />
            </div>

            {/* Pricing Cards */}
            <Row gutter={[24, 24]} align="stretch" style={{ marginBottom: 48, display: "flex" }}>
                {/* FREE Plan Card */}
                {(() => {
                    const freeConf = planConfigs.find(c => c.plan === "FREE") || { maxBranches: 1, maxStaffPerBranch: 3, monthlyPrice: 0, yearlyPrice: 0 };
                    const badgeStr = freeConf.badgeText || (currentPlan === "FREE" ? "Gói đang dùng" : null);
                    return (
                        <Col xs={24} md={8} style={{ display: "flex" }}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: 20,
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: currentPlan === "FREE" ? "2px solid #94a3b8" : "1px solid #e2e8f0",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                bodyStyle={{ padding: 28, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                            >
                                {badgeStr && (
                                    <div style={{
                                        position: "absolute",
                                        top: 16,
                                        right: 20,
                                        background: "#64748b",
                                        color: "#fff",
                                        padding: "3px 12px",
                                        borderRadius: 12,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        letterSpacing: 0.3
                                    }}>
                                        {badgeStr}
                                    </div>
                                )}
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <Space align="center" style={{ marginBottom: 6 }}>
                                        <SafetyCertificateOutlined style={{ fontSize: 22, color: "#64748b" }} />
                                        <Title level={4} style={{ color: "#334155", margin: 0, fontWeight: 800 }}>Gói FREE</Title>
                                    </Space>
                                    <Text style={{ color: "#64748b", fontSize: 12.5 }}>Gói cơ bản phù hợp mô hình mới bắt đầu</Text>

                                    <div style={{ margin: "20px 0 20px", minHeight: 76, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                            <Text strong style={{ fontSize: 34, color: "#0f172a", fontWeight: 800, letterSpacing: -0.5 }}>0 đ</Text>
                                            <Text style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>/ tháng</Text>
                                        </div>
                                        <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Miễn phí vĩnh viễn</Text>
                                    </div>

                                    <Divider style={{ margin: "8px 0 20px" }} />

                                    <Space direction="vertical" size={14} style={{ width: "100%", marginBottom: 24, flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Tối đa <strong style={{ color: "#0f172a" }}>{freeConf.maxBranches} chi nhánh</strong></Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Tối đa <strong style={{ color: "#0f172a" }}>{freeConf.maxStaffPerBranch} nhân viên</strong></Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Quản lý lịch hẹn & POS cơ bản</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <LockOutlined style={{ color: "#cbd5e1", fontSize: 16 }} />
                                            <Text style={{ color: "#94a3b8", fontSize: 13.5 }}>Phân tích báo cáo nâng cao</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <LockOutlined style={{ color: "#cbd5e1", fontSize: 16 }} />
                                            <Text style={{ color: "#94a3b8", fontSize: 13.5 }}>Tính năng thông minh AI</Text>
                                        </div>
                                    </Space>
                                </div>
                                <Button
                                    disabled
                                    size="large"
                                    style={{
                                        width: "100%",
                                        borderRadius: 10,
                                        height: 46,
                                        marginTop: "auto",
                                        background: "#f1f5f9",
                                        color: "#64748b",
                                        fontWeight: 700,
                                        border: "1px solid #e2e8f0"
                                    }}
                                >
                                    {currentPlan === "FREE" ? "Đang sử dụng" : "Mặc định"}
                                </Button>
                            </Card>
                        </Col>
                    );
                })()}

                {/* PRO Plan Card */}
                {(() => {
                    const proConf = planConfigs.find(c => c.plan === "PRO") || { maxBranches: 3, maxStaffPerBranch: 10, monthlyPrice: 499000, yearlyPrice: 4788000 };
                    const badgeStr = proConf.badgeText || (currentPlan === "PRO" ? "Gói đang dùng" : "Phổ biến");
                    const savePct = calculateSavePercent(proConf.monthlyPrice, proConf.yearlyPrice);
                    return (
                        <Col xs={24} md={8} style={{ display: "flex" }}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: 20,
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: currentPlan === "PRO" ? "2px solid #2563eb" : "1.5px solid #3b82f6",
                                    boxShadow: "0 10px 30px rgba(37, 99, 235, 0.12)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                bodyStyle={{ padding: 28, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                            >
                                {badgeStr && (
                                    <div style={{
                                        position: "absolute",
                                        top: 16,
                                        right: 20,
                                        background: currentPlan === "PRO" ? "linear-gradient(135deg, #475569, #334155)" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                        color: "#fff",
                                        padding: "3px 14px",
                                        borderRadius: 12,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        letterSpacing: 0.3,
                                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                                    }}>
                                        {badgeStr}
                                    </div>
                                )}
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <Space align="center" style={{ marginBottom: 6 }}>
                                        <RocketOutlined style={{ fontSize: 22, color: "#2563eb" }} />
                                        <Title level={4} style={{ color: "#2563eb", margin: 0, fontWeight: 800 }}>Gói PRO</Title>
                                    </Space>
                                    <Text style={{ color: "#64748b", fontSize: 12.5 }}>Giải pháp tối ưu cho Salon tăng trưởng nhanh</Text>

                                    <div style={{ margin: "20px 0 20px", minHeight: 76, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        {billingCycle === "YEARLY" && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                <Text delete style={{ fontSize: 15, color: "#94a3b8", fontWeight: 600 }}>
                                                    {formatPrice(proConf.monthlyPrice)}
                                                </Text>
                                                {savePct > 0 && (
                                                    <Tag color="cyan" style={{ borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", padding: "0 6px" }}>
                                                        Tiết kiệm {savePct}%
                                                    </Tag>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                            <Text strong style={{ fontSize: 34, color: "#2563eb", fontWeight: 800, letterSpacing: -0.5 }}>
                                                {billingCycle === "MONTHLY"
                                                    ? formatPrice(proConf.monthlyPrice)
                                                    : formatPrice(Math.round((proConf.yearlyPrice || 4788000) / 12))
                                                }
                                            </Text>
                                            <Text style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>/ tháng</Text>
                                        </div>
                                        <Text style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 4 }}>
                                            {billingCycle === "YEARLY" ? `Thanh toán hàng năm: ${formatPrice(proConf.yearlyPrice)} / năm` : "Thanh toán linh hoạt từng tháng"}
                                        </Text>
                                    </div>

                                    <Divider style={{ margin: "8px 0 20px" }} />

                                    <Space direction="vertical" size={14} style={{ width: "100%", marginBottom: 24, flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Tối đa <strong style={{ color: "#0f172a" }}>{proConf.maxBranches} chi nhánh</strong></Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Tối đa <strong style={{ color: "#0f172a" }}>{proConf.maxStaffPerBranch} nhân viên</strong></Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Quản lý lịch hẹn & POS nâng cao</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                                            <Text style={{ color: "#2563eb", fontSize: 13.5, fontWeight: 700 }}>Phân tích báo cáo chuyên sâu</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <LockOutlined style={{ color: "#cbd5e1", fontSize: 16 }} />
                                            <Text style={{ color: "#94a3b8", fontSize: 13.5 }}>Tính năng thông minh AI</Text>
                                        </div>
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
                                            borderRadius: 10,
                                            height: 46,
                                            marginTop: "auto",
                                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                            border: "none",
                                            fontWeight: 700,
                                            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)"
                                        }}
                                    >
                                        Nâng Cấp Lên PRO
                                    </Button>
                                ) : currentPlan === "PRO" ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ReloadOutlined />}
                                        onClick={() => handleOpenVietQrModal("PRO", billingCycle)}
                                        style={{
                                            width: "100%",
                                            borderRadius: 10,
                                            height: 46,
                                            marginTop: "auto",
                                            fontWeight: 700,
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            border: "none",
                                            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)"
                                        }}
                                    >
                                        Gia Hạn Gói PRO
                                    </Button>
                                ) : (
                                    <Button
                                        disabled
                                        size="large"
                                        style={{ width: "100%", borderRadius: 10, height: 46, marginTop: "auto", fontWeight: 700 }}
                                    >
                                        Đã mở khóa ở gói cao hơn
                                    </Button>
                                )}
                            </Card>
                        </Col>
                    );
                })()}

                {/* ENTERPRISE Plan Card */}
                {(() => {
                    const entConf = planConfigs.find(c => c.plan === "ENTERPRISE") || { maxBranches: 999, maxStaffPerBranch: 999, monthlyPrice: 999000, yearlyPrice: 9990000 };
                    const badgeStr = entConf.badgeText || (currentPlan === "ENTERPRISE" ? "Gói đang dùng" : "Cao cấp");
                    const savePct = calculateSavePercent(entConf.monthlyPrice, entConf.yearlyPrice);
                    return (
                        <Col xs={24} md={8} style={{ display: "flex" }}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: 20,
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    border: currentPlan === "ENTERPRISE" ? "2px solid #d97706" : "1.5px solid #f59e0b",
                                    boxShadow: "0 10px 30px rgba(245, 158, 11, 0.12)",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                                bodyStyle={{ padding: 28, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                            >
                                {badgeStr && (
                                    <div style={{
                                        position: "absolute",
                                        top: 16,
                                        right: 20,
                                        background: currentPlan === "ENTERPRISE" ? "linear-gradient(135deg, #475569, #334155)" : "linear-gradient(135deg, #f59e0b, #d97706)",
                                        color: "#fff",
                                        padding: "3px 14px",
                                        borderRadius: 12,
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        letterSpacing: 0.3,
                                        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)"
                                    }}>
                                        {badgeStr}
                                    </div>
                                )}
                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                    <Space align="center" style={{ marginBottom: 6 }}>
                                        <CrownOutlined style={{ fontSize: 22, color: "#d97706" }} />
                                        <Title level={4} style={{ color: "#d97706", margin: 0, fontWeight: 800 }}>Gói ENTERPRISE</Title>
                                    </Space>
                                    <Text style={{ color: "#64748b", fontSize: 12.5 }}>Giải pháp toàn diện không giới hạn cho chuỗi lớn</Text>

                                    <div style={{ margin: "20px 0 20px", minHeight: 76, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                        {entConf.monthlyPrice > 0 ? (
                                            <>
                                                {billingCycle === "YEARLY" && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                                        <Text delete style={{ fontSize: 15, color: "#94a3b8", fontWeight: 600 }}>
                                                            {formatPrice(entConf.monthlyPrice)}
                                                        </Text>
                                                        {savePct > 0 && (
                                                            <Tag color="gold" style={{ borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", padding: "0 6px" }}>
                                                                Tiết kiệm {savePct}%
                                                            </Tag>
                                                        )}
                                                    </div>
                                                )}
                                                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                                    <Text strong style={{ fontSize: 34, color: "#d97706", fontWeight: 800, letterSpacing: -0.5 }}>
                                                        {billingCycle === "MONTHLY"
                                                            ? formatPrice(entConf.monthlyPrice)
                                                            : formatPrice(Math.round(entConf.yearlyPrice / 12))
                                                        }
                                                    </Text>
                                                    <Text style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>/ tháng</Text>
                                                </div>
                                                <Text style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginTop: 4 }}>
                                                    {billingCycle === "YEARLY" ? `Thanh toán theo năm: ${formatPrice(entConf.yearlyPrice)} / năm` : "Thanh toán linh hoạt từng tháng"}
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <Text strong style={{ fontSize: 28, color: "#0f172a" }}>Liên Hệ Admin</Text>
                                                <Text style={{ color: "#64748b", fontSize: 13 }}>Thỏa thuận ký kết riêng</Text>
                                            </>
                                        )}
                                    </div>

                                    <Divider style={{ margin: "8px 0 20px" }} />

                                    <Space direction="vertical" size={14} style={{ width: "100%", marginBottom: 24, flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}><strong style={{ color: "#0f172a" }}>Không giới hạn</strong> chi nhánh ({entConf.maxBranches})</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}><strong style={{ color: "#0f172a" }}>Không giới hạn</strong> nhân viên ({entConf.maxStaffPerBranch})</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Quản lý lịch hẹn & POS nâng cao</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <Text style={{ color: "#334155", fontSize: 13.5 }}>Phân tích báo cáo chuyên sâu</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#d97706", fontSize: 16 }} />
                                            <Text style={{ color: "#d97706", fontSize: 13.5, fontWeight: 700 }}>AI No-Show Prediction</Text>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CheckCircleOutlined style={{ color: "#d97706", fontSize: 16 }} />
                                            <Text style={{ color: "#d97706", fontSize: 13.5, fontWeight: 700 }}>AI Smart Scheduling & Content Creator</Text>
                                        </div>
                                    </Space>
                                </div>
                                {currentPlan !== "ENTERPRISE" ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<TransactionOutlined />}
                                        onClick={() => handleOpenVietQrModal("ENTERPRISE", billingCycle)}
                                        style={{
                                            width: "100%",
                                            borderRadius: 10,
                                            height: 46,
                                            marginTop: "auto",
                                            background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                                            border: "none",
                                            fontWeight: 700,
                                            boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)"
                                        }}
                                    >
                                        Nâng Cấp Lên ENTERPRISE
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ReloadOutlined />}
                                        onClick={() => handleOpenVietQrModal("ENTERPRISE", billingCycle)}
                                        style={{
                                            width: "100%",
                                            borderRadius: 10,
                                            height: 46,
                                            marginTop: "auto",
                                            fontWeight: 700,
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            border: "none",
                                            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)"
                                        }}
                                    >
                                        Gia Hạn Gói ENTERPRISE
                                    </Button>
                                )}
                            </Card>
                        </Col>
                    );
                })()}
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


            {/* VietQR Payment Modal */}
            <Modal
                title={
                    <Space>
                        <QrcodeOutlined style={{ color: "#2563eb" }} />
                        <span>Thanh Toán Chuyển Khoản VietQR</span>
                    </Space>
                }
                open={vietQrModalOpen}
                onCancel={() => setVietQrModalOpen(false)}
                footer={null}
                centered
                width={760}
            >
                {vietQrData && (
                    <div style={{ padding: "16px 0" }}>
                        <Row gutter={[24, 24]} align="middle">
                            {/* Column 1: QR Code Image */}
                            <Col xs={24} md={10} style={{ textAlign: "center" }}>
                                <div style={{
                                    background: "#ffffff",
                                    padding: 14,
                                    borderRadius: 16,
                                    display: "inline-block",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                                    border: "1px solid #f1f5f9"
                                }}>
                                    <img
                                        src={vietQrData.qrUrl}
                                        alt="VietQR Payment Code"
                                        style={{ width: "100%", maxWidth: 240, height: "auto", display: "block", borderRadius: 8 }}
                                    />
                                    <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
                                        <Tag color="blue" style={{ fontSize: 10, margin: 0, fontWeight: 600, borderRadius: 6 }}>napas 247</Tag>
                                        <Tag color="orange" style={{ fontSize: 10, margin: 0, fontWeight: 600, borderRadius: 6 }}>VietQR</Tag>
                                    </div>
                                </div>
                                <Text style={{ color: "#64748b", fontSize: 12, display: "block", marginTop: 10 }}>
                                    Sử dụng App Ngân hàng hoặc Ví điện tử để quét mã
                                </Text>
                            </Col>

                            {/* Column 2: Bank Account Info & Details */}
                            <Col xs={24} md={14}>
                                <div style={{ background: "#f8fafc", padding: "18px 20px", borderRadius: 14, border: "1px solid #e2e8f0" }}>
                                    <Row gutter={[8, 12]}>
                                        <Col span={9}><Text style={{ color: "#64748b", fontSize: 13 }}>Ngân hàng:</Text></Col>
                                        <Col span={15}><Text strong style={{ color: "#0f172a", fontSize: 13.5 }}>MB Bank (Ngân Hàng Quân Đội)</Text></Col>
                                        
                                        <Col span={9}><Text style={{ color: "#64748b", fontSize: 13 }}>Số tài khoản:</Text></Col>
                                        <Col span={15}><Text strong copyable={{ text: vietQrData.accountNo }} style={{ color: "#2563eb", fontSize: 15 }}>{vietQrData.accountNo}</Text></Col>
                                        
                                        <Col span={9}><Text style={{ color: "#64748b", fontSize: 13 }}>Chủ tài khoản:</Text></Col>
                                        <Col span={15}><Text strong style={{ color: "#0f172a", fontSize: 13.5 }}>{vietQrData.accountName}</Text></Col>
                                        
                                        <Col span={9}><Text style={{ color: "#64748b", fontSize: 13 }}>Số tiền thanh toán:</Text></Col>
                                        <Col span={15}><Text strong style={{ color: "#10b981", fontSize: 18, fontWeight: 800 }}>{formatPrice(vietQrData.amount)}</Text></Col>
                                        
                                        <Col span={9}><Text style={{ color: "#64748b", fontSize: 13 }}>Nội dung chuyển khoản:</Text></Col>
                                        <Col span={15}><Text strong style={{ color: "#d97706", fontSize: 16, fontWeight: 700 }} copyable={{ text: vietQrData.content }}>{vietQrData.content}</Text></Col>
                                    </Row>
                                </div>

                                <Alert
                                    message="Chính sách hoàn tiền: Gói dịch vụ được kích hoạt tự động ngay sau khi chuyển khoản. SalonFlow áp dụng chính sách hoàn tiền 100% trong vòng 7 ngày đầu nếu dịch vụ phát sinh sự cố kỹ thuật hoặc không đáp ứng nhu cầu sử dụng."
                                    type="info"
                                    showIcon
                                    style={{ marginTop: 14, fontSize: 12, borderRadius: 10 }}
                                />
                            </Col>
                        </Row>
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
