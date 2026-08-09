import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Button, Space, Progress, Tag, Spin, Alert, Tabs } from 'antd';
import {
    DollarOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    StarOutlined,
    ReloadOutlined,
    RiseOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    PieChartOutlined,
    DashboardOutlined,
    FallOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { getOverviewAnalyticsApi, getRevenueAnalyticsApi } from '../api/analyticsApi';
import { getMyBranchesApi } from '@/features/branch/api/branchApi';
import OverviewKpiCard from '../components/OverviewKpiCard';
import RevenueAlertBanner from '../components/RevenueAlertBanner';
import BranchSelector from '../components/BranchSelector';
import SparklineChart from '../components/SparklineChart';
import RevenuePeriodFilter from '../components/RevenuePeriodFilter';
import RevenueTrendChart from '../components/RevenueTrendChart';
import ServiceBreakdownChart from '../components/ServiceBreakdownChart';
import CustomerAnalyticsPage from './CustomerAnalyticsPage';

const { Title, Text, Paragraph } = Typography;

export default function OwnerDashboardPage() {
    const [activeTab, setActiveTab] = useState('overview');

    // State for Tab 1: Overview
    const [overviewData, setOverviewData] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    // State for Tab 2: Revenue Analytics
    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [period, setPeriod] = useState('daily');
    const [dateRange, setDateRange] = useState(null);

    // Common State
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Fetch branches list for selector
    useEffect(() => {
        let isMounted = true;
        getMyBranchesApi()
            .then((res) => {
                if (isMounted) {
                    setBranches(res || []);
                }
            })
            .catch((err) => {
                console.error("Lỗi lấy danh sách chi nhánh:", err);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch Overview Analytics (Tab 1)
    const fetchOverview = useCallback(async (branchId, isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setOverviewLoading(true);
        setError(null);

        try {
            const data = await getOverviewAnalyticsApi(branchId);
            setOverviewData(data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu Overview Analytics:", err);
            setError(err.response?.data?.message || "Không thể tải dữ liệu Dashboard tổng quan.");
        } finally {
            setOverviewLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Fetch Revenue Analytics (Tab 2)
    const fetchRevenueAnalytics = useCallback(async (p, dates, branchId, isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setRevenueLoading(true);
        setError(null);

        try {
            const from = dates && dates[0] ? dates[0] : null;
            const to = dates && dates[1] ? dates[1] : null;
            const data = await getRevenueAnalyticsApi(p, from, to, branchId);
            setRevenueData(data);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu Revenue Analytics:", err);
            setError(err.response?.data?.message || "Không thể tải dữ liệu phân tích doanh thu.");
        } finally {
            setRevenueLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchOverview(selectedBranchId);
        } else {
            fetchRevenueAnalytics(period, dateRange, selectedBranchId);
        }
    }, [activeTab, selectedBranchId, period, dateRange, fetchOverview, fetchRevenueAnalytics]);

    const handleRefreshAll = () => {
        if (activeTab === 'overview') {
            fetchOverview(selectedBranchId, true);
        } else {
            fetchRevenueAnalytics(period, dateRange, selectedBranchId, true);
        }
    };

    const formatVND = (amount) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    const kpis = overviewData?.kpis || {};
    const alert = overviewData?.revenueAlert;
    const trendData = overviewData?.last7DaysTrend || [];

    const tabItems = [
        {
            key: 'overview',
            label: (
                <Space align="center">
                    <DashboardOutlined />
                    <span>Tổng Quan (Overview)</span>
                </Space>
            ),
            children: (
                <>
                    {/* Error Alert */}
                    {error && (
                        <Alert
                            type="error"
                            message="Lỗi tải dữ liệu"
                            description={error}
                            showIcon
                            style={{ marginBottom: 20, borderRadius: 12 }}
                        />
                    )}

                    {/* Revenue Alert Banner */}
                    <RevenueAlertBanner alert={alert} />

                    {/* Loading Spinner */}
                    {overviewLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Spin size="large" description="Đang tải dữ liệu Dashboard..." />
                        </div>
                    ) : (
                        <>
                            {/* 4 KPI Cards Grid */}
                            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                                {/* KPI 1: Doanh thu hôm nay */}
                                <Col xs={24} sm={12} lg={6}>
                                    <OverviewKpiCard
                                        title="Doanh thu hôm nay"
                                        value={formatVND(kpis.todayRevenue)}
                                        subText="Doanh thu từ các lịch hẹn hoàn thành"
                                        growthRate={kpis.revenueGrowthRate}
                                        icon={DollarOutlined}
                                        iconBg="#f6ffed"
                                        iconColor="#52c41a"
                                        trendData={trendData}
                                        dataKey="revenue"
                                        color="#52c41a"
                                        gradientId="revenue-spark"
                                        formatter={(v) => formatVND(v)}
                                    />
                                </Col>

                                {/* KPI 2: Lượt đặt hôm nay */}
                                <Col xs={24} sm={12} lg={6}>
                                    <OverviewKpiCard
                                        title="Lượt đặt hôm nay"
                                        value={`${kpis.todayBookingsCount || 0} lượt`}
                                        subText={`${kpis.completedBookingsCount || 0} thành công, ${kpis.cancelledBookingsCount || 0} bị hủy`}
                                        growthRate={kpis.bookingsGrowthRate}
                                        icon={CalendarOutlined}
                                        iconBg="#e6f7ff"
                                        iconColor="#1890ff"
                                        trendData={trendData}
                                        dataKey="bookingCount"
                                        color="#1890ff"
                                        gradientId="bookings-spark"
                                        formatter={(v) => `${v} lượt`}
                                    />
                                </Col>

                                {/* KPI 3: Tỷ lệ hoàn thành */}
                                <Col xs={24} sm={12} lg={6}>
                                    <OverviewKpiCard
                                        title="Tỷ lệ hoàn thành"
                                        value={`${kpis.completionRate || 0}%`}
                                        subText={`${kpis.completedBookingsCount || 0}/${kpis.todayBookingsCount || 0} lượt hẹn đã phục vụ`}
                                        icon={CheckCircleOutlined}
                                        iconBg="#fffbe6"
                                        iconColor="#fa8c16"
                                        trendData={trendData}
                                        dataKey="completedCount"
                                        color="#fa8c16"
                                        gradientId="completion-spark"
                                        formatter={(v) => `${v} hoàn thành`}
                                    />
                                </Col>

                                {/* KPI 4: Đánh giá trung bình */}
                                <Col xs={24} sm={12} lg={6}>
                                    <OverviewKpiCard
                                        title="Đánh giá trung bình"
                                        value={`${kpis.averageRating || 0.0} / 5.0`}
                                        subText={`Dựa trên ${kpis.totalReviewCount || 0} lượt đánh giá thực tế`}
                                        icon={StarOutlined}
                                        iconBg="#fff0f6"
                                        iconColor="#eb2f96"
                                        trendData={trendData}
                                        dataKey="bookingCount"
                                        color="#eb2f96"
                                        gradientId="rating-spark"
                                        formatter={(v) => `${v} đánh giá`}
                                    />
                                </Col>
                            </Row>

                            {/* Lower Section: 7-Day Trend Chart & Today's Status Breakdown */}
                            <Row gutter={[16, 16]}>
                                {/* 7-Day Detailed Trend Chart */}
                                <Col xs={24} lg={16}>
                                    <Card
                                        title={
                                            <Space align="center">
                                                <RiseOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                                                <span style={{ fontWeight: 700 }}>Biểu đồ xu hướng Doanh thu 7 ngày qua</span>
                                            </Space>
                                        }
                                        extra={<Tag color="blue">7 ngày gần nhất</Tag>}
                                        bordered={false}
                                        style={{ borderRadius: 16, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                    >
                                        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
                                            So sánh doanh thu và lượng khách đặt theo từng ngày trong tuần
                                        </Paragraph>

                                        <div style={{ width: '100%', marginBottom: 12 }}>
                                            <SparklineChart
                                                data={trendData}
                                                dataKey="revenue"
                                                color="#1890ff"
                                                gradientId="main-trend-grad"
                                                height={140}
                                                alignWithColumns={true}
                                                formatter={(v) => formatVND(v)}
                                            />
                                        </div>

                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(7, 1fr)',
                                                gap: '8px',
                                                marginTop: 16,
                                                paddingTop: 16,
                                                borderTop: '1px solid #f0f0f0',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {trendData.map((day, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        background: '#fafafa',
                                                        padding: '10px 4px',
                                                        borderRadius: 10,
                                                        border: '1px solid #f0f0f0'
                                                    }}
                                                >
                                                    <Text strong style={{ fontSize: 12, display: 'block', color: '#262626' }}>
                                                        {day.dayOfWeek}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 11, display: 'block', margin: '2px 0' }}>
                                                        {day.date?.slice(5)}
                                                    </Text>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                                                        {day.revenue > 0 ? `${Math.round(day.revenue / 1000)}k` : '0'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </Col>

                                {/* Today's Booking Status Breakdown */}
                                <Col xs={24} lg={8}>
                                    <Card
                                        title={
                                            <Space align="center">
                                                <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                                                <span style={{ fontWeight: 700 }}>Trạng thái lịch hẹn hôm nay</span>
                                            </Space>
                                        }
                                        bordered={false}
                                        style={{ borderRadius: 16, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                                    >
                                        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 24 }}>
                                            Tổng cộng <Text strong>{kpis.todayBookingsCount || 0}</Text> lượt đặt trong ngày
                                        </Paragraph>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                            {/* Completed */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Space align="center" style={{ color: '#52c41a', fontWeight: 600, fontSize: 13 }}>
                                                        <CheckCircleOutlined />
                                                        Đã hoàn thành
                                                    </Space>
                                                    <Text strong style={{ fontSize: 13 }}>{kpis.completedBookingsCount || 0} lượt</Text>
                                                </div>
                                                <Progress
                                                    percent={
                                                        kpis.todayBookingsCount
                                                            ? Math.round((kpis.completedBookingsCount / kpis.todayBookingsCount) * 100)
                                                            : 0
                                                    }
                                                    strokeColor="#52c41a"
                                                    status="active"
                                                />
                                            </div>

                                            {/* Confirmed */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Space align="center" style={{ color: '#1890ff', fontWeight: 600, fontSize: 13 }}>
                                                        <ClockCircleOutlined />
                                                        Đã xác nhận
                                                    </Space>
                                                    <Text strong style={{ fontSize: 13 }}>{kpis.confirmedBookingsCount || 0} lượt</Text>
                                                </div>
                                                <Progress
                                                    percent={
                                                        kpis.todayBookingsCount
                                                            ? Math.round((kpis.confirmedBookingsCount / kpis.todayBookingsCount) * 100)
                                                            : 0
                                                    }
                                                    strokeColor="#1890ff"
                                                />
                                            </div>

                                            {/* Pending */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Space align="center" style={{ color: '#fa8c16', fontWeight: 600, fontSize: 13 }}>
                                                        <ClockCircleOutlined />
                                                        Chờ xử lý
                                                    </Space>
                                                    <Text strong style={{ fontSize: 13 }}>{kpis.pendingBookingsCount || 0} lượt</Text>
                                                </div>
                                                <Progress
                                                    percent={
                                                        kpis.todayBookingsCount
                                                            ? Math.round((kpis.pendingBookingsCount / kpis.todayBookingsCount) * 100)
                                                            : 0
                                                    }
                                                    strokeColor="#fa8c16"
                                                />
                                            </div>

                                            {/* Cancelled */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <Space align="center" style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 13 }}>
                                                        <CloseCircleOutlined />
                                                        Đã hủy
                                                    </Space>
                                                    <Text strong style={{ fontSize: 13 }}>{kpis.cancelledBookingsCount || 0} lượt</Text>
                                                </div>
                                                <Progress
                                                    percent={
                                                        kpis.todayBookingsCount
                                                            ? Math.round((kpis.cancelledBookingsCount / kpis.todayBookingsCount) * 100)
                                                            : 0
                                                    }
                                                    strokeColor="#ff4d4f"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </>
            )
        },
        {
            key: 'revenue-analytics',
            label: (
                <Space align="center">
                    <RiseOutlined />
                    <span>Phân Tích Doanh Thu Chi Tiết</span>
                </Space>
            ),
            children: (
                <>
                    {/* Filter Bar */}
                    <Card
                        bordered={false}
                        style={{ borderRadius: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        bodyStyle={{ padding: '16px 20px' }}
                    >
                        <Row align="middle" justify="space-between" gutter={[16, 16]}>
                            <Col xs={24} md={18}>
                                <RevenuePeriodFilter
                                    period={period}
                                    onPeriodChange={(p) => setPeriod(p)}
                                    dateRange={dateRange}
                                    onDateRangeChange={(dates) => setDateRange(dates)}
                                />
                            </Col>

                            <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Khoảng lọc: {revenueData?.fromDate || '...'} → {revenueData?.toDate || '...'}
                                </Text>
                            </Col>
                        </Row>
                    </Card>

                    {/* Overall Summary Card */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                        <Col xs={24} sm={8}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>TỔNG DOANH THU KỲ NÀY</Text>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#52c41a', marginTop: 4 }}>
                                    {formatVND(revenueData?.totalRevenue)}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>CÙNG KỲ NĂM NGOÁI</Text>
                                <div style={{ fontSize: 26, fontWeight: 800, color: '#8c8c8c', marginTop: 4 }}>
                                    {formatVND(revenueData?.totalPreviousYearRevenue)}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={8}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>TĂNG TRƯỞNG YOY TỔNG THỂ</Text>
                                <div style={{ fontSize: 26, fontWeight: 800, color: (revenueData?.overallYoYGrowthRate || 0) >= 0 ? '#52c41a' : '#ff4d4f', marginTop: 4 }}>
                                    {(revenueData?.overallYoYGrowthRate || 0) > 0 ? `+${revenueData?.overallYoYGrowthRate}%` : `${revenueData?.overallYoYGrowthRate || 0}%`}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Revenue Loading Spinner */}
                    {revenueLoading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Spin size="large" tip="Đang tính toán biểu đồ doanh thu chi tiết..." />
                        </div>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {/* Main Chart Component (Bar / Line flexible) */}
                            <Col xs={24} lg={14}>
                                <RevenueTrendChart
                                    timeline={revenueData?.timeline || []}
                                    period={period}
                                    peakPeriod={revenueData?.peakPeriod}
                                    overallYoY={revenueData?.overallYoYGrowthRate}
                                />
                            </Col>

                            {/* Service Revenue Breakdown Component (Pie Chart) */}
                            <Col xs={24} lg={10}>
                                <ServiceBreakdownChart
                                    breakdown={revenueData?.serviceBreakdown || []}
                                    totalRevenue={revenueData?.totalRevenue || 0}
                                />
                            </Col>
                        </Row>
                    )}
                </>
            )
        },
        {
            key: 'customers',
            label: (
                <Space align="center">
                    <TeamOutlined />
                    <span>Phân Tích Khách Hàng</span>
                </Space>
            ),
            children: (
                <CustomerAnalyticsPage branchId={selectedBranchId} />
            )
        }
    ];

    return (
        <div style={{ padding: '20px 24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            {/* Header Card */}
            <Card
                variant="borderless"
                style={{ borderRadius: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                styles={{ body: { padding: '20px 24px' } }}
            >
                <Row align="middle" justify="space-between" gutter={[16, 16]}>
                    <Col xs={24} md={14}>
                        <Space align="center" size={10} style={{ flexWrap: 'wrap' }}>
                            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#141414' }}>
                                Dashboard Phân Tích & Doanh Thu Salon
                            </Title>
                            <Tag color="processing" icon={<RiseOutlined />}>
                                Live Analytics
                            </Tag>
                        </Space>
                        <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: 13 }}>
                            Theo dõi các chỉ số kinh doanh, biểu đồ xu hướng doanh thu và phân rã dịch vụ thực tế
                        </Paragraph>
                    </Col>

                    <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <BranchSelector
                            branches={branches}
                            selectedBranchId={selectedBranchId}
                            onChange={(bId) => setSelectedBranchId(bId)}
                        />

                        <Button
                            type="primary"
                            icon={<ReloadOutlined spin={refreshing} />}
                            onClick={handleRefreshAll}
                            loading={refreshing}
                            style={{ borderRadius: 10, fontWeight: 600 }}
                        >
                            Làm mới
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Main Tabs Component */}
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                items={tabItems}
                type="card"
                size="large"
                style={{ background: 'transparent' }}
            />
        </div>
    );
}