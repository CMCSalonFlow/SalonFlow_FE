import { useEffect, useState } from "react";
import {
    Button,
    Row,
    Col,
    message,
    Empty,
    Spin,
    Typography,
    Select,
    Space,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import {
    getServicesBySalon,
    createService,
    updateService,
    deleteService,
    getCategories,
} from "../api/serviceApi";

import ServiceCard from "../components/ServiceCard";
import ServiceFormModal from "../components/ServiceFormModal";

const { Title } = Typography;

/**
 * Trang quản lý dịch vụ của salon.
 * Route: /owner/salons/:salonId/services
 *
 * Lưu ý: salonId được truyền qua props hoặc useParams().
 * Hiện tại dùng salonId cứng = 1 để demo, thay bằng useParams() sau.
 */
export default function ServiceListPage({ salonId = 1 }) {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);

    // Filter theo category
    const [filterCategoryId, setFilterCategoryId] = useState(null);

    useEffect(() => {
        loadAll();
    }, [salonId]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [servicesData, categoriesData] = await Promise.all([
                getServicesBySalon(salonId),
                getCategories(),
            ]);
            setServices(servicesData);
            setCategories(categoriesData);
        } catch {
            message.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingService(null);
        setModalOpen(true);
    };

    const openEdit = (service) => {
        setEditingService(service);
        setModalOpen(true);
    };

    const handleSubmit = async (payload) => {
        try {
            if (editingService) {
                await updateService(salonId, editingService.id, payload);
                message.success("Cập nhật dịch vụ thành công");
            } else {
                await createService(salonId, payload);
                message.success("Thêm dịch vụ thành công");
            }
            setModalOpen(false);
            loadAll();
        } catch (err) {
            const msg = err?.response?.data?.message || "Có lỗi xảy ra";
            message.error(msg);
            throw err; // Để modal không tự đóng khi lỗi
        }
    };

    const handleDelete = async (serviceId) => {
        try {
            await deleteService(salonId, serviceId);
            message.success("Đã xóa dịch vụ");
            loadAll();
        } catch {
            message.error("Xóa thất bại");
        }
    };

    // Filter services theo category
    const filteredServices = filterCategoryId
        ? services.filter((s) => s.categoryId === filterCategoryId)
        : services;

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Quản lý dịch vụ
                </Title>

                <Space>
                    <Select
                        placeholder="Lọc theo danh mục"
                        allowClear
                        style={{ width: 200 }}
                        options={categories.map((c) => ({
                            value: c.id,
                            label: c.name,
                        }))}
                        onChange={setFilterCategoryId}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={openCreate}
                    >
                        Thêm dịch vụ
                    </Button>
                </Space>
            </div>

            <Spin spinning={loading}>
                {filteredServices.length === 0 ? (
                    <Empty
                        description="Chưa có dịch vụ nào"
                        style={{ marginTop: 80 }}
                    />
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredServices.map((service) => (
                            <Col
                                key={service.id}
                                xs={24}
                                sm={12}
                                md={8}
                                lg={6}
                            >
                                <ServiceCard
                                    service={service}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </Spin>

            <ServiceFormModal
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onSuccess={handleSubmit}
                initialValues={editingService}
                categories={categories}
            />
        </div>
    );
}
