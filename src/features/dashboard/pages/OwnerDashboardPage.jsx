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
    Tag,
    Typography,
    message
} from "antd";
import {
    BarChartOutlined,
    BranchesOutlined,
    CloudSyncOutlined,
    ReloadOutlined,
    SyncOutlined
} from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import RevenueForecastChart from "@/features/dashboard/components/RevenueForecastChart";
import {
    getRevenueForecastApi,
    getRevenueForecastModelStatusApi,
    getSavedRevenueForecastApi,
    trainRevenueForecastApi
} from "@/features/dashboard/api/revenueForecastApi";

const { Title, Text } = Typography;

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

const getActualValue = (item) => item?.revenue ?? item?.actual ?? item?.y ?? item?.totalRevenue;
const getForecastValue = (item) => item?.yhat ?? item?.forecast ?? item?.revenue;

const normalizeForecastPayload = (payload) => {
    const data = payload?.data ?? payload ?? {};

    if (Array.isArray(data)) {
        return {
            actuals: [],
            forecast: data,
            meta: {}
        };
    }

    return {
        actuals: Array.isArray(data.actuals) ? data.actuals : [],
        forecast: Array.isArray(data.forecast) ? data.forecast : [],
        meta: data.meta || {}
    };
};

const getErrorMessage = (error) => {
    const code = error?.response?.data?.code;
    const detail = error?.response?.data?.message || error?.response?.data?.error;

    if (code === "MODEL_NOT_FOUND") {
        return "Chi nhánh này chưa có model dự báo. Hãy train model trước.";
    }

    if (code === "INSUFFICIENT_DATA") {
        return "Dữ liệu doanh thu chưa đủ để dự báo.";
    }

    return detail || error?.message || "Không thể tải dữ liệu dự báo.";
};

