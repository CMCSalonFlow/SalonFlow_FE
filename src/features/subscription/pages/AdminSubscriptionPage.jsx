import React, { useState, useEffect } from "react";
import {
    Table,
    Tag,
    Button,
    Select,
    Space,
    Typography,
    Card,
    Tooltip,
    Row,
    Col,
    message,
    Grid
} from "antd";
import {
    CalendarOutlined,
    DollarOutlined,
    TeamOutlined,
    ApartmentOutlined,
    SettingOutlined,
    CrownOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
    ShopOutlined,
    ClearOutlined,
    LockOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getSubscriptionsAdminApi } from "../api/subscriptionApi";
import { getAllSalonsApi } from "@/features/salon/api/salonApi";

const { Title, Text } = Typography;

export default function AdminSubscriptionPage() {
    const screens = Grid.useBreakpoint();
    const [subscriptions, setSubscriptions] = useState([]);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [salons, setSalons] = useState([]);
    const [loadingSalons, setLoadingSalons] = useState(false);

    // Stats State (calculated from fetching first 1000 items)
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pastDue: 0,
        mrr: 0,
        plans: { FREE: 0, PRO: 0, ENTERPRISE: 0 }
    });

    // Pagination, Filter, Sorting State
    const [queryParams, setQueryParams] = useState({
        page: 0,
        size: 10,
        sort: "createdAt,desc",
        salonId: undefined,
        plan: undefined,
        status: undefined
    });

    // Fetch initial data
    useEffect(() => {
        fetchSubscriptions();
    }, [queryParams]);

    useEffect(() => {
        fetchSalons();
        fetchGlobalStats();
    }, []);

    const fetchSalons = async () => {
        setLoadingSalons(true);
        try {
            const data = await getAllSalonsApi();
            setSalons(data || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách salon:", error);
        } finally {
            setLoadingSalons(false);
        }
    };

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            // Clean undefined parameters
            const cleanParams = Object.keys(queryParams).reduce((acc, key) => {
                if (queryParams[key] !== undefined && queryParams[key] !== "") {
                    acc[key] = queryParams[key];
                }
                return acc;
            }, {});

            const res = await getSubscriptionsAdminApi(cleanParams);
            if (res) {
                setSubscriptions(res.content || []);
                setTotalElements(res.totalElements || 0);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách đăng ký:", error);
            message.error("Không thể tải danh sách gói đăng ký!");
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalStats = async () => {
        try {
            // Fetch first 1000 items to calculate summary statistics
            const res = await getSubscriptionsAdminApi({ page: 0, size: 1000 });
            if (res && res.content) {
                const list = res.content;
                let activeCount = 0;
                let pastDueCount = 0;
                let mrrSum = 0;
                const plansCount = { FREE: 0, PRO: 0, ENTERPRISE: 0 };

                list.forEach(sub => {
                    plansCount[sub.plan] = (plansCount[sub.plan] || 0) + 1;
                    if (sub.status === "ACTIVE") {
                        activeCount++;
                        // Calculate MRR approximation
                        if (sub.billingCycle === "MONTHLY") {
                            mrrSum += sub.price || 0;
                        } else if (sub.billingCycle === "YEARLY") {
                            mrrSum += (sub.price || 0) / 12;
                        } else {
                            mrrSum += (sub.price || 0); // Manual / others
                        }
                    } else if (sub.status === "PAST_DUE") {
                        pastDueCount++;
                    }
                });

                setStats({
                    total: res.totalElements || list.length,
                    active: activeCount,
                    pastDue: pastDueCount,
                    mrr: mrrSum,
                    plans: plansCount
                });
            }
        } catch (error) {
            console.error("Lỗi lấy thống kê chung:", error);
        }
    };

    // Handlers
    const handleFilterChange = (field, value) => {
        setQueryParams(prev => ({
            ...prev,
            [field]: value,
            page: 0 // Reset page to 0 when filters change
        }));
    };

    const handleClearFilters = () => {
        setQueryParams({
            page: 0,
            size: 10,
            sort: "createdAt,desc",
            salonId: undefined,
            plan: undefined,
            status: undefined
        });
    };

    const handleTableChange = (pagination, filters, sorter) => {
        const newPage = pagination.current - 1;
        const newSize = pagination.pageSize;
        let newSort = queryParams.sort;

        if (sorter.field) {
            const order = sorter.order === "ascend" ? "asc" : "desc";
            newSort = `${sorter.field},${order}`;
        }

        setQueryParams(prev => ({
            ...prev,
            page: newPage,
            size: newSize,
            sort: newSort
        }));
    };

    // Styling Helpers
    const getPlanTag = (plan) => {
        switch (plan) {
            case "ENTERPRISE":
                return (
                    <Tag color="gold" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: "bold" }}>
                        <CrownOutlined /> ENTERPRISE
                    </Tag>
                );
            case "PRO":
                return <Tag color="purple" style={{ fontWeight: "bold" }}>PRO</Tag>;
            case "FREE":
                return <Tag color="blue" style={{ fontWeight: "bold" }}>FREE</Tag>;
            default:
                return <Tag>{plan}</Tag>;
        }
    };

    const getStatusTag = (status) => {
        switch (status) {
            case "ACTIVE":
                return <Tag color="success">Đang hoạt động</Tag>;
            case "PAST_DUE":
                return <Tag color="warning">Quá hạn thanh toán</Tag>;
            case "CANCELED":
                return <Tag color="error">Đã hủy</Tag>;
            case "EXPIRED":
                return <Tag color="default">Đã hết hạn</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    };

    const columns = [
        {
            title: "Salon",
            dataIndex: "salonName",
            key: "salon",
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <Text strong style={{ fontSize: "14px" }}>{record.salonName || "N/A"}</Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>ID Salon: #{record.salonId}</Text>
                </Space>
            )
        },
        {
            title: "Gói",
            dataIndex: "plan",
            key: "plan",
            width: 120,
            render: (plan) => getPlanTag(plan)
        },
        {
            title: "Thanh toán",
            key: "billing",
            width: 140,
            render: (_, record) => (
                <div>
                    <div><Text strong>{formatCurrency(record.price)}</Text></div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                        {record.billingCycle === "MONTHLY" ? "Hàng tháng" : record.billingCycle === "YEARLY" ? "Hàng năm" : "Thủ công"}
                    </Text>
                </div>
            )
        },
        {
            title: "Tính năng & Giới hạn",
            key: "features",
            width: 360,
            render: (_, record) => {
                const f = record.features || {};
                return (
                    <div style={{ whiteSpace: "nowrap", display: "flex", gap: 8, alignItems: "center" }}>
                        <Tooltip title="Chi nhánh tối đa">
                            <Tag icon={<ApartmentOutlined />} style={{ minWidth: 54, justifyContent: "center", display: "inline-flex", alignItems: "center", margin: 0 }}>
                                {f.maxBranches || 0}
                            </Tag>
                        </Tooltip>
                        <Tooltip title="Nhân viên tối đa">
                            <Tag icon={<TeamOutlined />} style={{ minWidth: 54, justifyContent: "center", display: "inline-flex", alignItems: "center", margin: 0 }}>
                                {f.maxStaff || 0}
                            </Tag>
                        </Tooltip>
                        <div style={{ width: 112, display: "inline-flex" }}>
                            {f.analyticsAdvanced ? (
                                <Tag color="cyan" icon={<CheckCircleOutlined />} style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", margin: 0 }}>Analytics Pro</Tag>
                            ) : (
                                <Tag color="default" icon={<LockOutlined />} style={{ width: "100%", opacity: 0.6, justifyContent: "center", display: "inline-flex", alignItems: "center", margin: 0 }}>Analytics</Tag>
                            )}
                        </div>
                        <div style={{ width: 104, display: "inline-flex" }}>
                            {f.aiFeatures ? (
                                <Tag color="geekblue" icon={<CrownOutlined />} style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", margin: 0 }}>AI Features</Tag>
                            ) : (
                                <Tag color="default" icon={<LockOutlined />} style={{ width: "100%", opacity: 0.6, justifyContent: "center", display: "inline-flex", alignItems: "center", margin: 0 }}>AI Power</Tag>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            title: "Thời gian hiệu lực",
            key: "dates",
            width: 200,
            render: (_, record) => (
                <div style={{ fontSize: "13px" }}>
                    <div><Text type="secondary">Từ:</Text> {record.startDate ? dayjs(record.startDate).format("DD/MM/YYYY HH:mm") : "---"}</div>
                    <div><Text type="secondary">Đến:</Text> {record.endDate ? dayjs(record.endDate).format("DD/MM/YYYY HH:mm") : "---"}</div>
                </div>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 150,
            render: (status) => getStatusTag(status)
        }
    ];

    return (
        <div style={{ padding: screens.xs ? "12px 6px" : 24, minHeight: "100vh", background: "#f8fafc" }}>
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={screens.xs ? 4 : 3} style={{ margin: 0 }}>Danh sách & Thống kê Gói Đăng ký</Title>
                <Text type="secondary">Theo dõi chỉ số doanh thu MRR, phân bổ gói và danh sách đăng ký dịch vụ của các Salon.</Text>
            </div>

            {/* KPI Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.3 }}>Tổng lượt đăng ký</div>
                                <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.total}</div>
                            </div>
                            <CalendarOutlined style={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.3 }}>Gói đang hiệu lực</div>
                                <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.active}</div>
                            </div>
                            <CheckCircleOutlined style={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.3 }}>Doanh thu ước tính / Tháng</div>
                                <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 10 }}>{formatCurrency(stats.mrr)}</div>
                            </div>
                            <DollarOutlined style={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12.5, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.3 }}>Phân loại cơ cấu gói</div>
                                <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 8 }}>
                                    {stats.plans.PRO} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Pro</span> / {stats.plans.ENTERPRISE} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Ent</span> / {stats.plans.FREE} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Free</span>
                                </div>
                            </div>
                            <CrownOutlined style={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Filter Panel */}
            <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} md={6}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "#64748b", marginBottom: 6 }}>
                            <ShopOutlined style={{ marginRight: 6 }} /> Salon
                        </div>
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder="Chọn Salon"
                            optionFilterProp="children"
                            value={queryParams.salonId}
                            onChange={(val) => handleFilterChange("salonId", val)}
                            loading={loadingSalons}
                            allowClear
                        >
                            {salons.map(salon => (
                                <Select.Option key={salon.id} value={salon.id}>
                                    {salon.name} (ID: #{salon.id})
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>

                    <Col xs={24} md={6}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "#64748b", marginBottom: 6 }}>
                            <CrownOutlined style={{ marginRight: 6 }} /> Gói Đăng Ký
                        </div>
                        <Select
                            style={{ width: "100%" }}
                            placeholder="Chọn Gói dịch vụ"
                            value={queryParams.plan}
                            onChange={(val) => handleFilterChange("plan", val)}
                            allowClear
                        >
                            <Select.Option value="FREE">FREE</Select.Option>
                            <Select.Option value="PRO">PRO</Select.Option>
                            <Select.Option value="ENTERPRISE">ENTERPRISE</Select.Option>
                        </Select>
                    </Col>

                    <Col xs={24} md={6}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "#64748b", marginBottom: 6 }}>
                            <SettingOutlined style={{ marginRight: 6 }} /> Trạng Thái
                        </div>
                        <Select
                            style={{ width: "100%" }}
                            placeholder="Chọn Trạng thái"
                            value={queryParams.status}
                            onChange={(val) => handleFilterChange("status", val)}
                            allowClear
                        >
                            <Select.Option value="ACTIVE">ACTIVE (Đang hoạt động)</Select.Option>
                            <Select.Option value="PAST_DUE">PAST_DUE (Quá hạn)</Select.Option>
                            <Select.Option value="CANCELED">CANCELED (Đã hủy)</Select.Option>
                            <Select.Option value="EXPIRED">EXPIRED (Hết hạn)</Select.Option>
                        </Select>
                    </Col>

                    <Col xs={24} md={6}>
                        <div style={{ display: "flex", gap: 10 }}>
                            <Button
                                type="dashed"
                                danger
                                onClick={handleClearFilters}
                                icon={<ClearOutlined />}
                                style={{ flex: 1, borderRadius: 6, height: 32 }}
                            >
                                Xóa bộ lọc
                            </Button>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={() => fetchSubscriptions()}
                                loading={loading}
                                style={{ flex: 1, borderRadius: 6, height: 32 }}
                            >
                                Làm mới
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Subscriptions Table */}
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }} bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={subscriptions}
                    rowKey="id"
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: queryParams.page + 1,
                        pageSize: queryParams.size,
                        total: totalElements,
                        showSizeChanger: !screens.xs,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: screens.xs ? undefined : ((total) => `Tổng số ${total} bản ghi`),
                        simple: screens.xs
                    }}
                    style={{ borderRadius: 12 }}
                />
            </Card>
        </div>
    );
}
