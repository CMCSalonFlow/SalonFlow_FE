import { useEffect, useState } from "react";
import { Card, Select, Tabs, Button, Table, Tag, Space, Popconfirm, message, Typography, Row, Col, Spin } from "antd";
import { AppstoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import {
    getServicesByBranchApi,
    createServiceApi,
    updateServiceApi,
    deleteServiceApi,
    getBundlesByBranchApi,
    createBundleApi,
    updateBundleApi,
    deleteBundleApi
} from "../api/serviceApi";
import ServiceFormModal from "../components/ServiceFormModal";
import BundleFormModal from "../components/BundleFormModal";
import ServiceDescriptionAiPanel from "@/features/service-description-ai/components/ServiceDescriptionAiPanel";

const { Title, Text, Paragraph } = Typography;

export default function ServiceManagementPage() {
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    const [services, setServices] = useState([]);
    const [bundles, setBundles] = useState([]);

    // Modals visibility
    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceDraftInitialValues, setServiceDraftInitialValues] = useState(null);

    const [bundleModalVisible, setBundleModalVisible] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const data = await getMyBranchesApi();
                setBranches(data);
                if (data && data.length > 0) {
                    setSelectedBranchId(data[0].id);
                } else {
                    setLoadingBranches(false);
                }
            } catch {
                message.error("Không thể tải danh sách chi nhánh.");
                setLoadingBranches(false);
            }
        };
        loadBranches();
    }, []);

    const loadData = async (branchId) => {
        if (!branchId) return;
        setLoadingData(true);
        try {
            const [servicesData, bundlesData] = await Promise.all([
                getServicesByBranchApi(branchId),
                getBundlesByBranchApi(branchId)
            ]);
            setServices(servicesData);
            setBundles(bundlesData);
        } catch {
            message.error("Lỗi khi tải dữ liệu dịch vụ.");
        } finally {
            setLoadingData(false);
            setLoadingBranches(false);
        }
    };

    useEffect(() => {
        if (!selectedBranchId) return;

        let cancelled = false;

        const run = async () => {
            setLoadingData(true);
            try {
                const [servicesData, bundlesData] = await Promise.all([
                    getServicesByBranchApi(selectedBranchId),
                    getBundlesByBranchApi(selectedBranchId)
                ]);

                if (cancelled) return;

                setServices(servicesData);
                setBundles(bundlesData);
            } catch {
                if (!cancelled) {
                    message.error("Lỗi khi tải dữ liệu dịch vụ.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingData(false);
                    setLoadingBranches(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId]);

    // ── Standard Service Handlers ───────────────────────────────
    const handleServiceSubmit = async (payload) => {
        try {
            setLoadingData(true);
            if (editingService) {
                await updateServiceApi(selectedBranchId, editingService.id, payload);
                message.success("Cập nhật dịch vụ thành công!");
            } else {
                await createServiceApi(selectedBranchId, payload);
                message.success("Thêm dịch vụ thành công!");
            }
            setServiceModalVisible(false);
            setEditingService(null);
            setServiceDraftInitialValues(null);
            loadData(selectedBranchId);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi lưu dịch vụ.");
            setLoadingData(false);
        }
    };

    const handleServiceDelete = async (serviceId) => {
        try {
            setLoadingData(true);
            await deleteServiceApi(selectedBranchId, serviceId);
            message.success("Xóa dịch vụ thành công!");
            loadData(selectedBranchId);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi xóa dịch vụ.");
            setLoadingData(false);
        }
    };

    // ── Service Bundle Handlers ─────────────────────────────────
    const handleBundleSubmit = async (payload) => {
        try {
            setLoadingData(true);
            if (editingBundle) {
                await updateBundleApi(selectedBranchId, editingBundle.id, payload);
                message.success("Cập nhật Combo thành công!");
            } else {
                await createBundleApi(selectedBranchId, payload);
                message.success("Tạo Combo thành công!");
            }
            setBundleModalVisible(false);
            setEditingBundle(null);
            loadData(selectedBranchId);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi lưu Combo.");
            setLoadingData(false);
        }
    };

    const handleBundleDelete = async (bundleId) => {
        try {
            setLoadingData(true);
            await deleteBundleApi(selectedBranchId, bundleId);
            message.success("Xóa Combo thành công!");
            loadData(selectedBranchId);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi xóa Combo.");
            setLoadingData(false);
        }
    };

    // Table Column Definitions
    const serviceColumns = [
        {
            title: "Tên dịch vụ",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: "Danh mục",
            dataIndex: "categoryName",
            key: "categoryName",
            render: (text) => text ? <Tag color="purple">{text}</Tag> : <Text type="secondary">-</Text>
        },
        {
            title: "Thời lượng",
            dataIndex: "durationMinutes",
            key: "durationMinutes",
            render: (min) => <Tag color="blue">{min} phút</Tag>
        },
        {
            title: "Đơn giá",
            dataIndex: "price",
            key: "price",
            render: (price) => <Text strong style={{ color: "#faad14" }}>{parseFloat(price).toLocaleString()} đ</Text>
        },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            key: "isActive",
            render: (active) => active ? (
                <Tag icon={<CheckCircleOutlined />} color="success">Hoạt động</Tag>
            ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">Tạm dừng</Tag>
            )
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingService(record);
                            setServiceModalVisible(true);
                        }}
                    />
                    <Popconfirm
                        title="Xóa dịch vụ này?"
                        description="Hành động này sẽ xóa dịch vụ và gỡ bỏ khỏi mọi combo đang liên kết."
                        onConfirm={() => handleServiceDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const bundleColumns = [
        {
            title: "Tên Combo",
            dataIndex: "name",
            key: "name",
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: "Dịch vụ đi kèm",
            dataIndex: "items",
            key: "items",
            width: "30%",
            render: (items) => (
                <Space wrap size={[4, 8]}>
                    {items && items.length > 0 ? (
                        items.map((item, idx) => (
                            <Tag color="cyan" key={item.serviceId}>
                                {idx + 1}. {item.name}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">Chưa có dịch vụ nào</Text>
                    )}
                </Space>
            )
        },
        {
            title: "Tổng thời gian",
            dataIndex: "totalDurationMinutes",
            key: "totalDurationMinutes",
            render: (min) => <Tag color="blue">{min || 0} phút</Tag>
        },
        {
            title: "Giá gốc",
            dataIndex: "originalPrice",
            key: "originalPrice",
            render: (val) => <Text delete style={{ color: "#bfbfbf" }}>{parseFloat(val || 0).toLocaleString()} đ</Text>
        },
        {
            title: "Giá Combo ưu đãi",
            dataIndex: "price",
            key: "price",
            render: (price) => <Text strong style={{ color: "#52c41a", fontSize: 15 }}>{parseFloat(price).toLocaleString()} đ</Text>
        },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            key: "isActive",
            render: (active) => active ? (
                <Tag icon={<CheckCircleOutlined />} color="success">Hoạt động</Tag>
            ) : (
                <Tag icon={<CloseCircleOutlined />} color="error">Tạm dừng</Tag>
            )
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingBundle(record);
                            setBundleModalVisible(true);
                        }}
                    />
                    <Popconfirm
                        title="Xóa Combo này?"
                        description="Hành động này không thể hoàn tác."
                        onConfirm={() => handleBundleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
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
            <div style={{ maxWidth: 600, margin: "100px auto", textAlign: "center" }}>
                <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    <ShopOutlined style={{ fontSize: 48, color: "#bfbfbf", marginBottom: 20 }} />
                    <Title level={3}>Bạn chưa tạo Chi nhánh nào!</Title>
                    <Paragraph style={{ color: "#8c8c8c" }}>
                        Vui lòng thêm ít nhất một chi nhánh cho Salon của bạn trước khi quản lý dịch vụ và các gói combo.
                    </Paragraph>
                    <Button type="primary" size="large" href="/owner/branches">
                        Tới trang Quản lý Chi nhánh
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        <AppstoreOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Quản lý Dịch vụ & Combo
                    </Title>
                    <Text type="secondary">Quản lý danh sách dịch vụ đơn lẻ và các gói combo ưu đãi của chi nhánh.</Text>
                </Col>
                <Col>
                    <Space size="large">
                        <Space>
                            <ShopOutlined style={{ color: "#1890ff" }} />
                            <Text strong>Chọn Chi nhánh:</Text>
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
            </Row>

            <ServiceDescriptionAiPanel
                selectedBranchId={selectedBranchId}
                services={services}
                onSaved={() => loadData(selectedBranchId)}
                onCreateDraft={(draftValues) => {
                    setEditingService(null);
                    setServiceDraftInitialValues(draftValues);
                    setServiceModalVisible(true);
                }}
            />

            <div style={{ height: 24 }} />

            <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                {loadingData ? (
                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                        <Spin tip="Đang tải dữ liệu dịch vụ..." />
                    </div>
                ) : (
                    <Tabs
                        defaultActiveKey="services"
                        items={[
                            {
                                key: "services",
                                label: <span style={{ fontSize: 16 }}>Dịch vụ đơn lẻ</span>,
                                children: (
                                    <div>
                                        <div style={{ textAlign: "right", marginBottom: 16 }}>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                size="large"
                                                onClick={() => {
                                                    setEditingService(null);
                                                    setServiceDraftInitialValues(null);
                                                    setServiceModalVisible(true);
                                                }}
                                            >
                                                Thêm dịch vụ đơn
                                            </Button>
                                        </div>
                                        <Table
                                            columns={serviceColumns}
                                            dataSource={services}
                                            rowKey="id"
                                            pagination={{ pageSize: 8 }}
                                            bordered
                                        />
                                    </div>
                                )
                            },
                            {
                                key: "bundles",
                                label: <span style={{ fontSize: 16 }}>Combo / Gói ưu đãi</span>,
                                children: (
                                    <div>
                                        <div style={{ textAlign: "right", marginBottom: 16 }}>
                                            <Button
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                size="large"
                                                onClick={() => {
                                                    setEditingBundle(null);
                                                    setBundleModalVisible(true);
                                                }}
                                            >
                                                Thêm gói combo
                                            </Button>
                                        </div>
                                        <Table
                                            columns={bundleColumns}
                                            dataSource={bundles}
                                            rowKey="id"
                                            pagination={{ pageSize: 8 }}
                                            bordered
                                        />
                                    </div>
                                )
                            }
                        ]}
                    />
                )}
            </Card>

            {/* Service Edit/Create Form Modal */}
            <ServiceFormModal
                visible={serviceModalVisible}
                onCancel={() => {
                    setServiceModalVisible(false);
                    setEditingService(null);
                    setServiceDraftInitialValues(null);
                }}
                onSubmit={handleServiceSubmit}
                initialValues={editingService || serviceDraftInitialValues}
            />

            {/* Bundle Edit/Create Form Modal */}
            <BundleFormModal
                visible={bundleModalVisible}
                onCancel={() => {
                    setBundleModalVisible(false);
                    setEditingBundle(null);
                }}
                onSubmit={handleBundleSubmit}
                initialValues={editingBundle}
                services={services.filter(s => s.isActive)} // Only allow active services to be bundled
            />
        </div>
    );
}
