import { useEffect, useState, useMemo } from "react";
import { Card, Select, Button, Table, Tag, Space, Popconfirm, message, Typography, Row, Col, Spin, Avatar, Empty, Grid } from "antd";
import { UserAddOutlined, EditOutlined, DeleteOutlined, ShopOutlined, IdcardOutlined, UserOutlined } from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getServicesByBranchApi } from "@/features/service/api/serviceApi";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import {
    getStaffByBranchApi,
    createStaffApi,
    updateStaffApi,
    deleteStaffApi
} from "../api/staffApi";
import StaffFormModal from "../components/StaffFormModal";

const { Title, Text, Paragraph } = Typography;

/**
 * Trang quản lý nhân sự (StaffManagementPage) dành cho chủ Salon (Owner).
 */
export default function StaffManagementPage() {
    const screens = Grid.useBreakpoint();
    const { openLimitModal } = useSubscription();
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);

    const [staffList, setStaffList] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedSpecialties, setSelectedSpecialties] = useState([]);

    // Trạng thái hiển thị modal form
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    // Tải danh sách chi nhánh thuộc sở hữu của user hiện tại
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
            } catch (error) {
                message.error("Không thể tải danh sách chi nhánh.");
                setLoadingBranches(false);
            }
        };
        loadBranches();
    }, []);

    // Tải thông tin nhân viên và danh sách dịch vụ rảnh của chi nhánh được chọn
    const loadData = async (branchId) => {
        if (!branchId) return;
        setLoadingData(true);
        try {
            const [staffData, servicesData] = await Promise.all([
                getStaffByBranchApi(branchId),
                getServicesByBranchApi(branchId)
            ]);
            setStaffList(staffData);
            setServices(servicesData.filter(s => s.isActive)); // Chỉ lấy dịch vụ đang hoạt động
        } catch (error) {
            message.error("Lỗi khi tải dữ liệu nhân viên hoặc dịch vụ.");
        } finally {
            setLoadingData(false);
            setLoadingBranches(false);
        }
    };

    useEffect(() => {
        if (selectedBranchId) {
            loadData(selectedBranchId);
            setSelectedSpecialties([]); // Reset bộ lọc chuyên môn (mảng rỗng) khi đổi chi nhánh
        }
    }, [selectedBranchId]);

    // Xử lý Thêm / Sửa nhân viên
    const handleSubmit = async (payload) => {
        try {
            setLoadingData(true);
            if (editingStaff) {
                await updateStaffApi(selectedBranchId, editingStaff.id, payload);
                message.success("Cập nhật thông tin nhân viên thành công!");
            } else {
                await createStaffApi(selectedBranchId, payload);
                message.success("Thêm nhân viên mới thành công!");
            }
            setModalVisible(false);
            setEditingStaff(null);
            loadData(selectedBranchId);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Lỗi khi lưu thông tin nhân viên.";
            if (errorMsg.includes("Giới hạn") || errorMsg.includes("hạn mức") || errorMsg.includes("vượt quá") || errorMsg.includes("gói đăng ký")) {
                openLimitModal(errorMsg);
            } else {
                message.error(errorMsg);
            }
            setLoadingData(false);
        }
    };

    // Xử lý Xóa nhân viên
    const handleDelete = async (staffId) => {
        try {
            setLoadingData(true);
            await deleteStaffApi(selectedBranchId, staffId);
            message.success("Xóa nhân viên thành công!");
            loadData(selectedBranchId);
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi xóa nhân viên.");
            setLoadingData(false);
        }
    };

    // Định nghĩa các cột cho bảng quản lý nhân sự
    const columns = [
        {
            title: "Nhân viên",
            key: "staffInfo",
            width: 260,
            render: (_, record) => (
                <Space size="middle" style={{ whiteSpace: "nowrap" }}>
                    <Avatar 
                        size={48} 
                        src={record.avatarUrl} 
                        icon={<IdcardOutlined />} 
                        style={{ border: "2px solid #1890ff", flexShrink: 0 }}
                    />
                    <div>
                        <Text strong style={{ fontSize: 15, display: "block" }}>{record.name}</Text>
                        {record.email && (
                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>📧 {record.email}</Text>
                        )}
                        {record.phone && (
                            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>📞 {record.phone}</Text>
                        )}
                    </div>
                </Space>
            )
        },
        {
            title: "Chuyên môn",
            dataIndex: "specialties",
            key: "specialties",
            width: 180,
            render: (text) => {
                if (!text) return <Text type="secondary">-</Text>;
                const tags = text.split(",").map(t => t.trim()).filter(Boolean);
                return (
                    <Space wrap size={[4, 6]}>
                        {tags.map(tag => (
                            <Tag color="blue" key={tag} style={{ borderRadius: 4, margin: 0 }}>
                                {tag}
                            </Tag>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: "Dịch vụ thực hiện",
            dataIndex: "services",
            key: "services",
            width: 240,
            render: (items) => (
                <Space wrap size={[4, 6]}>
                    {items && items.length > 0 ? (
                        items.map(item => (
                            <Tag color="green" key={item.id} style={{ margin: 0 }}>
                                {item.name}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">Chưa phân công dịch vụ</Text>
                    )}
                </Space>
            )
        },
        {
            title: "Vai trò",
            key: "roleCode",
            width: 140,
            render: (_, record) => {
                const isManager = record.roleCode === "MANAGER";
                return isManager ? (
                    <Tag color="gold" style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}>
                        Quản lý
                    </Tag>
                ) : (
                    <Tag color="blue" style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}>
                        Thợ
                    </Tag>
                );
            }
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined style={{ color: "#1890ff" }} />}
                        onClick={() => {
                            setEditingStaff(record);
                            setModalVisible(true);
                        }}
                    >
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Xóa nhân sự này?"
                        description="Hành động này sẽ xóa nhân viên ra khỏi danh sách chi nhánh và không thể hoàn tác."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // Lấy danh sách các chuyên môn duy nhất từ danh sách nhân viên (memoized)
    const uniqueSpecialties = useMemo(() => {
        return Array.from(
            new Set(
                staffList
                    .flatMap(s => (s.specialties || "").split(","))
                    .map(t => t.trim())
                    .filter(Boolean)
            )
        );
    }, [staffList]);

    // Lọc danh sách nhân viên hiển thị theo nhiều chuyên môn được chọn (memoized)
    const filteredStaffList = useMemo(() => {
        return staffList.filter(s => {
            if (selectedSpecialties.length === 0) return true;
            const specs = (s.specialties || "").split(",").map(t => t.trim().toLowerCase());
            return selectedSpecialties.every(selected => specs.includes(selected.toLowerCase()));
        });
    }, [staffList, selectedSpecialties]);

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
                        Vui lòng thêm ít nhất một chi nhánh cho Salon của bạn trước khi quản lý đội ngũ nhân viên.
                    </Paragraph>
                    <Button type="primary" size="large" href="/owner/branches">
                        Tới trang Quản lý Chi nhánh
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: screens.xs ? "0 4px" : "10px 0" }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }} gutter={[16, 16]}>
                <Col xs={24} md={13}>
                    <Title level={screens.xs ? 3 : 2} style={{ margin: 0 }}>
                        Quản lý Nhân sự
                    </Title>
                    <Text type="secondary" style={{ fontSize: screens.xs ? 13 : 14 }}>
                        Quản lý hồ sơ nhân viên, chuyên môn kỹ năng và phân công dịch vụ tại từng chi nhánh.
                    </Text>
                </Col>
                <Col xs={24} md={11} style={{ display: "flex", justifyContent: screens.md ? "flex-end" : "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: screens.xs ? "100%" : "auto" }}>
                        <Space style={{ flexShrink: 0 }}>
                            <ShopOutlined style={{ color: "#1890ff" }} />
                            <Text strong>Chọn Chi nhánh:</Text>
                        </Space>
                        <Select
                            style={{ flex: screens.xs ? 1 : undefined, width: screens.xs ? undefined : 220 }}
                            value={selectedBranchId}
                            onChange={setSelectedBranchId}
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                            size={screens.xs ? "middle" : "large"}
                        />
                    </div>
                </Col>
            </Row>

            <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }} styles={{ body: { padding: screens.xs ? 12 : 24 } }}>
                {loadingData ? (
                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                        <Spin tip="Đang tải dữ liệu nhân viên..." />
                    </div>
                ) : (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                            <Title level={4} style={{ margin: 0 }}>Đội ngũ nhân sự ({filteredStaffList.length})</Title>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: screens.xs ? "100%" : "auto" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: screens.xs ? "1 1 100%" : "none" }}>
                                    <Text strong style={{ flexShrink: 0 }}>Chuyên môn:</Text>
                                    <Select
                                        mode="multiple"
                                        style={{ width: screens.xs ? "100%" : 240 }}
                                        value={selectedSpecialties}
                                        onChange={setSelectedSpecialties}
                                        options={uniqueSpecialties.map(spec => ({ label: spec, value: spec }))}
                                        placeholder="Tất cả chuyên môn"
                                        maxTagCount={1}
                                        allowClear
                                    />
                                </div>
                                <Button
                                    type="primary"
                                    icon={<UserAddOutlined />}
                                    size={screens.xs ? "middle" : "large"}
                                    block={screens.xs}
                                    onClick={() => {
                                        setEditingStaff(null);
                                        setModalVisible(true);
                                    }}
                                >
                                    Thêm nhân viên mới
                                </Button>
                            </div>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={filteredStaffList}
                            rowKey="id"
                            pagination={{ pageSize: 6 }}
                            bordered
                            scroll={{ x: 940 }}
                            locale={{
                                emptyText: <Empty description="Chưa có nhân viên nào tại chi nhánh này." />
                            }}
                        />
                    </div>
                )}
            </Card>

            {/* Form modal Thêm / Sửa nhân viên */}
            <StaffFormModal
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingStaff(null);
                }}
                onSubmit={handleSubmit}
                initialValues={editingStaff}
                services={services}
            />
        </div>
    );
}