export default function OwnerDashboardPage() {
    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(() => localStorage.getItem("currentBranchId") || "");
    const [months, setMonths] = useState(6);
    const [periods, setPeriods] = useState(7);
    const [modelStatus, setModelStatus] = useState(null);
    const [chartData, setChartData] = useState({ actuals: [], forecast: [], meta: {} });
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingForecast, setLoadingForecast] = useState(false);
    const [training, setTraining] = useState(false);
    const [error, setError] = useState("");

    const selectedBranch = useMemo(
        () => branches.find((branch) => String(branch.id) === String(branchId)),
        [branches, branchId]
    );

    const summary = useMemo(() => {
        const actualTotal = chartData.actuals.reduce((sum, item) => sum + Number(getActualValue(item) || 0), 0);
        const forecastTotal = chartData.forecast.reduce((sum, item) => sum + Number(getForecastValue(item) || 0), 0);
        const avgForecast = chartData.forecast.length ? forecastTotal / chartData.forecast.length : 0;

        return {
            actualTotal,
            forecastTotal,
            avgForecast
        };
    }, [chartData]);

    const loadBranches = useCallback(async () => {
        try {
            setLoadingBranches(true);
            const data = await getMyBranchesApi();
            const nextBranches = Array.isArray(data) ? data : [];
            setBranches(nextBranches);

            const storedBranchId = localStorage.getItem("currentBranchId");
            const hasStoredBranch = storedBranchId
                ? nextBranches.some((branch) => String(branch.id) === String(storedBranchId))
                : false;

            if (hasStoredBranch) {
                setBranchId(storedBranchId);
                return;
            }

            if (nextBranches.length > 0) {
                const nextBranchId = String(nextBranches[0].id);
                setBranchId(nextBranchId);
                localStorage.setItem("currentBranchId", nextBranchId);
            }
        } catch (loadError) {
            console.error(loadError);
            message.error("Không thể tải danh sách chi nhánh.");
        } finally {
            setLoadingBranches(false);
        }
    }, []);

    const loadForecast = useCallback(async (options = {}) => {
        if (!branchId) return;

        const realtime = options.realtime === true;

        try {
            setLoadingForecast(true);
            setError("");

            const [statusData, forecastData] = await Promise.all([
                getRevenueForecastModelStatusApi(branchId).catch(() => null),
                realtime
                    ? getRevenueForecastApi(branchId, months, periods)
                    : getSavedRevenueForecastApi(branchId, months, periods)
            ]);

            setModelStatus(statusData);
            setChartData(normalizeForecastPayload(forecastData));
        } catch (forecastError) {
            console.error(forecastError);
            setChartData({ actuals: [], forecast: [], meta: {} });
            setError(getErrorMessage(forecastError));
        } finally {
            setLoadingForecast(false);
        }
    }, [branchId, months, periods]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBranches();
    }, [loadBranches]);

    useEffect(() => {
        if (!branchId) return;
        localStorage.setItem("currentBranchId", String(branchId));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadForecast();
    }, [branchId, loadForecast]);

    const handleTrain = async () => {
        if (!branchId) return;

        try {
            setTraining(true);
            setError("");
            await trainRevenueForecastApi(branchId, months);
            message.success("Đã train lại model dự báo doanh thu.");
            await loadForecast();
        } catch (trainError) {
            console.error(trainError);
            message.error(getErrorMessage(trainError));
        } finally {
            setTraining(false);
        }
    };

    const handleBranchChange = (value) => {
        setBranchId(value);
        localStorage.setItem("currentBranchId", String(value));
    };

    if (loadingBranches) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="Đang tải dữ liệu chi nhánh..." />
            </div>
        );
    }

    if (branches.length === 0) {
        return (
            <Card>
                <Empty description="Bạn chưa có chi nhánh để xem dự báo doanh thu." />
            </Card>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        <BarChartOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                        Dự báo doanh thu
                    </Title>
                    <Text type="secondary">
                        Theo dõi doanh thu thực tế và dự báo 7 ngày tới theo từng chi nhánh.
                    </Text>
                </Col>
                <Col>
                    <Space wrap>
                        <Select
                            showSearch
                            style={{ width: 260 }}
                            value={branchId || undefined}
                            onChange={handleBranchChange}
                            optionFilterProp="label"
                            options={branches.map((branch) => ({
                                value: String(branch.id),
                                label: branch.name
                            }))}
                            suffixIcon={<BranchesOutlined />}
                        />
                        <Select
                            style={{ width: 140 }}
                            value={months}
                            onChange={setMonths}
                            options={[
                                { value: 3, label: "3 tháng" },
                                { value: 6, label: "6 tháng" },
                                { value: 12, label: "12 tháng" }
                            ]}
                        />
                        <Select
                            style={{ width: 150 }}
                            value={periods}
                            onChange={setPeriods}
                            options={[
                                { value: 7, label: "7 ngày tới" },
                                { value: 14, label: "14 ngày tới" },
                                { value: 30, label: "30 ngày tới" }
                            ]}
                        />
                    </Space>
                </Col>
            </Row>

            {error ? (
                <Alert
                    type="warning"
                    showIcon
                    message="Chưa thể hiển thị dự báo"
                    description={error}
                    action={
                        <Button size="small" type="primary" loading={training} onClick={handleTrain}>
                            Train model
                        </Button>
                    }
                />
            ) : null}

            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title={`Doanh thu thực tế ${months} tháng`}
                            value={summary.actualTotal}
                            formatter={(value) => `${formatCurrency(value)} đ`}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title={`Tổng dự báo ${periods} ngày`}
                            value={summary.forecastTotal}
                            valueStyle={{ color: "#7c3aed" }}
                            formatter={(value) => `${formatCurrency(value)} đ`}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card>
                        <Statistic
                            title="Trung bình dự báo/ngày"
                            value={summary.avgForecast}
                            precision={0}
                            formatter={(value) => `${formatCurrency(value)} đ`}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                title={
                    <Space wrap>
                        <span>Actuals + Forecast</span>
                        {selectedBranch ? <Tag color="blue">{selectedBranch.name}</Tag> : null}
                        {modelStatus?.trained ? <Tag color="green">Đã train</Tag> : <Tag color="gold">Chưa train</Tag>}
                    </Space>
                }
                extra={
                    <Space wrap>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => loadForecast()}
                            loading={loadingForecast}
                        >
                            Làm mới
                        </Button>
                        <Button
                            icon={<CloudSyncOutlined />}
                            onClick={() => loadForecast({ realtime: true })}
                            loading={loadingForecast}
                        >
                            Forecast realtime
                        </Button>
                        <Button
                            type="primary"
                            icon={<SyncOutlined spin={training} />}
                            onClick={handleTrain}
                            loading={training}
                        >
                            Train model
                        </Button>
                    </Space>
                }
            >
                <Spin spinning={loadingForecast}>
                    <RevenueForecastChart
                        actuals={chartData.actuals}
                        forecast={chartData.forecast}
                    />
                </Spin>
            </Card>

            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={6}>
                        <Text type="secondary">Trạng thái model</Text>
                        <div>
                            {modelStatus?.trained ? <Tag color="green">Đã train</Tag> : <Tag color="gold">Chưa train</Tag>}
                        </div>
                    </Col>
                    <Col xs={24} md={6}>
                        <Text type="secondary">Train gần nhất</Text>
                        <div>
                            <Text strong>{modelStatus?.lastTrainedAt ? new Date(modelStatus.lastTrainedAt).toLocaleString("vi-VN") : "-"}</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={6}>
                        <Text type="secondary">Data points</Text>
                        <div>
                            <Text strong>{modelStatus?.dataPoints ?? "-"}</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={6}>
                        <Text type="secondary">Model version</Text>
                        <div>
                            <Text strong>{modelStatus?.modelVersion || "-"}</Text>
                        </div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}
