import React, { useEffect, useState } from 'react';
import {
    Card, Table, Tag, Button, Spin, message, Statistic, Row, Col,
    Progress, Tooltip, Empty, Tabs, Select, Typography, Space
} from 'antd';
import {
    AlertOutlined, LineChartOutlined, SendOutlined, ReloadOutlined,
    CheckCircleOutlined, SafetyCertificateOutlined, ExperimentOutlined,
    ThunderboltOutlined, ShopOutlined
} from '@ant-design/icons';
import {
    getHighRiskBookingsApi, sendNoShowReminderApi,
    getNoShowEvaluationsApi, triggerNoShowEvaluationApi
} from '../api/noShowApi';
import NoShowWarningBadge from '../components/NoShowWarningBadge';
import { getMyBranchesApi } from '@/features/branch/api/branchApi';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import FeatureLockOverlay from '@/features/subscription/components/FeatureLockOverlay';

const { Title, Text } = Typography;

const NoShowDashboardPage = () => {
    const { features } = useSubscription();
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [loading, setLoading] = useState(false);

    // High Risk Bookings
    const [highRiskData, setHighRiskData] = useState([]);
    const [highRiskTotal, setHighRiskTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Weekly Evaluations
    const [evaluations, setEvaluations] = useState([]);
    const [evalLoading, setEvalLoading] = useState(false);

    useEffect(() => {
        loadBranches();
        if (features?.aiFeatures) {
            loadEvaluations();
        }
    }, [features?.aiFeatures]);

    useEffect(() => {
        if (features?.aiFeatures && selectedBranchId) {
            loadHighRiskBookings();
        }
    }, [selectedBranchId, page, features?.aiFeatures]);

    const loadBranches = async () => {
        try {
            const data = await getMyBranchesApi();
            setBranches(data || []);
            if (data && data.length > 0) {
                setSelectedBranchId(data[0].id);
            }
        } catch (error) {
            console.error("Lỗi khi tải chi nhánh:", error);
        }
    };

    const loadHighRiskBookings = async () => {
        if (!features?.aiFeatures || !selectedBranchId) return;
        setLoading(true);
        try {
            const res = await getHighRiskBookingsApi(selectedBranchId, { page: page - 1, size: 10 });
            setHighRiskData(res.content || []);
            setHighRiskTotal(res.totalElements || 0);
        } catch (error) {
            console.error("Không thể tải danh sách booking nguy cơ cao:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadEvaluations = async () => {
        if (!features?.aiFeatures) return;
        setEvalLoading(true);
        try {
            const data = await getNoShowEvaluationsApi();
            setEvaluations(data || []);
        } catch (error) {
            console.error("Lỗi khi tải báo cáo hiệu quả AI:", error);
        } finally {
            setEvalLoading(false);
        }
    };

    const handleSendReminder = async (bookingId) => {
        try {
            await sendNoShowReminderApi(bookingId);
            message.success("Đã gửi Email nhắc nhở lịch hẹn thành công!");
            loadHighRiskBookings();
        } catch (error) {
            message.error(error?.response?.data?.message || "Không thể gửi email nhắc nhở");
        }
    };

    const handleTriggerEvaluation = async () => {
        setEvalLoading(true);
        try {
            await triggerNoShowEvaluationApi();
            message.success("Đã đo lường & cập nhật báo cáo hiệu quả AI mới nhất!");
            loadEvaluations();
        } catch (error) {
            message.error("Chạy đánh giá thất bại");
        } finally {
            setEvalLoading(false);
        }
    };

    // Table Columns cho Booking Nguy Cơ Cao
    const highRiskColumns = [
        {
            title: 'Mã Booking',
            dataIndex: 'bookingId',
            key: 'bookingId',
            width: 120,
            render: (id) => <span className="font-bold text-slate-800">#BK-{id}</span>
        },
        {
            title: 'Khách Hàng',
            key: 'customer',
            width: 220,
            render: (_, record) => (
                <div>
                    <div className="font-semibold text-slate-900">{record.customerName}</div>
                    <div className="text-xs text-slate-500">{record.customerPhone || 'Chưa có SĐT'}</div>
                </div>
            )
        },
        {
            title: 'Nguy Cơ No-Show',
            key: 'risk',
            width: 200,
            render: (_, record) => (
                <NoShowWarningBadge
                    probabilityPercentage={record.probabilityPercentage}
                    riskLevel={record.riskLevel}
                    explanation={record.explanation}
                    features={record.features}
                    bookingId={record.bookingId}
                    smsSent={record.smsSent}
                    onReminderSent={loadHighRiskBookings}
                />
            )
        },
        {
            title: 'Lý Do Phân Tích Dữ Liệu',
            key: 'history',
            width: 320,
            render: (_, record) => {
                const f = record.features || {};
                const cancelPct = Math.round((f.cancelRate || 0) * 100);
                return (
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
                        <div>
                            <span>Tỉ lệ hủy quá khứ: </span>
                            <strong style={{ color: cancelPct > 0 ? "#dc2626" : "#16a34a" }}>{cancelPct}%</strong>
                            {f.totalPastBookings > 0 && (
                                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
                                    ({f.totalCancelledOrNoShowBookings}/{f.totalPastBookings} buổi)
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", marginTop: 2 }}>
                            <span>Đặt trước: <strong style={{ color: "#1e293b" }}>{f.leadTimeHours || 0} giờ</strong></span>
                            <span style={{ margin: "0 8px", color: "#cbd5e1" }}>|</span>
                            <span>Khoảng cách: <strong style={{ color: "#1e293b" }}>~{f.distanceKm || 0} km</strong></span>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Trạng Thái Nhắc Nhở',
            key: 'smsStatus',
            width: 160,
            render: (_, record) => (
                record.smsSent ? (
                    <Tag color="success">
                        Đã gửi Email
                    </Tag>
                ) : (
                    <Tag color="warning">
                        Cần nhắc lịch
                    </Tag>
                )
            )
        },
        {
            title: 'Thao Tác',
            key: 'actions',
            width: 160,
            render: (_, record) => (
                <Button
                    type="primary"
                    danger
                    size="small"
                    onClick={() => handleSendReminder(record.bookingId)}
                >
                    Gửi Email Nhắc Lịch
                </Button>
            )
        }
    ];

    const latestEval = evaluations.length > 0 ? evaluations[0] : null;

    // Dữ liệu vẽ biểu đồ đường xu hướng SVG
    const chartPoints = evaluations.slice(0, 6).reverse();
    const svgWidth = 560;
    const svgHeight = 160;
    const padding = 30;

    const pointsCoordinates = chartPoints.map((item, index) => {
        const x = padding + (index * ((svgWidth - 2 * padding) / Math.max(1, chartPoints.length - 1)));
        const accuracy = item.accuracy != null ? item.accuracy : 1.0;
        const y = svgHeight - padding - (accuracy * (svgHeight - 2 * padding));
        return { x, y, accuracy: Math.round(accuracy * 100), date: item.evaluationDate };
    });

    const pathD = pointsCoordinates.reduce((acc, point, idx) => {
        return idx === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    return (
        <FeatureLockOverlay
            allowed={features?.aiFeatures}
            requiredPlan="ENTERPRISE"
            description="Nâng cấp gói ENTERPRISE để mở khóa tính năng AI No-Show Prediction giúp dự đoán và cảnh báo những lịch đặt hẹn có nguy cơ bùng kèo cao."
        >
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }} className="space-y-6">
            {/* Header Banner - Chuẩn Layout Hệ Thống */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        Cảnh Báo Booking Nguy Cơ Bùng Kèo & Báo Cáo AI
                    </Title>
                    <Text type="secondary">Giúp Chủ Salon chủ động phát hiện lịch hẹn có khả năng không đến cao và theo dõi hiệu quả dự đoán trực quan.</Text>
                </Col>
                {branches.length > 0 && (
                    <Col>
                        <Space size="large">
                            <Space>
                                <Text strong>Chi nhánh:</Text>
                                <Select
                                    style={{ width: 250 }}
                                    value={selectedBranchId}
                                    onChange={setSelectedBranchId}
                                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                                    size="large"
                                />
                            </Space>
                        </Space>
                    </Col>
                )}
            </Row>

            {/* Overview Stats Cards */}
            {latestEval && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-emerald-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Tỷ Lệ Dự Đoán Đúng</span>}
                                value={Math.round((latestEval.accuracy || 0) * 100)}
                                suffix="%"
                                styles={{ content: { color: '#059669', fontWeight: 'bold', fontSize: '28px' } }}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">Độ chuẩn xác chung của AI</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-indigo-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Chỉ Số Hiệu Quả AI</span>}
                                value={Math.round((latestEval.f1Score || 0) * 100)}
                                suffix="%"
                                styles={{ content: { color: '#4f46e5', fontWeight: 'bold', fontSize: '28px' } }}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">Đánh giá lọc rủi ro toàn diện</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-amber-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Đã Kiểm Tra Lịch Hẹn</span>}
                                value={latestEval.totalEvaluatedBookings || 0}
                                styles={{ content: { color: '#d97706', fontWeight: 'bold', fontSize: '28px' } }}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">Trong tuần vừa qua</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-rose-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Phát Hiện Đúng Bùng Lịch</span>}
                                value={latestEval.truePositives || 0}
                                styles={{ content: { color: '#dc2626', fontWeight: 'bold', fontSize: '28px' } }}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">Ca cảnh báo chính xác tuyệt đối</div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Main Content Card: Danh Sách Booking Có Nguy Cơ Bùng Kèo Cao */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <div className="space-y-4 pt-2">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1e293b" }}>
                            Danh Sách Booking Có Nguy Cơ Bùng Kèo Cao
                        </h3>
                        <Button
                            onClick={loadHighRiskBookings}
                            loading={loading}
                        >
                            Tải lại danh sách
                        </Button>
                    </div>

                    <Table
                        columns={highRiskColumns}
                        dataSource={highRiskData}
                        rowKey="bookingId"
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize: 10,
                            total: highRiskTotal,
                            onChange: (p) => setPage(p)
                        }}
                        locale={{ emptyText: 'Hiện tại chưa có booking nào có nguy cơ No-Show cao tại chi nhánh này.' }}
                    />
                </div>
            </Card>
        </div>
        </FeatureLockOverlay>
    );
};

export default NoShowDashboardPage;
