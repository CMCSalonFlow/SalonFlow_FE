import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Tabs,
    Typography,
    message
} from "antd";
import {
    BarChartOutlined,
    BranchesOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    DashboardOutlined,
    DollarOutlined,
    ReloadOutlined,
    RiseOutlined,
    StarOutlined,
    TeamOutlined,
    TrophyOutlined
} from "@ant-design/icons";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getMySalonApi } from "@/features/salon/api/salonApi";
import { getOverviewAnalyticsApi, getRevenueAnalyticsApi } from "@/features/dashboard/api/analyticsApi";
import RevenueAlertBanner from "@/features/dashboard/components/RevenueAlertBanner";
import OverviewKpiCard from "@/features/dashboard/components/OverviewKpiCard";
import RevenueTrendChart from "@/features/dashboard/components/RevenueTrendChart";
import RevenuePeriodFilter from "@/features/dashboard/components/RevenuePeriodFilter";
import ServiceBreakdownChart from "@/features/dashboard/components/ServiceBreakdownChart";
import PeakHourHeatmapChart from "@/features/dashboard/components/PeakHourHeatmapChart";
import CustomerAnalyticsPage from "@/features/dashboard/pages/CustomerAnalyticsPage";
import StaffPerformanceReportTab from "@/features/dashboard/components/StaffPerformanceReportTab";
import ReviewAnalyticsTab from "@/features/review/components/ReviewAnalyticsTab";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import FeatureLockOverlay from "@/features/subscription/components/FeatureLockOverlay";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const getOverviewValue = (value) => (value === null || value === undefined ? 0 : value);

