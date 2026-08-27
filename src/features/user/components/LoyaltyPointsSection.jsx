import React, { useEffect, useState } from "react";
import {
    Card,
    Typography,
    Row,
    Col,
    Button,
    Tag,
    Table,
    Modal,
    InputNumber,
    Space,
    Statistic,
    message,
    Divider,
    Tabs,
    Tooltip,
    Alert
} from "antd";
import {
    TrophyOutlined,
    GiftOutlined,
    HistoryOutlined,
    ClockCircleOutlined,
    CopyOutlined,
    CheckCircleOutlined,
    SwapRightOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";
import { getLoyaltySummaryApi, getLoyaltyHistoryApi, redeemPointsApi } from "../api/loyaltyApi";

const { Title, Text, Paragraph } = Typography;

export default function LoyaltyPointsSection({ userId }) {
    const [summary, setSummary] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Modal Đổi điểm
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(100);
    const [redeeming, setRedeeming] = useState(false);
    const [redeemResult, setRedeemResult] = useState(null);

    // Active Tab cho Lịch sử
    const [activeTab, setActiveTab] = useState("ALL");

    const fetchData = async () => {
        try {
            setLoadingSummary(true);
            const summaryData = await getLoyaltySummaryApi(userId);
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to load loyalty summary", error);
        } finally {
            setLoadingSummary(false);
        }

        try {
            setLoadingHistory(true);
            const historyData = await getLoyaltyHistoryApi(userId);
            setHistory(historyData);
        } catch (error) {
            console.error("Failed to load loyalty history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleRedeem = async () => {
        if (!pointsToRedeem || pointsToRedeem < 100 || pointsToRedeem % 100 !== 0) {
            message.error("Số điểm quy đổi phải là bội số của 100 (tối thiểu 100 điểm).");
            return;
        }

        if (summary && summary.activePoints < pointsToRedeem) {
            message.error("Số điểm tích lũy của bạn không đủ.");
            return;
        }

        try {
            setRedeeming(true);
            const result = await redeemPointsApi(pointsToRedeem);
            setRedeemResult(result);
            message.success(result.message || "Đổi voucher thành công!");
            // Refresh data
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Đổi điểm thất bại";
            message.error(errorMsg);
        } finally {
            setRedeeming(false);
        }
    };

    const copyVoucherCode = (code) => {
        navigator.clipboard.writeText(code);
        message.success("Đã sao chép mã voucher!");
    };

    // Filter History according to tab
    const filteredHistory = history.filter((item) => {
        if (activeTab === "EARN") return item.transactionType === "EARN";
        if (activeTab === "REDEEM") return item.transactionType === "REDEEM";
        if (activeTab === "EXPIRED") return item.transactionType === "EXPIRED" || item.isExpired;
        return true;
    });

    const columns = [
        {
            title: "Thời gian",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 170,
            render: (text) => (text ? new Date(text).toLocaleString("vi-VN") : "---")
        },
        {
            title: "Loại giao dịch",
            dataIndex: "transactionType",
            key: "transactionType",
            width: 140,
            render: (type, record) => {
                if (type === "EARN") {
                    return record.isExpired ? (
                        <Tag color="default" icon={<ClockCircleOutlined />}>Đã hết hạn</Tag>
                    ) : (
                        <Tag color="success" icon={<TrophyOutlined />}>Tích điểm</Tag>
                    );
                }
                if (type === "REDEEM") {
                    return <Tag color="warning" icon={<GiftOutlined />}>Đổi Voucher</Tag>;
                }
                return <Tag color="error">Hết hạn</Tag>;
            }
        },
        {
            title: "Số điểm",
            dataIndex: "points",
            key: "points",
            width: 120,
            render: (points, record) => {
                const isEarn = record.transactionType === "EARN";
                return (
                    <Text
                        strong
                        style={{
                            color: isEarn ? (record.isExpired ? "#8c8c8c" : "#52c41a") : "#f5222d",
                            fontSize: 15
                        }}
                    >
                        {isEarn ? `+${points}` : `-${points}`}
                    </Text>
                );
            }
        },
        {
            title: "Mô tả / Mã tham chiếu",
            dataIndex: "description",
            key: "description",
            render: (text, record) => (
                <div>
                    <div>{text || "Giao dịch điểm thưởng"}</div>
                    {record.referenceId && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Mã: {record.referenceId}
                        </Text>
                    )}
                </div>
            )
        },
        {
            title: "Hạn sử dụng",
            dataIndex: "expiresAt",
            key: "expiresAt",
            width: 160,
            render: (expiresAt, record) => {
                if (record.transactionType !== "EARN" || !expiresAt) return "---";
                const expDate = new Date(expiresAt).toLocaleDateString("vi-VN");
                return record.isExpired ? (
                    <Text type="secondary" delete>{expDate}</Text>
                ) : (
                    <Tooltip title="Điểm hết hạn sau 1 năm từ ngày tích">
                        <Text type="secondary">{expDate}</Text>
                    </Tooltip>
                );
            }
        }
    ];

    return (
        <div style={{ marginTop: 24 }}>
            {/* Banner Điểm Tích Lũy */}
            <Card
                loading={loadingSummary}
                style={{
                    borderRadius: 20,
                    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4a00e0 100%)",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(42, 82, 152, 0.3)",
                    border: "none",
                    overflow: "hidden",
                    position: "relative"
                }}
                bodyStyle={{ padding: "24px 32px" }}
            >
                <Row align="middle" justify="space-between" gutter={[16, 16]}>
                    <Col xs={24} md={14}>
                        <Space direction="vertical" size={8}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <TrophyOutlined style={{ fontSize: 28, color: "#ffd700" }} />
                                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                                    Hệ thống Điểm Thưởng SalonFlow
                                </Title>
                            </div>
                            <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 14 }}>
                                Tích điểm sau mỗi dịch vụ hoàn thành & Đổi voucher giảm giá hấp dẫn!
                            </Text>

                            <Space wrap style={{ marginTop: 8 }}>
                                <Tag color="gold" style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}>
                                    ✨ 1.000 VNĐ = 1 điểm
                                </Tag>
                                <Tag color="cyan" style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}>
                                    🎟️ 100 điểm = 10.000 VNĐ voucher
                                </Tag>
                                <Tag color="blue" style={{ borderRadius: 12, padding: "2px 10px" }}>
                                    ⏳ Hạn dùng 1 năm
                                </Tag>
                            </Space>
                        </Space>
                    </Col>

                    <Col xs={24} md={10} style={{ textAlign: "right" }}>
                        <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", padding: "16px 24px", borderRadius: 16, display: "inline-block", width: "100%", maxWidth: 300 }}>
                            <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Điểm tích lũy hiện có</span>}
                                value={summary?.activePoints || 0}
                                valueStyle={{ color: "#ffd700", fontWeight: 700, fontSize: 36 }}
                                prefix={<TrophyOutlined />}
                                suffix="điểm"
                            />
                            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.9)", fontSize: 13 }}>
                                ≈ {summary?.equivalentVoucherValue?.toLocaleString("vi-VN") || 0} VNĐ voucher
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                icon={<GiftOutlined />}
                                style={{
                                    marginTop: 16,
                                    width: "100%",
                                    borderRadius: 12,
                                    background: "#ffd700",
                                    color: "#1e3c72",
                                    borderColor: "#ffd700",
                                    fontWeight: 700,
                                    boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)"
                                }}
                                onClick={() => {
                                    setRedeemResult(null);
                                    setPointsToRedeem(100);
                                    setIsRedeemModalOpen(true);
                                }}
                                disabled={!summary || summary.activePoints < 100}
                            >
                                Đổi điểm lấy Voucher
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Note về quy định điểm */}

            {/* Lịch sử giao dịch điểm */}
            <Card
                title={
                    <Space>
                        <HistoryOutlined style={{ color: "#1677ff" }} />
                        <span>Lịch sử giao dịch điểm</span>
                    </Space>
                }
                style={{ marginTop: 20, borderRadius: 16 }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        { key: "ALL", label: `Tất cả (${history.length})` },
                        { key: "EARN", label: `Tích điểm (${history.filter(i => i.transactionType === "EARN").length})` },
                        { key: "REDEEM", label: `Đổi voucher (${history.filter(i => i.transactionType === "REDEEM").length})` },
                        { key: "EXPIRED", label: `Đã hết hạn (${history.filter(i => i.isExpired || i.transactionType === "EXPIRED").length})` }
                    ]}
                />

                <Table
                    columns={columns}
                    dataSource={filteredHistory}
                    rowKey="id"
                    loading={loadingHistory}
                    pagination={{ pageSize: 5, showSizeChanger: false }}
                    locale={{ emptyText: "Chưa có lịch sử giao dịch điểm." }}
                />
            </Card>

            {/* Modal Quy đổi Voucher */}
            <Modal
                title={
                    <Space>
                        <GiftOutlined style={{ color: "#1677ff", fontSize: 20 }} />
                        <span>Đổi điểm lấy Voucher giảm giá</span>
                    </Space>
                }
                open={isRedeemModalOpen}
                onCancel={() => setIsRedeemModalOpen(false)}
                footer={null}
                borderRadius={16}
                centered
            >
                {redeemResult ? (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <CheckCircleOutlined style={{ fontSize: 56, color: "#52c41a" }} />
                        <Title level={4} style={{ marginTop: 12, color: "#52c41a" }}>
                            Đổi Voucher Thành Công!
                        </Title>
                        <Text type="secondary">Mã voucher của bạn đã được khởi tạo:</Text>

                        <div
                            style={{
                                background: "#f6ffed",
                                border: "2px dashed #b7eb8f",
                                borderRadius: 12,
                                padding: "16px",
                                margin: "20px 0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 12
                            }}
                        >
                            <Text strong style={{ fontSize: 22, color: "#389e0d", letterSpacing: 1 }}>
                                {redeemResult.voucherCode}
                            </Text>
                            <Button
                                type="primary"
                                ghost
                                icon={<CopyOutlined />}
                                onClick={() => copyVoucherCode(redeemResult.voucherCode)}
                            >
                                Sao chép
                            </Button>
                        </div>

                        <Paragraph style={{ fontSize: 14 }}>
                            Giá trị Voucher: <strong>{redeemResult.discountValue?.toLocaleString("vi-VN")} VNĐ</strong>
                            <br />
                            Số điểm còn lại: <strong>{redeemResult.remainingPoints} điểm</strong>
                        </Paragraph>

                        <Button type="primary" size="large" onClick={() => setIsRedeemModalOpen(false)} style={{ width: "100%", borderRadius: 10 }}>
                            Hoàn tất
                        </Button>
                    </div>
                ) : (
                    <div style={{ padding: "8px 0" }}>
                        <Alert
                            message={`Số điểm hiện có: ${summary?.activePoints || 0} điểm`}
                            type="warning"
                            showIcon
                            style={{ marginBottom: 20, borderRadius: 10 }}
                        />

                        <Paragraph style={{ marginBottom: 12 }}>
                            Chọn hoặc nhập số điểm bạn muốn đổi (Bội số của 100 điểm):
                        </Paragraph>

                        {/* Presets */}
                        <Space wrap style={{ marginBottom: 16 }}>
                            {[100, 200, 500, 1000].map((preset) => (
                                <Button
                                    key={preset}
                                    type={pointsToRedeem === preset ? "primary" : "default"}
                                    onClick={() => setPointsToRedeem(preset)}
                                    disabled={(summary?.activePoints || 0) < preset}
                                    style={{ borderRadius: 8 }}
                                >
                                    {preset} điểm ({ (preset / 100 * 10000).toLocaleString("vi-VN") }đ)
                                </Button>
                            ))}
                        </Space>

                        <div style={{ marginTop: 12, marginBottom: 20 }}>
                            <Text strong style={{ display: "block", marginBottom: 6 }}>
                                Số điểm đổi:
                            </Text>
                            <InputNumber
                                min={100}
                                max={summary?.activePoints || 100}
                                step={100}
                                value={pointsToRedeem}
                                onChange={(val) => setPointsToRedeem(val || 100)}
                                style={{ width: "100%", borderRadius: 8 }}
                                size="large"
                            />
                        </div>

                        {/* Calculation summary */}
                        <Card style={{ background: "#fafafa", borderRadius: 12, marginBottom: 20 }} size="small">
                            <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                                <Text type="secondary">Điểm quy đổi:</Text>
                                <Text strong>{pointsToRedeem} điểm</Text>
                            </Row>
                            <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                                <Text type="secondary">Giá trị Voucher nhận được:</Text>
                                <Text strong style={{ color: "#1677ff", fontSize: 16 }}>
                                    {((pointsToRedeem / 100) * 10000).toLocaleString("vi-VN")} VNĐ
                                </Text>
                            </Row>
                            <Divider style={{ margin: "8px 0" }} />
                            <Row justify="space-between" align="middle">
                                <Text type="secondary">Số điểm còn lại:</Text>
                                <Text strong>{Math.max(0, (summary?.activePoints || 0) - pointsToRedeem)} điểm</Text>
                            </Row>
                        </Card>

                        <Button
                            type="primary"
                            size="large"
                            loading={redeeming}
                            onClick={handleRedeem}
                            style={{ width: "100%", borderRadius: 10, background: "#1677ff" }}
                        >
                            Xác nhận đổi Voucher
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
