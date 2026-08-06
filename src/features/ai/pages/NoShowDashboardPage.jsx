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

const { Title, Text } = Typography;

const NoShowDashboardPage = () => {
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
        loadEvaluations();
    }, []);

    useEffect(() => {
        if (selectedBranchId) {
            loadHighRiskBookings();
        }
    }, [selectedBranchId, page]);

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
        if (!selectedBranchId) return;
        setLoading(true);
        try {
            const res = await getHighRiskBookingsApi(selectedBranchId, { page: page - 1, size: 10 });
            setHighRiskData(res.content || []);
            setHighRiskTotal(res.totalElements || 0);
        } catch (error) {
            message.error("Không thể tải danh sách booking nguy cơ cao");
        } finally {
            setLoading(false);
        }
    };

    const loadEvaluations = async () => {
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
            message.success("Đã gửi tin nhắn Zalo ZNS nhắc lịch hẹn thành công!");
            loadHighRiskBookings();
        } catch (error) {
            message.error(error?.response?.data?.message || "Không thể gửi tin nhắn nhắc nhở");
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
            render: (_, record) => {
                const f = record.features || {};
                return (
                    <div className="text-xs space-y-1 text-slate-600">
                        <div>
                            Tỉ lệ hủy quá khứ: <b className="text-red-600">{Math.round((f.cancelRate || 0) * 100)}%</b>
                            {f.totalPastBookings > 0 && ` (${f.totalCancelledOrNoShowBookings}/${f.totalPastBookings} buổi)`}
                        </div>
                        <div className="text-slate-500">
                            Đặt trước: <b>{f.leadTimeHours || 0} giờ</b> | Khoảng cách: <b>~{f.distanceKm || 0} km</b>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Trạng Thái Zalo ZNS',
            key: 'smsStatus',
            width: 160,
            render: (_, record) => (
                record.smsSent ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đã gửi ZNS nhắc nhở
                    </Tag>
                ) : (
                    <Tag color="warning" icon={<ThunderboltOutlined />}>
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
                    icon={<SendOutlined />}
                    onClick={() => handleSendReminder(record.bookingId)}
                >
                    Gửi ZNS Nhắc Nhở
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
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }} className="space-y-6">
            {/* Header Banner - Chuẩn Layout Hệ Thống */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        <AlertOutlined style={{ marginRight: 8, color: "#ff4d4f" }} /> Cảnh Báo Booking Nguy Cơ Bùng Kèo & Báo Cáo AI
                    </Title>
                    <Text type="secondary">Giúp Chủ Salon chủ động phát hiện lịch hẹn có khả năng không đến cao và theo dõi hiệu quả dự đoán trực quan.</Text>
                </Col>
                {branches.length > 0 && (
                    <Col>
                        <Space size="large">
                            <Space>
                                <ShopOutlined style={{ color: "#1890ff" }} />
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
                                prefix={<SafetyCertificateOutlined className="mr-1" />}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">🎯 Độ chuẩn xác chung của AI</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-indigo-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Chỉ Số Hiệu Quả AI</span>}
                                value={Math.round((latestEval.f1Score || 0) * 100)}
                                suffix="%"
                                styles={{ content: { color: '#4f46e5', fontWeight: 'bold', fontSize: '28px' } }}
                                prefix={<ExperimentOutlined className="mr-1" />}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">🌟 Đánh giá lọc rủi ro toàn diện</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-amber-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Đã Kiểm Tra Lịch Hẹn</span>}
                                value={latestEval.totalEvaluatedBookings || 0}
                                styles={{ content: { color: '#d97706', fontWeight: 'bold', fontSize: '28px' } }}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">📅 Trong tuần vừa qua</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-rose-50/50 to-white">
                            <Statistic
                                title={<span className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Phát Hiện Đúng Bùng Lịch</span>}
                                value={latestEval.truePositives || 0}
                                styles={{ content: { color: '#dc2626', fontWeight: 'bold', fontSize: '28px' } }}
                                prefix={<AlertOutlined className="mr-1" />}
                            />
                            <div className="text-xs text-slate-500 mt-2 font-medium">⚠️ Ca cảnh báo chính xác tuyệt đối</div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Main Content Tabs (2 Tabs) */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <Tabs
                    defaultActiveKey="1"
                    items={[
                        {
                            key: '1',
                            label: (
                                <span className="flex items-center gap-2 font-bold py-1">
                                    <AlertOutlined className="text-red-500 text-base" />
                                    Booking Nguy Cơ Cao (Nguy cơ &gt; 70%)
                                </span>
                            ),
                            children: (
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between items-center pb-2">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800 m-0">
                                                🚨 Danh Sách Booking Có Nguy Cơ Bùng Kèo Cao
                                            </h3>
                                            <p className="text-xs text-slate-500 m-0 mt-0.5">
                                                Các lịch hẹn được AI cảnh báo. Chủ salon / Nhân viên nên chủ động gọi điện hoặc bấm <b>Gửi ZNS Nhắc Nhở</b>.
                                            </p>
                                        </div>
                                        <Button
                                            icon={<ReloadOutlined />}
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
                            )
                        },
                        {
                            key: '2',
                            label: (
                                <span className="flex items-center gap-2 font-bold py-1">
                                    <LineChartOutlined className="text-indigo-600 text-base" />
                                    Báo Cáo Hiệu Quả AI (Biểu Đồ Trực Quan)
                                </span>
                            ),
                            children: (
                                <div className="space-y-6 pt-2">
                                    <Row justify="space-between" align="middle" style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                                        <Col>
                                            <h3 className="text-base font-bold text-slate-800 m-0">
                                                📊 Báo Cáo Hiệu Năng AI Dự Đoán Theo Thời Gian
                                            </h3>
                                            <p className="text-xs text-slate-500 m-0 mt-0.5">
                                                Theo dõi độ chính xác và chất lượng lọc rủi ro của AI qua từng tuần.
                                            </p>
                                        </Col>
                                        <Col>
                                            <Button
                                                type="primary"
                                                icon={<ExperimentOutlined />}
                                                onClick={handleTriggerEvaluation}
                                                loading={evalLoading}
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                Cập Nhật Báo Cáo Mới Nhất
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Row gutter={[24, 24]}>
                                        {/* Visual Chart: Biểu đồ đường Xu Hướng Độ Chính Xác */}
                                        <Col xs={24} lg={14}>
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                                    📈 Biểu Đồ Xu Hướng Tỷ Lệ Dự Đoán Đúng Qua Các Tuần (%)
                                                </h4>
                                                <p className="text-xs text-slate-500 mb-4">
                                                    Đường thể hiện sự ổn định và độ chuẩn xác của AI theo thời gian.
                                                </p>

                                                {pointsCoordinates.length > 0 ? (
                                                    <div className="w-full overflow-x-auto flex justify-center py-2">
                                                        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
                                                            {/* Grid lines */}
                                                            <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="4 4" />
                                                            <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#e2e8f0" strokeDasharray="4 4" />
                                                            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" />

                                                            {/* Trend Line */}
                                                            {pointsCoordinates.length > 1 && (
                                                                <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
                                                            )}

                                                            {/* Data Points */}
                                                            {pointsCoordinates.map((pt, i) => (
                                                                <g key={i}>
                                                                    <circle cx={pt.x} cy={pt.y} r="6" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                                                                    <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="text-[11px] font-bold fill-indigo-700">
                                                                        {pt.accuracy}%
                                                                    </text>
                                                                    <text x={pt.x} y={svgHeight - 10} textAnchor="middle" className="text-[10px] fill-slate-500">
                                                                        {pt.date}
                                                                    </text>
                                                                </g>
                                                            ))}
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <Empty description="Chưa có dữ liệu lịch sử đánh giá" />
                                                )}
                                            </div>
                                        </Col>

                                        {/* Bar Chart Breakdown: Thước đo chi tiết năng lực AI bằng biểu đồ cột dọc */}
                                        <Col xs={24} lg={10}>
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 h-full flex flex-col justify-between space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                                                        📊 Đánh Giá Chi Tiết Năng Lực AI Tuần Này
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mb-4">
                                                        Biểu đồ cột thể hiện các chỉ số chất lượng vận hành của AI.
                                                    </p>

                                                    {latestEval ? (
                                                        <div className="w-full flex justify-center py-2 bg-white rounded-xl border border-slate-100 shadow-inner">
                                                            <svg width="340" height="170" className="overflow-visible">
                                                                {/* Grid lines */}
                                                                <line x1="15" y1="20" x2="325" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                                                                <line x1="15" y1="75" x2="325" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" />
                                                                <line x1="15" y1="130" x2="325" y2="130" stroke="#e2e8f0" />

                                                                {/* Column 1: Độ báo chuẩn (Precision) */}
                                                                <g>
                                                                    <rect
                                                                        x="35"
                                                                        y={130 - (Math.round((latestEval.precisionScore || 0) * 100) / 100 * 110)}
                                                                        width="48"
                                                                        height={Math.round((latestEval.precisionScore || 0) * 100) / 100 * 110}
                                                                        fill="#6366f1"
                                                                        rx="4"
                                                                    />
                                                                    <text
                                                                        x="59"
                                                                        y={130 - (Math.round((latestEval.precisionScore || 0) * 100) / 100 * 110) - 6}
                                                                        textAnchor="middle"
                                                                        className="text-xs font-bold fill-indigo-700"
                                                                    >
                                                                        {Math.round((latestEval.precisionScore || 0) * 100)}%
                                                                    </text>
                                                                    <text x="59" y="148" textAnchor="middle" className="text-[10px] font-semibold fill-slate-700">
                                                                        Độ Báo Chuẩn
                                                                    </text>
                                                                </g>

                                                                {/* Column 2: Tỷ lệ bắt trúng (Recall) */}
                                                                <g>
                                                                    <rect
                                                                        x="145"
                                                                        y={130 - (Math.round((latestEval.recallScore || 0) * 100) / 100 * 110)}
                                                                        width="48"
                                                                        height={Math.round((latestEval.recallScore || 0) * 100) / 100 * 110}
                                                                        fill="#10b981"
                                                                        rx="4"
                                                                    />
                                                                    <text
                                                                        x="169"
                                                                        y={130 - (Math.round((latestEval.recallScore || 0) * 100) / 100 * 110) - 6}
                                                                        textAnchor="middle"
                                                                        className="text-xs font-bold fill-emerald-700"
                                                                    >
                                                                        {Math.round((latestEval.recallScore || 0) * 100)}%
                                                                    </text>
                                                                    <text x="169" y="148" textAnchor="middle" className="text-[10px] font-semibold fill-slate-700">
                                                                        Tỷ Lệ Bắt Trúng
                                                                    </text>
                                                                </g>

                                                                {/* Column 3: Hiệu quả chung (F1 Score) */}
                                                                <g>
                                                                    <rect
                                                                        x="255"
                                                                        y={130 - (Math.round((latestEval.f1Score || 0) * 100) / 100 * 110)}
                                                                        width="48"
                                                                        height={Math.round((latestEval.f1Score || 0) * 100) / 100 * 110}
                                                                        fill="#f43f5e"
                                                                        rx="4"
                                                                    />
                                                                    <text
                                                                        x="279"
                                                                        y={130 - (Math.round((latestEval.f1Score || 0) * 100) / 100 * 110) - 6}
                                                                        textAnchor="middle"
                                                                        className="text-xs font-bold fill-rose-700"
                                                                    >
                                                                        {Math.round((latestEval.f1Score || 0) * 100)}%
                                                                    </text>
                                                                    <text x="279" y="148" textAnchor="middle" className="text-[10px] font-semibold fill-slate-700">
                                                                        Hiệu Quả Chung
                                                                    </text>
                                                                </g>
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <Empty description="Chưa có dữ liệu tuần này" />
                                                    )}
                                                </div>

                                                {latestEval && (
                                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                                                        💡 <b>Kết luận:</b> Trong tổng số <b>{latestEval.totalEvaluatedBookings || 0}</b> booking đã kiểm tra tuần này, AI đã phát hiện chính xác <b>{latestEval.truePositives || 0}</b> lượt bùng kèo thực tế.
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            )
                        }
                    ]}
                />
            </Card>
        </div>
    );
};

export default NoShowDashboardPage;