export default function OwnerDashboardPage() {
    const { features } = useSubscription();
    const [branches, setBranches] = useState([]);
    const [salonId, setSalonId] = useState(null);
    const [selectedBranchId, setSelectedBranchId] = useState(() => localStorage.getItem("currentBranchId") || "");
    const [activeTab, setActiveTab] = useState("overview");

    const [overviewData, setOverviewData] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [period, setPeriod] = useState("daily");
    const [dateRange, setDateRange] = useState(null);

    const selectedBranch = useMemo(
        () => branches.find((branch) => String(branch.id) === String(selectedBranchId)),
        [branches, selectedBranchId]
    );

    const loadRevenue = useCallback(async (branchId, currentPeriod, currentDateRange) => {
        if (!branchId) return;

        setRevenueLoading(true);
        setError("");
        try {
            const from = currentDateRange?.[0] || null;
            const to = currentDateRange?.[1] || null;
            const data = await getRevenueAnalyticsApi(currentPeriod, from, to, branchId);
            setRevenueData(data || null);
        } catch (err) {
            console.error("Lỗi lấy dữ liệu doanh thu:", err);
            setError(err.response?.data?.message || "Không thể tải dữ liệu phân tích doanh thu.");
        } finally {
            setRevenueLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoadingBranches(true);
            try {
                const [branchesRes, salonRes] = await Promise.allSettled([
                    getMyBranchesApi(),
                    getMySalonApi()
                ]);

                if (cancelled) return;

                if (branchesRes.status === "fulfilled") {
                    const nextBranches = Array.isArray(branchesRes.value) ? branchesRes.value : [];
                    setBranches(nextBranches);

                    const storedBranchId = localStorage.getItem("currentBranchId");
                    const hasStoredBranch = storedBranchId
                        ? nextBranches.some((branch) => String(branch.id) === String(storedBranchId))
                        : false;

                    if (hasStoredBranch) {
                        setSelectedBranchId(storedBranchId);
                    } else if (nextBranches.length > 0) {
                        const nextBranchId = String(nextBranches[0].id);
                        setSelectedBranchId(nextBranchId);
                        localStorage.setItem("currentBranchId", nextBranchId);
                    }
                } else {
                    console.error("Lỗi lấy danh sách chi nhánh:", branchesRes.reason);
                    message.error("Không thể tải danh sách chi nhánh.");
                }

                if (salonRes.status === "fulfilled") {
                    setSalonId(salonRes.value?.id || null);
                } else {
                    console.error("Lỗi lấy thông tin salon:", salonRes.reason);
                }
            } finally {
                if (!cancelled) {
                    setLoadingBranches(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedBranchId) return;

        let cancelled = false;

        const run = async () => {
            setError("");
            localStorage.setItem("currentBranchId", String(selectedBranchId));

            try {
                const [overviewRes, revenueRes] = await Promise.all([
                    getOverviewAnalyticsApi(selectedBranchId),
                    getRevenueAnalyticsApi(period, dateRange?.[0] || null, dateRange?.[1] || null, selectedBranchId)
                ]);

                if (cancelled) return;

                setOverviewData(overviewRes || null);
                setRevenueData(revenueRes || null);
            } catch (err) {
                if (!cancelled) {
                    console.error(err);
                    setError(err.response?.data?.message || "Không thể tải dữ liệu dashboard.");
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId, period, dateRange]);

    const handleRefresh = async () => {
        if (!selectedBranchId) return;

        setRefreshing(true);
        try {
            if (activeTab === "revenue") {
                await loadRevenue(selectedBranchId, period, dateRange);
            } else {
                const data = await getOverviewAnalyticsApi(selectedBranchId);
                setOverviewData(data || null);
            }
        } finally {
            setRefreshing(false);
        }
    };

    const overview = overviewData || {};
    const kpis = overview.kpis || {};
    const trendData = overview.last7DaysTrend || [];
    const alert = overview.revenueAlert;

    const revenueTimeline = revenueData?.timeline || [];
    const serviceBreakdown = revenueData?.serviceBreakdown || [];

    const tabItems = [
        {
            key: "overview",
            label: (
                <Space size={8}>
                    <DashboardOutlined />
                    <span>Tổng quan</span>
                </Space>
            ),
            children: (
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                    {error ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Lỗi tải dữ liệu"
                            description={error}
                        />
                    ) : null}

                    <RevenueAlertBanner alert={alert} />

                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Doanh thu hôm nay"
                                value={formatCurrency(getOverviewValue(kpis.todayRevenue))}
                                subText="Doanh thu từ các lịch hẹn hoàn thành"
                                growthRate={kpis.revenueGrowthRate}
                                icon={DollarOutlined}
                                iconBg="#f6ffed"
                                iconColor="#52c41a"
                                trendData={trendData}
                                dataKey="revenue"
                                color="#52c41a"
                                gradientId="owner-revenue"
                                formatter={(v) => formatCurrency(v)}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Lượt đặt hôm nay"
                                value={`${getOverviewValue(kpis.todayBookingsCount)} lượt`}
                                subText={`${getOverviewValue(kpis.completedBookingsCount)} thành công, ${getOverviewValue(kpis.cancelledBookingsCount)} bị hủy`}
                                growthRate={kpis.bookingsGrowthRate}
                                icon={CalendarOutlined}
                                iconBg="#e6f7ff"
                                iconColor="#1890ff"
                                trendData={trendData}
                                dataKey="bookingCount"
                                color="#1890ff"
                                gradientId="owner-bookings"
                                formatter={(v) => `${v} lượt`}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Tỷ lệ hoàn thành"
                                value={`${getOverviewValue(kpis.completionRate)}%`}
                                subText={`${getOverviewValue(kpis.completedBookingsCount)}/${getOverviewValue(kpis.todayBookingsCount)} lượt hẹn đã phục vụ`}
                                growthRate={null}
                                icon={CheckCircleOutlined}
                                iconBg="#fffbe6"
                                iconColor="#fa8c16"
                                trendData={trendData}
                                dataKey="completedCount"
                                color="#fa8c16"
                                gradientId="owner-completion"
                                formatter={(v) => `${v} hoàn thành`}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Đánh giá trung bình"
                                value={`${Number(kpis.averageRating || 0).toFixed(1)} / 5`}
                                subText={`Dựa trên ${getOverviewValue(kpis.totalReviewCount)} lượt đánh giá thực tế`}
                                growthRate={null}
                                icon={StarOutlined}
                                iconBg="#fff0f6"
                                iconColor="#eb2f96"
                                trendData={trendData}
                                dataKey="bookingCount"
                                color="#eb2f96"
                                gradientId="owner-rating"
                                formatter={(v) => `${v} đánh giá`}
                            />
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <Card
                                title="Xu hướng doanh thu 7 ngày"
                                bordered={false}
                                style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Paragraph type="secondary">
                                    So sánh doanh thu và số lượt đặt theo từng ngày trong tuần gần nhất.
                                </Paragraph>
                                <RevenueTrendChart timeline={trendData} period="daily" peakPeriod={overview?.peakPeriod || null} overallYoY={overview?.overallYoY || 0} />
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card
                                title="Tóm tắt nhanh"
                                bordered={false}
                                style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                    <Statistic title="Tổng lịch hôm nay" value={getOverviewValue(kpis.todayBookingsCount)} />
                                    <Statistic title="Lịch đã xác nhận" value={getOverviewValue(kpis.confirmedBookingsCount)} />
                                    <Statistic title="Lịch chờ xử lý" value={getOverviewValue(kpis.pendingBookingsCount)} />
                                    <Statistic title="Lịch đã hủy" value={getOverviewValue(kpis.cancelledBookingsCount)} />
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    <FeatureLockOverlay 
                        allowed={features?.analyticsAdvanced} 
                        requiredPlan="PRO"
                        description="Xem biểu đồ giờ cao điểm chi tiết để tối ưu hóa thời gian mở cửa và ca kíp nhân viên."
                    >
                        <PeakHourHeatmapChart branchId={selectedBranchId} />
                    </FeatureLockOverlay>
                </Space>
            )
        },
        {
            key: "revenue",
            label: (
                <Space size={8}>
                    <RiseOutlined />
                    <span>Doanh thu</span>
                </Space>
            ),
            children: (
                <FeatureLockOverlay
                    allowed={features?.analyticsAdvanced}
                    requiredPlan="PRO"
                    description="Theo dõi chi tiết doanh thu thực tế, so sánh doanh số cùng kỳ năm ngoái và phân tích dịch vụ hàng đầu."
                >
                    <Space direction="vertical" size={20} style={{ width: "100%" }}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                            <Row align="middle" justify="space-between" gutter={[16, 16]}>
                                <Col xs={24} lg={18}>
                                    <RevenuePeriodFilter
                                        period={period}
                                        onPeriodChange={setPeriod}
                                        dateRange={dateRange}
                                        onDateRangeChange={setDateRange}
                                    />
                                </Col>
                                <Col xs={24} lg={6} style={{ textAlign: "right" }}>
                                    <Text type="secondary">
                                        Khoảng lọc: {revenueData?.fromDate || "..."} → {revenueData?.toDate || "..."}
                                    </Text>
                                </Col>
                            </Row>
                        </Card>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <Card bordered={false} style={{ borderRadius: 16 }}>
                                    <Statistic
                                        title="Tổng doanh thu"
                                        value={revenueData?.totalRevenue || 0}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card bordered={false} style={{ borderRadius: 16 }}>
                                    <Statistic
                                        title="Cùng kỳ năm ngoái"
                                        value={revenueData?.totalPreviousYearRevenue || 0}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card bordered={false} style={{ borderRadius: 16 }}>
                                    <Statistic
                                        title="Tăng trưởng YoY"
                                        value={revenueData?.overallYoYGrowthRate || 0}
                                        precision={1}
                                        suffix="%"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {revenueLoading ? (
                            <div style={{ textAlign: "center", padding: "60px 0" }}>
                                <Spin size="large" tip="Đang tải dữ liệu doanh thu..." />
                            </div>
                        ) : (
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={14}>
                                    <Card bordered={false} style={{ borderRadius: 16, height: "100%" }}>
                                        <RevenueTrendChart
                                            timeline={revenueTimeline}
                                            period={period}
                                            peakPeriod={revenueData?.peakPeriod || null}
                                            overallYoY={revenueData?.overallYoYGrowthRate || 0}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} lg={10}>
                                    <Card bordered={false} style={{ borderRadius: 16, height: "100%" }}>
                                        <ServiceBreakdownChart
                                            breakdown={serviceBreakdown}
                                            totalRevenue={revenueData?.totalRevenue || 0}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        )}
                    </Space>
                </FeatureLockOverlay>
            )
        },
        {
            key: "customers",
            label: (
                <Space size={8}>
                    <TeamOutlined />
                    <span>Khách hàng</span>
                </Space>
            ),
            children: (
                <FeatureLockOverlay
                    allowed={features?.analyticsAdvanced}
                    requiredPlan="PRO"
                    description="Phân tích phân khúc khách hàng, tỷ lệ chuyển đổi và đề xuất chiến dịch marketing thông minh."
                >
                    <CustomerAnalyticsPage branchId={selectedBranchId} />
                </FeatureLockOverlay>
            )
        },
        {
            key: "staff-performance",
            label: (
                <Space size={8}>
                    <TrophyOutlined />
                    <span>Hiệu suất nhân viên</span>
                </Space>
            ),
            children: (
                <FeatureLockOverlay
                    allowed={features?.analyticsAdvanced}
                    requiredPlan="PRO"
                    description="Đánh giá hiệu suất phục vụ, năng suất lịch hẹn và doanh số mang lại từ từng nhân viên."
                >
                    <StaffPerformanceReportTab selectedBranchId={selectedBranchId} />
                </FeatureLockOverlay>
            )
        },
        {
            key: "review-analytics",
            label: (
                <Space size={8}>
                    <BarChartOutlined />
                    <span>Phân tích đánh giá</span>
                </Space>
            ),
            children: (
                <ReviewAnalyticsTab salonId={salonId} branches={branches} />
            )
        }
    ];

    if (loadingBranches) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải dữ liệu chi nhánh..." />
            </div>
        );
    }

    if (branches.length === 0) {
        return (
            <Card style={{ borderRadius: 16 }}>
                <Empty description="Bạn chưa có chi nhánh để xem dashboard owner." />
            </Card>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
                variant="borderless"
                style={{
                    borderRadius: 18,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                }}
            >
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} lg={14}>
                        <Space direction="vertical" size={4}>
                            <Space size={10} align="center" wrap>
                                <BarChartOutlined style={{ color: "#1677ff", fontSize: 22 }} />
                                <Title level={3} style={{ margin: 0 }}>
                                    Owner Dashboard
                                </Title>
                            </Space>
                            <Text type="secondary">
                                Theo dõi doanh thu, hiệu quả vận hành và phân tích khách hàng theo từng chi nhánh.
                            </Text>
                        </Space>
                    </Col>
                    <Col xs={24} lg={10}>
                        <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
                            <BranchesOutlined />
                            <Select
                                showSearch
                                style={{ width: 260 }}
                                value={selectedBranchId || undefined}
                                onChange={setSelectedBranchId}
                                optionFilterProp="label"
                                options={branches.map((branch) => ({
                                    value: String(branch.id),
                                    label: branch.name
                                }))}
                            />
                            <Button
                                icon={<ReloadOutlined spin={refreshing} />}
                                onClick={handleRefresh}
                                loading={refreshing}
                            >
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {selectedBranch ? (
                <Alert
                    type="info"
                    showIcon
                    message={`Đang xem dữ liệu của chi nhánh: ${selectedBranch.name}`}
                    description="Dữ liệu trong dashboard sẽ tự đồng bộ theo chi nhánh đang chọn."
                />
            ) : null}

            <Card
                bordered={false}
                style={{
                    borderRadius: 18,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    size="large"
                />
            </Card>
        </div>
    );
}
