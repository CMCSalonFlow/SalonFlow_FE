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
    CloseCircleOutlined,
    DashboardOutlined,
    DollarOutlined,
    ReloadOutlined,
    RiseOutlined,
    StarOutlined,
    TeamOutlined,
    TrophyOutlined,
    AlertOutlined
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
                                subText="Doanh thu lịch hẹn đã thanh toán"
                                growthRate={kpis.revenueGrowthRate}
                                icon={DollarOutlined}
                                iconBg="#ecfdf5"
                                iconColor="#10b981"
                                trendData={trendData}
                                dataKey="revenue"
                                color="#10b981"
                                gradientId="owner-revenue"
                                formatter={(v) => formatCurrency(v)}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Lượt đặt hôm nay"
                                value={`${getOverviewValue(kpis.todayBookingsCount)} lượt`}
                                subText={`${getOverviewValue(kpis.completedBookingsCount)} hoàn thành · ${getOverviewValue(kpis.cancelledBookingsCount)} hủy`}
                                growthRate={kpis.bookingsGrowthRate}
                                icon={CalendarOutlined}
                                iconBg="#eef2ff"
                                iconColor="#4f46e5"
                                trendData={trendData}
                                dataKey="bookingCount"
                                color="#4f46e5"
                                gradientId="owner-bookings"
                                formatter={(v) => `${v} lượt`}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Tỷ lệ hoàn thành"
                                value={`${getOverviewValue(kpis.completionRate)}%`}
                                subText={`${getOverviewValue(kpis.completedBookingsCount)}/${getOverviewValue(kpis.todayBookingsCount)} lịch hẹn phục vụ`}
                                growthRate={null}
                                icon={CheckCircleOutlined}
                                iconBg="#fffbeb"
                                iconColor="#f59e0b"
                                trendData={trendData}
                                dataKey="completedCount"
                                color="#f59e0b"
                                gradientId="owner-completion"
                                formatter={(v) => `${v} hoàn thành`}
                            />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <OverviewKpiCard
                                title="Đánh giá trung bình"
                                value={`${Number(kpis.averageRating || 0).toFixed(1)} / 5.0`}
                                subText={`Từ ${getOverviewValue(kpis.totalReviewCount)} đánh giá khách hàng`}
                                growthRate={null}
                                icon={StarOutlined}
                                iconBg="#fdf2f8"
                                iconColor="#ec4899"
                                trendData={trendData}
                                dataKey="bookingCount"
                                color="#ec4899"
                                gradientId="owner-rating"
                                formatter={(v) => `${v} đánh giá`}
                            />
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <Card
                                title={
                                    <Space size={8}>
                                        <span style={{ fontSize: 18 }}>📈</span>
                                        <span style={{ fontWeight: 700, color: "#1e293b" }}>Xu hướng doanh thu 7 ngày qua</span>
                                    </Space>
                                }
                                bordered={false}
                                className="owner-glass-card"
                            >
                                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                                    Biểu đồ so sánh doanh thu và lượng khách đặt lịch theo từng ngày trong tuần gần nhất.
                                </Paragraph>
                                <RevenueTrendChart timeline={trendData} period="daily" peakPeriod={overview?.peakPeriod || null} overallYoY={overview?.overallYoY || 0} />
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card
                                title={
                                    <Space size={8}>
                                        <span style={{ fontSize: 18 }}>⚡</span>
                                        <span style={{ fontWeight: 700, color: "#1e293b" }}>Tóm tắt lịch hôm nay</span>
                                    </Space>
                                }
                                bordered={false}
                                className="owner-glass-card"
                            >
                                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                    <div className="owner-stat-item">
                                        <Space>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <CalendarOutlined />
                                            </div>
                                            <span style={{ fontWeight: 600, color: "#475569" }}>Tổng lịch đặt</span>
                                        </Space>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{getOverviewValue(kpis.todayBookingsCount)}</span>
                                    </div>

                                    <div className="owner-stat-item">
                                        <Space>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <CheckCircleOutlined />
                                            </div>
                                            <span style={{ fontWeight: 600, color: "#475569" }}>Đã hoàn thành</span>
                                        </Space>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{getOverviewValue(kpis.completedBookingsCount)}</span>
                                    </div>

                                    <div className="owner-stat-item">
                                        <Space>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <CalendarOutlined />
                                            </div>
                                            <span style={{ fontWeight: 600, color: "#475569" }}>Đang chờ phục vụ</span>
                                        </Space>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>{getOverviewValue(kpis.pendingBookingsCount)}</span>
                                    </div>

                                    <div className="owner-stat-item">
                                        <Space>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <AlertOutlined />
                                            </div>
                                            <span style={{ fontWeight: 600, color: "#475569" }}>Lịch đã hủy</span>
                                        </Space>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>{getOverviewValue(kpis.cancelledBookingsCount)}</span>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    <FeatureLockOverlay 
                        allowed={features?.analyticsAdvanced} 
                        requiredPlan="PRO"
                        description="Xem biểu đồ giờ cao điểm chi tiết để tối ưu hóa thời gian mở cửa và ca kíp nhân viên."
                    >
                        <Card bordered={false} className="owner-glass-card">
                            <PeakHourHeatmapChart branchId={selectedBranchId} />
                        </Card>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* HERO BANNER - LUXURY & MODERN GRADIENT */}
            <Card
                className="owner-hero-banner"
                bodyStyle={{ padding: "26px 28px" }}
            >
                <Row justify="space-between" align="middle" gutter={[20, 20]}>
                    <Col xs={24} lg={13}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span className="owner-live-dot" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", letterSpacing: 0.8, textTransform: "uppercase" }}>
                                Trung Tâm Vận Hành Trực Tuyến
                            </span>
                        </div>
                        <Title level={2} style={{ color: "#ffffff", margin: "0 0 6px 0", fontWeight: 800, letterSpacing: "-0.5px" }}>
                            👋 Xin chào, Tổng Quan Hoạt Động Salon
                        </Title>
                        <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 14 }}>
                            Theo dõi doanh thu tức thì, hiệu suất phục vụ & chỉ số tăng trưởng kinh doanh đa chi nhánh.
                        </Text>
                    </Col>

                    <Col xs={24} lg={11}>
                        <div
                            className="owner-branch-capsule"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                flexWrap: "wrap",
                                gap: 10,
                                background: "rgba(255, 255, 255, 0.12)",
                                backdropFilter: "blur(10px)",
                                padding: "8px 12px",
                                borderRadius: 16,
                                border: "1px solid rgba(255, 255, 255, 0.2)"
                            }}
                        >
                            <Space align="center" size={6}>
                                <BranchesOutlined style={{ color: "#818cf8", fontSize: 16 }} />
                                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Chi nhánh:</span>
                            </Space>
                            <Select
                                showSearch
                                style={{ width: 200 }}
                                value={selectedBranchId || undefined}
                                onChange={setSelectedBranchId}
                                optionFilterProp="label"
                                options={branches.map((branch) => ({
                                    value: String(branch.id),
                                    label: branch.name
                                }))}
                            />
                            <Button
                                type="primary"
                                icon={<ReloadOutlined spin={refreshing} />}
                                onClick={handleRefresh}
                                loading={refreshing}
                                style={{
                                    borderRadius: 8,
                                    background: "rgba(255, 255, 255, 0.2)",
                                    borderColor: "rgba(255, 255, 255, 0.3)",
                                    fontWeight: 600
                                }}
                            >
                                Làm mới
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {selectedBranch ? (
                <div style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#4338ca",
                    fontSize: 13,
                    fontWeight: 600
                }}>
                    <span>📍</span>
                    <span>Đang đồng bộ dữ liệu theo: <b>{selectedBranch.name}</b> {selectedBranch.address ? `(${selectedBranch.address})` : ""}</span>
                </div>
            ) : null}

            {/* TABS CONTAINER */}
            <Card
                bordered={false}
                className="owner-custom-tabs owner-glass-card"
                bodyStyle={{ padding: "18px 24px" }}
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
