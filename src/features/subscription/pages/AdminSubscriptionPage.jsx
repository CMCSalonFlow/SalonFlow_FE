import React, { useState, useEffect } from "react";
import {
    Table,
    Tag,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Typography,
    Card,
    Tooltip,
    Popconfirm,
    DatePicker,
    Switch,
    Row,
    Col,
    message,
    InputNumber
} from "antd";
import {
    CalendarOutlined,
    DollarOutlined,
    TeamOutlined,
    ApartmentOutlined,
    SettingOutlined,
    CrownOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    ShopOutlined,
    ClearOutlined,
    LockOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    getSubscriptionsAdminApi,
    activateManualEnterpriseApi,
    updateSubscriptionAdminApi,
    deleteSubscriptionAdminApi
} from "../api/subscriptionApi";
import { getAllSalonsApi } from "@/features/salon/api/salonApi";

const { Title, Text, Paragraph } = Typography;

export default function AdminSubscriptionPage() {
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

    // Modal States
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);

    // Form Hooks
    const [createForm] = Form.useForm();
    const [updateForm] = Form.useForm();
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [submittingUpdate, setSubmittingUpdate] = useState(false);

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

    const handleOpenCreateModal = () => {
        createForm.resetFields();
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = async (values) => {
        setSubmittingCreate(true);
        try {
            await activateManualEnterpriseApi({
                salonId: values.salonId,
                plan: values.plan,
                billingCycle: values.billingCycle,
                price: Number(values.price || 0),
                durationDays: Number(values.durationDays || 30)
            });
            message.success("Kích hoạt gói đăng ký thủ công thành công!");
            setCreateModalOpen(false);
            fetchSubscriptions();
            fetchGlobalStats();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Kích hoạt gói đăng ký thất bại!");
        } finally {
            setSubmittingCreate(false);
        }
    };

    const handleOpenUpdateModal = (record) => {
        setSelectedSub(record);
        updateForm.resetFields();
        updateForm.setFieldsValue({
            plan: record.plan,
            status: record.status,
            price: record.price,
            billingCycle: record.billingCycle,
            startDate: record.startDate ? dayjs(record.startDate) : null,
            endDate: record.endDate ? dayjs(record.endDate) : null,
            maxBranches: record.features?.maxBranches ?? 5,
            maxStaff: record.features?.maxStaff ?? 10,
            analyticsAdvanced: record.features?.analyticsAdvanced ?? false,
            aiFeatures: record.features?.aiFeatures ?? false
        });
        setUpdateModalOpen(true);
    };

    const handleUpdateSubmit = async (values) => {
        if (!selectedSub) return;
        setSubmittingUpdate(true);
        try {
            const payload = {
                plan: values.plan,
                status: values.status,
                price: Number(values.price || 0),
                billingCycle: values.billingCycle,
                startDate: values.startDate ? values.startDate.format("YYYY-MM-DDTHH:mm:ss") : undefined,
                endDate: values.endDate ? values.endDate.format("YYYY-MM-DDTHH:mm:ss") : undefined,
                maxBranches: Number(values.maxBranches),
                maxStaff: Number(values.maxStaff),
                analyticsAdvanced: !!values.analyticsAdvanced,
                aiFeatures: !!values.aiFeatures
            };

            await updateSubscriptionAdminApi(selectedSub.id, payload);
            message.success("Cập nhật thông tin gói đăng ký thành công!");
            setUpdateModalOpen(false);
            fetchSubscriptions();
            fetchGlobalStats();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Cập nhật gói đăng ký thất bại!");
        } finally {
            setSubmittingUpdate(false);
        }
    };

    const handleRevoke = async (id) => {
        try {
            await deleteSubscriptionAdminApi(id);
            message.success("Đã hủy/thu hồi gói đăng ký thành công!");
            fetchSubscriptions();
            fetchGlobalStats();
        } catch (error) {
            console.error(error);
            message.error("Hủy gói đăng ký thất bại!");
        }
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
            key: "salon",
            width: 220,
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
            render: (plan) => getPlanTag(plan)
        },
        {
            title: "Thanh toán",
            key: "billing",
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
            width: 280,
            render: (_, record) => {
                const f = record.features || {};
                return (
                    <Space size={[4, 8]} wrap>
                        <Tooltip title="Chi nhánh tối đa">
                            <Tag icon={<ApartmentOutlined />}>{f.maxBranches || 0}</Tag>
                        </Tooltip>
                        <Tooltip title="Nhân viên tối đa">
                            <Tag icon={<TeamOutlined />}>{f.maxStaff || 0}</Tag>
                        </Tooltip>
                        {f.analyticsAdvanced ? (
                            <Tag color="cyan" icon={<CheckCircleOutlined />}>Analytics Pro</Tag>
                        ) : (
                            <Tag color="default" icon={<LockOutlined />} style={{ opacity: 0.6 }}>Analytics</Tag>
                        )}
                        {f.aiFeatures ? (
                            <Tag color="geekblue" icon={<CrownOutlined />}>AI Features</Tag>
                        ) : (
                            <Tag color="default" icon={<LockOutlined />} style={{ opacity: 0.6 }}>AI Power</Tag>
                        )}
                    </Space>
                );
            }
        },
        {
            title: "Thời gian hiệu lực",
            key: "dates",
            width: 220,
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
            render: (status) => getStatusTag(status)
        },
        {
            title: "Nguồn Stripe",
            key: "stripe",
            width: 180,
            render: (_, record) => record.stripeSubscriptionId ? (
                <Tooltip title={`Cust: ${record.stripeCustomerId}`}>
                    <Tag color="blue" style={{ cursor: "help" }}>Stripe Auto</Tag>
                </Tooltip>
            ) : (
                <Tag color="orange">Thủ công (Manual)</Tag>
            )
        },
        {
            title: "Hành động",
            key: "actions",
            align: "right",
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => handleOpenUpdateModal(record)}
                    >
                        Sửa
                    </Button>
                    {record.status !== "CANCELED" && (
                        <Popconfirm
                            title="Xác nhận hủy/thu hồi gói đăng ký này?"
                            description="Gói dịch vụ của Salon sẽ bị chuyển sang CANCELED ngay lập tức."
                            onConfirm={() => handleRevoke(record.id)}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                            >
                                Hủy gói
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24, minHeight: "100vh", background: "#f8fafc" }}>
            {/* Page Header */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý Gói đăng ký</Title>
                    <Text type="secondary">Cấp gói thủ công, theo dõi doanh thu đăng ký và chỉnh sửa giới hạn tính năng của Salon.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateModal}
                    size="large"
                    style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none", borderRadius: 8, boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)" }}
                >
                    Kích hoạt gói thủ công
                </Button>
            </div>

            {/* KPI Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textTransform: "uppercase", fontWeight: "bold" }}>Tổng gói đăng ký</div>
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
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textTransform: "uppercase", fontWeight: "bold" }}>Đang hoạt động (ACTIVE)</div>
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
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textTransform: "uppercase", fontWeight: "bold" }}>Doanh thu tháng (MRR)</div>
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
                                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textTransform: "uppercase", fontWeight: "bold" }}>Phân bổ gói (P / E / F)</div>
                                <div style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginTop: 6 }}>
                                    {stats.plans.PRO} <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Pro</span> / {stats.plans.ENTERPRISE} <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Ent</span> / {stats.plans.FREE} <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Free</span>
                                </div>
                            </div>
                            <CrownOutlined style={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }} />
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Filter Panel */}
            <Card bordered={false} style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <Row gutter={[16, 16]} align="middle">
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

                    <Col xs={24} md={6} style={{ display: "flex", gap: 12, alignSelf: "flex-end", height: 38 }}>
                        <Button
                            type="dashed"
                            danger
                            onClick={handleClearFilters}
                            icon={<ClearOutlined />}
                            style={{ flex: 1, borderRadius: 6 }}
                        >
                            Xóa bộ lọc
                        </Button>
                        <Button
                            type="primary"
                            icon={<SyncOutlined spin={loading} />}
                            onClick={fetchSubscriptions}
                            style={{ flex: 1, borderRadius: 6 }}
                        >
                            Làm mới
                        </Button>
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
                    pagination={{
                        current: queryParams.page + 1,
                        pageSize: queryParams.size,
                        total: totalElements,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total) => `Tổng số ${total} bản ghi`
                    }}
                    style={{ borderRadius: 12 }}
                />
            </Card>

            {/* Modal: Create Manual Subscription */}
            <Modal
                title={
                    <Space>
                        <PlusOutlined style={{ color: "#1890ff" }} />
                        <span>Kích hoạt/Tạo gói đăng ký thủ công cho Salon</span>
                    </Space>
                }
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                footer={null}
                width={550}
                destroyOnClose
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    initialValues={{ plan: "ENTERPRISE", billingCycle: "MANUAL", price: 0, durationDays: 30 }}
                    onFinish={handleCreateSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="salonId"
                        label="Chọn Salon thụ hưởng"
                        rules={[{ required: true, message: "Vui lòng chọn Salon!" }]}
                    >
                        <Select
                            showSearch
                            placeholder="Nhập tên salon để tìm kiếm..."
                            optionFilterProp="children"
                            loading={loadingSalons}
                        >
                            {salons.map(s => (
                                <Select.Option key={s.id} value={s.id}>
                                    {s.name} (ID: #{s.id} - Email: {s.email || "Không có"})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="plan"
                                label="Gói đăng ký"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value="FREE">FREE</Select.Option>
                                    <Select.Option value="PRO">PRO</Select.Option>
                                    <Select.Option value="ENTERPRISE">ENTERPRISE</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="billingCycle"
                                label="Chu kỳ thanh toán"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value="MONTHLY">MONTHLY (Hàng tháng)</Select.Option>
                                    <Select.Option value="YEARLY">YEARLY (Hàng năm)</Select.Option>
                                    <Select.Option value="MANUAL">MANUAL (Thủ công)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="Giá gói đăng ký (VND)"
                                rules={[{ required: true, message: "Nhập giá gói!" }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    parser={value => value.replace(/\$\s?|(,*)/g, "")}
                                    placeholder="Ví dụ: 999,000"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="durationDays"
                                label="Số ngày hiệu lực (kể từ hôm nay)"
                                rules={[{ required: true, message: "Nhập số ngày!" }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={1}
                                    placeholder="Ví dụ: 30"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div style={{ textAlign: "right", marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setCreateModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={submittingCreate}>
                                Tạo gói
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            {/* Modal: Update Subscription Details */}
            <Modal
                title={
                    <Space>
                        <EditOutlined style={{ color: "#faad14" }} />
                        <span>Chỉnh sửa thông tin và tùy biến Limits gói đăng ký</span>
                    </Space>
                }
                open={updateModalOpen}
                onCancel={() => setUpdateModalOpen(false)}
                footer={null}
                width={650}
                destroyOnClose
            >
                <Form
                    form={updateForm}
                    layout="vertical"
                    onFinish={handleUpdateSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Paragraph type="secondary">
                        Đang chỉnh sửa gói đăng ký cho Salon: <Text strong>{selectedSub?.salonName}</Text> (ID gói: #{selectedSub?.id})
                    </Paragraph>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="plan"
                                label="Gói dịch vụ"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value="FREE">FREE</Select.Option>
                                    <Select.Option value="PRO">PRO</Select.Option>
                                    <Select.Option value="ENTERPRISE">ENTERPRISE</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Trạng thái"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value="ACTIVE">ACTIVE (Đang hoạt động)</Select.Option>
                                    <Select.Option value="PAST_DUE">PAST_DUE (Quá hạn thanh toán)</Select.Option>
                                    <Select.Option value="CANCELED">CANCELED (Đã hủy)</Select.Option>
                                    <Select.Option value="EXPIRED">EXPIRED (Đã hết hạn)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="price"
                                label="Giá gói dịch vụ (VND)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{ width: "100%" }}
                                    min={0}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    parser={value => value.replace(/\$\s?|(,*)/g, "")}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="billingCycle"
                                label="Chu kỳ thanh toán"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Select.Option value="MONTHLY">MONTHLY (Hàng tháng)</Select.Option>
                                    <Select.Option value="YEARLY">YEARLY (Hàng năm)</Select.Option>
                                    <Select.Option value="MANUAL">MANUAL (Thủ công)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="startDate"
                                label="Ngày bắt đầu"
                                rules={[{ required: true, message: "Chọn ngày bắt đầu!" }]}
                            >
                                <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="endDate"
                                label="Ngày kết thúc"
                                rules={[{ required: true, message: "Chọn ngày kết thúc!" }]}
                            >
                                <DatePicker showTime style={{ width: "100%" }} format="DD/MM/YYYY HH:mm" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Card
                        title="Tùy biến giới hạn tính năng (Custom Limits)"
                        size="small"
                        style={{ background: "#fafafa", borderRadius: 8, marginTop: 16 }}
                        headStyle={{ fontWeight: "bold" }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="maxBranches"
                                    label="Số chi nhánh tối đa"
                                    rules={[{ required: true, message: "Nhập giới hạn chi nhánh!" }]}
                                >
                                    <InputNumber style={{ width: "100%" }} min={1} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="maxStaff"
                                    label="Số nhân viên tối đa"
                                    rules={[{ required: true, message: "Nhập giới hạn nhân viên!" }]}
                                >
                                    <InputNumber style={{ width: "100%" }} min={1} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24} style={{ marginTop: 8 }}>
                            <Col span={12}>
                                <Form.Item
                                    name="analyticsAdvanced"
                                    label="Báo cáo phân tích nâng cao"
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="aiFeatures"
                                    label="Tính năng AI mở rộng"
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    <div style={{ textAlign: "right", marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={submittingUpdate}>
                                Lưu thay đổi
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
