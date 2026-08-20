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
    Tabs
} from "antd";
import { PlusOutlined, CalendarOutlined, GlobalOutlined, BankOutlined, UserOutlined, ClockCircleOutlined } from "@ant-design/icons";

import OffDayFormModal from "../components/OffDayFormModal";
import OffDayTable from "../components/OffDayTable";
import OwnerLeaveApprovalTab from "../components/OwnerLeaveApprovalTab";

import { useOffDays } from "../hooks/useOffDays";
import offdayApi from "../api/offdayApi";
import { getBranchesApi } from "@/features/branch/api/branchApi";
import { useLocation } from "react-router-dom";
import { getRoles } from "@/core/utils/auth";

const { Title, Text } = Typography;

const OffDayManagementPage = () => {
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [userRole, setUserRole] = useState("MANAGER");

    const { offDays, loading, reload } = useOffDays();

    useEffect(() => {
        loadBranches();
        const isManagerPath = location.pathname.startsWith("/manager");
        const roles = getRoles();
        const hasOwnerRole = Array.isArray(roles) && roles.some(r => r === "SALON_OWNER" || r === "ROLE_SALON_OWNER");
        
        if (!isManagerPath && hasOwnerRole) {
            setUserRole("SALON_OWNER");
        } else {
            setUserRole("MANAGER");
        }
    }, [location.pathname]);

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

    const filteredOffDays = useMemo(() => {
        if (!selectedBranchId) return offDays;
        return offDays.filter(item => item.isAllBranches || item.branchId === selectedBranchId);
    }, [offDays, selectedBranchId]);

    const totalGlobal = useMemo(() => offDays.filter(i => i.isAllBranches).length, [offDays]);
    const totalBranchSpecific = useMemo(() => offDays.filter(i => !i.isAllBranches).length, [offDays]);

    const isOwner = userRole === "SALON_OWNER" || userRole === "ROLE_SALON_OWNER";

    const tabItems = useMemo(() => {
        const items = [];
        
        if (isOwner) {
            items.push({
                key: "system_offdays",
                label: "Ngày Nghỉ Lễ & Đóng Cửa Salon",
                children: (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Thống kê nhanh */}
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={8}>
                                <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #1890ff' }}>
                                    <Statistic
                                        title="Tổng số Dịp Nghỉ Lễ"
                                        value={offDays.length}
                                        suffix="dịp"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #ff4d4f' }}>
                                    <Statistic
                                        title="Nghỉ Lễ Toàn Salon"
                                        value={totalGlobal}
                                        suffix="dịp"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card size="small" style={{ borderRadius: 12, borderLeft: '4px solid #fa8c16' }}>
                                    <Statistic
                                        title="Nghỉ / Đóng Cửa Chi Nhánh"
                                        value={totalBranchSpecific}
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
                                        <Select.Option value={null}>Tất cả chi nhánh</Select.Option>
                                        {branches.map((b) => (
                                            <Select.Option key={b.id} value={b.id}>
                                                {b.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Space>

                                <Button
                                    type="primary"
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
                )
            });
        }

        items.push({
            key: "staff_leave_requests",
            label: isOwner ? "Duyệt Đơn Xin Nghỉ Phép Cá Nhân" : "Duyệt Đơn Xin Nghỉ Phép Nhân Viên",
            children: (
                <Card style={{ borderRadius: 12 }}>
                    <OwnerLeaveApprovalTab branches={branches} userRole={userRole} />
                </Card>
            )
        });

        return items;
    }, [isOwner, offDays, totalGlobal, totalBranchSpecific, selectedBranchId, branches, filteredOffDays, loading, isModalOpen, submitting, userRole]);

    return (
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Title level={3} style={{ margin: 0 }}>
                    {isOwner ? "Quản Lý Ngày Nghỉ Lễ & Đơn Xin Nghỉ Phép" : "Phê Duyệt Đơn Xin Nghỉ Phép Nhân Viên Chi Nhánh"}
                </Title>
                <Text type="secondary">
                    {isOwner 
                        ? "Cấu hình ngày nghỉ lễ toàn Salon, đóng cửa chi nhánh và phê duyệt đơn xin nghỉ phép cá nhân từ Nhân viên & Manager."
                        : "Phê duyệt đơn xin nghỉ phép của các Kỹ thuật viên / Nhân viên thuộc chi nhánh quản lý."}
                </Text>
            </div>

            <Tabs defaultActiveKey={isOwner ? "system_offdays" : "staff_leave_requests"} items={tabItems} size="large" />
        </div>
    );
};

export default OffDayManagementPage;