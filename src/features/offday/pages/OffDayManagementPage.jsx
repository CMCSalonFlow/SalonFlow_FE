import React, { useEffect, useState, useMemo } from "react";
import {
    Button,
    Select,
    message,
    Card,
    Typography,
    Row,
    Col,
    Statistic,
    Space,
    Tag
} from "antd";
import { PlusOutlined, CalendarOutlined, GlobalOutlined, BankOutlined } from "@ant-design/icons";

import OffDayFormModal from "../components/OffDayFormModal";
import OffDayTable from "../components/OffDayTable";

import { useOffDays } from "../hooks/useOffDays";
import offdayApi from "../api/offdayApi";

import { getBranchesApi } from "@/features/branch/api/branchApi";

const { Title, Text, Paragraph } = Typography;

const OffDayManagementPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    const { offDays, loading, reload } = useOffDays();

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        try {
            const data = await getBranchesApi();
            setBranches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Không tải được danh sách chi nhánh:", error);
        }
    };

    const handleCreate = async (values) => {
        try {
            setSubmitting(true);
            await offdayApi.createSystemOffDay(values);
            message.success("Đã thêm ngày nghỉ lễ / đóng cửa mới thành công!");
            setIsModalOpen(false);
            reload();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Tạo ngày nghỉ thất bại!");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await offdayApi.deleteSystemOffDay(id);
            message.success("Xóa ngày nghỉ thành công!");
            reload();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Xóa ngày nghỉ thất bại!");
        }
    };

    // Filter offDays based on selectedBranchId
    const filteredOffDays = useMemo(() => {
        if (!selectedBranchId) return offDays;
        return offDays.filter(item => item.isAllBranches || item.branchId === selectedBranchId);
    }, [offDays, selectedBranchId]);

    const totalGlobal = useMemo(() => offDays.filter(i => i.isAllBranches).length, [offDays]);
    const totalBranchSpecific = useMemo(() => offDays.filter(i => !i.isAllBranches).length, [offDays]);

    return (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
                <Title level={3} style={{ margin: 0 }}>
                    Quản Lý Ngày Nghỉ Lễ & Đóng Cửa Hệ Thống
                </Title>
                <Text type="secondary">
                    Cấu hình ngày nghỉ lễ toàn Salon hoặc từng Chi nhánh. Hệ thống sẽ tự động khóa lịch đặt trực tuyến của Khách hàng và lịch phân ca của Nhân viên vào các ngày này.
                </Text>
            </div>

            {/* Thống kê nhanh */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #1890ff' }}>
                        <Statistic
                            title="Tổng số Dịp Nghỉ Lễ"
                            value={offDays.length}
                            prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                            suffix="dịp"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #ff4d4f' }}>
                        <Statistic
                            title="Nghỉ Lễ Toàn Salon"
                            value={totalGlobal}
                            prefix={<GlobalOutlined style={{ color: '#ff4d4f' }} />}
                            suffix="dịp"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #fa8c16' }}>
                        <Statistic
                            title="Nghỉ / Đóng Cửa Chi Nhánh"
                            value={totalBranchSpecific}
                            prefix={<BankOutlined style={{ color: '#fa8c16' }} />}
                            suffix="dịp"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Thanh công cụ lọc & nút Thêm */}
            <Card style={{ borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Space size={12}>
                        <Text strong>Lọc theo Chi nhánh:</Text>
                        <Select
                            style={{ width: 260, borderRadius: 8 }}
                            placeholder="Tất cả chi nhánh"
                            value={selectedBranchId}
                            onChange={setSelectedBranchId}
                            allowClear
                        >
                            <Select.Option value={null}>🌐 Tất cả chi nhánh</Select.Option>
                            {branches.map((b) => (
                                <Select.Option key={b.id} value={b.id}>
                                    🏢 {b.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Space>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        style={{ borderRadius: 8, background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', border: 'none' }}
                    >
                        Thêm ngày nghỉ lễ mới
                    </Button>
                </div>
            </Card>

            {/* Bảng danh sách ngày nghỉ */}
            <Card style={{ borderRadius: 12 }}>
                <OffDayTable
                    offDays={filteredOffDays}
                    loading={loading}
                    onDelete={handleDelete}
                />
            </Card>

            <OffDayFormModal
                open={isModalOpen}
                branches={branches}
                submitting={submitting}
                onCancel={() => setIsModalOpen(false)}
                onSubmit={handleCreate}
            />
        </div>
    );
};

export default OffDayManagementPage;