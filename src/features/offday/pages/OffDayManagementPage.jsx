import { useEffect, useState, useMemo, useCallback } from "react";
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
    Tabs,
    Grid,
    Spin
} from "antd";

import OffDayFormModal from "../components/OffDayFormModal";
import OffDayTable from "../components/OffDayTable";
import OwnerLeaveApprovalTab from "../components/OwnerLeaveApprovalTab";

import { useOffDays } from "../hooks/useOffDays";
import offdayApi from "../api/offdayApi";
import { getMyBranchesApi, getBranchesApi } from "@/features/branch/api/branchApi";
import { useLocation } from "react-router-dom";
import { getRoles } from "@/core/utils/auth";
import NoBranchCard from "@/core/components/NoBranchCard";

const { Title, Text } = Typography;

const OffDayManagementPage = () => {
    const screens = Grid.useBreakpoint();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    const isManagerPath = location.pathname.startsWith("/manager");
    const roles = getRoles();
    const hasOwnerRole = Array.isArray(roles) && roles.some(r => r === "SALON_OWNER" || r === "ROLE_SALON_OWNER");
    const isOwner = !isManagerPath && hasOwnerRole;
    const userRole = isOwner ? "SALON_OWNER" : "MANAGER";

    const loadBranches = useCallback(async (ownerMode) => {
        setLoadingBranches(true);
        try {
            const fetcher = ownerMode ? getMyBranchesApi : getBranchesApi;
            const data = await fetcher();
            setBranches(Array.isArray(data) ? data : []);
        } catch {
            setBranches([]);
        } finally {
            setLoadingBranches(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadBranches(isOwner);
    }, [loadBranches, isOwner]);

    const { offDays, loading, reload } = useOffDays(!isOwner || branches.length > 0);

    const handleCreate = useCallback(async (values) => {
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
    }, [reload]);

    const handleDelete = useCallback(async (id) => {
        try {
            await offdayApi.deleteSystemOffDay(id);
            message.success("Xóa ngày nghỉ thành công!");
            reload();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Xóa ngày nghỉ thất bại!");
        }
    }, [reload]);

    const filteredOffDays = useMemo(() => {
        if (!selectedBranchId) return offDays;
        return offDays.filter(item => item.isAllBranches || item.branchId === selectedBranchId);
    }, [offDays, selectedBranchId]);

    const totalGlobal = useMemo(() => offDays.filter(i => i.isAllBranches).length, [offDays]);
    const totalBranchSpecific = useMemo(() => offDays.filter(i => !i.isAllBranches).length, [offDays]);

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
                                <Space size={12} style={{ width: screens.xs ? "100%" : "auto" }} direction={screens.xs ? "vertical" : "horizontal"}>
                                    <Text strong>Lọc theo Chi nhánh:</Text>
                                    <Select
                                        style={{ width: screens.xs ? "100%" : 260, borderRadius: 8 }}
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
                                    style={{ borderRadius: 8, background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', border: 'none', width: screens.xs ? "100%" : "auto" }}
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
    }, [isOwner, offDays, totalGlobal, totalBranchSpecific, selectedBranchId, branches, filteredOffDays, loading, isModalOpen, submitting, userRole, screens, handleCreate, handleDelete]);

    if (isOwner && loadingBranches) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (isOwner && branches.length === 0) {
        return (
            <div style={{ padding: screens.sm ? 24 : "12px 8px" }}>
                <NoBranchCard
                    title="Bạn chưa tạo Chi nhánh nào!"
                    description="Vui lòng thêm ít nhất một chi nhánh cho Salon của bạn trước khi thiết lập ngày nghỉ và duyệt đơn nghỉ phép."
                    targetUrl="/owner/branches"
                />
            </div>
        );
    }

    return (
        <div style={{ padding: screens.sm ? 24 : "12px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Title level={screens.xs ? 4 : 3} style={{ margin: 0 }}>
                    {isOwner ? "Quản Lý Ngày Nghỉ Lễ & Đơn Xin Nghỉ Phép" : "Phê Duyệt Đơn Xin Nghỉ Phép Nhân Viên Chi Nhánh"}
                </Title>
                <Text type="secondary" style={{ fontSize: screens.xs ? 13 : 14 }}>
                    {isOwner 
                        ? "Cấu hình ngày nghỉ lễ toàn Salon, đóng cửa chi nhánh và phê duyệt đơn xin nghỉ phép cá nhân từ Nhân viên & Manager."
                        : "Phê duyệt đơn xin nghỉ phép của các Kỹ thuật viên / Nhân viên thuộc chi nhánh quản lý."}
                </Text>
            </div>

            <Tabs defaultActiveKey={isOwner ? "system_offdays" : "staff_leave_requests"} items={tabItems} size={screens.xs ? "middle" : "large"} />
        </div>
    );
};

export default OffDayManagementPage;