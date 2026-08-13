import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, message, Row, Select, Space, Spin, Typography } from "antd";
import { ArrowLeftOutlined, AppstoreOutlined, ShopOutlined } from "@ant-design/icons";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getServicesByBranchApi, createServiceApi, updateServiceApi } from "@/features/service/api/serviceApi";
import ServiceFormModal from "@/features/service/components/ServiceFormModal";
import ServiceDescriptionAiPanel from "../components/ServiceDescriptionAiPanel";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import FeatureLockOverlay from "@/features/subscription/components/FeatureLockOverlay";

const { Title, Text, Paragraph } = Typography;

export default function ServiceDescriptionAiPage() {
    const { features } = useSubscription();
    const navigate = useNavigate();

    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingServices, setLoadingServices] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [services, setServices] = useState([]);

    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [serviceDraftInitialValues, setServiceDraftInitialValues] = useState(null);

    const loadServices = async (branchId) => {
        if (!branchId) return;

        setLoadingServices(true);
        try {
            const data = await getServicesByBranchApi(branchId);
            setServices(Array.isArray(data) ? data : []);
        } catch {
            message.error("Không thể tải danh sách dịch vụ.");
        } finally {
            setLoadingServices(false);
        }
    };

    useEffect(() => {
        const loadBranches = async () => {
            try {
                const data = await getMyBranchesApi();
                setBranches(Array.isArray(data) ? data : []);
                if (Array.isArray(data) && data.length > 0) {
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

    useEffect(() => {
        if (!selectedBranchId) return;

        let cancelled = false;

        const run = async () => {
            setLoadingServices(true);
            try {
                const data = await getServicesByBranchApi(selectedBranchId);
                if (!cancelled) {
                    setServices(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) {
                    message.error("Không thể tải danh sách dịch vụ.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingServices(false);
                    setLoadingBranches(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [selectedBranchId]);

    const handleServiceSubmit = async (payload) => {
        try {
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
            loadServices(selectedBranchId);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi lưu dịch vụ.");
        }
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
            <div style={{ maxWidth: 640, margin: "80px auto", padding: 16 }}>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                    <AppstoreOutlined style={{ fontSize: 48, color: "#bfbfbf" }} />
                    <Title level={3}>Bạn chưa có chi nhánh</Title>
                    <Paragraph type="secondary">
                        Hãy tạo ít nhất một chi nhánh trước khi dùng AI mô tả dịch vụ.
                    </Paragraph>
                    <Button type="primary" href="/owner/branches">
                        Tới quản lý chi nhánh
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <FeatureLockOverlay
            allowed={features?.aiFeatures}
            requiredPlan="ENTERPRISE"
            description="Nâng cấp gói ENTERPRISE để mở khóa tính năng AI tự động đề xuất mô tả dịch vụ thu hút khách hàng."
        >
            <div style={{ maxWidth: 1240, margin: "0 auto", padding: "8px 0 24px" }}>
            <Card style={{ borderRadius: 18, marginBottom: 20 }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate("/owner/services")}>
                        Quay về danh sách dịch vụ
                    </Button>
                    <Row justify="space-between" align="middle" gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Title level={2} style={{ marginBottom: 4 }}>
                                AI đề xuất mô tả dịch vụ
                            </Title>
                            <Text type="secondary">
                                Tạo mô tả nháp bằng AI trong một trang riêng. Sau đó bạn có thể lưu vào dịch vụ hiện có hoặc đẩy sang form tạo mới.
                            </Text>
                        </Col>
                        <Col xs={24} lg={10}>
                            <Space style={{ width: "100%", justifyContent: "flex-end" }} wrap>
                                <ShopOutlined />
                                <Text strong>Chọn chi nhánh:</Text>
                                <Select
                                    style={{ width: 280 }}
                                    value={selectedBranchId}
                                    onChange={setSelectedBranchId}
                                    options={branches.map((branch) => ({
                                        value: branch.id,
                                        label: branch.name
                                    }))}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Space>
            </Card>

            {loadingServices ? (
                <Card style={{ borderRadius: 18, textAlign: "center", padding: "32px 0" }}>
                    <Spin tip="Đang tải dữ liệu dịch vụ..." />
                </Card>
            ) : (
                <ServiceDescriptionAiPanel
                    selectedBranchId={selectedBranchId}
                    services={services}
                    onSaved={() => loadServices(selectedBranchId)}
                    onCreateDraft={(draftValues) => {
                        setEditingService(null);
                        setServiceDraftInitialValues(draftValues);
                        setServiceModalVisible(true);
                    }}
                />
            )}

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

            <Alert
                style={{ marginTop: 20 }}
                type="info"
                showIcon
                message="Gợi ý"
                description="Nếu bạn đang cần tạo dịch vụ mới, hãy dùng nút 'Đưa vào form tạo mới' trong panel AI để điền nhanh mô tả, rồi bổ sung giá, thời lượng và danh mục trong dialog."
            />
        </div>
        </FeatureLockOverlay>
    );
}
