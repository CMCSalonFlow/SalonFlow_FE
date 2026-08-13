import { useEffect, useState } from "react";
import { Card, Select, Button, Table, Tag, Space, Popconfirm, message, Typography, Row, Col, Spin, Avatar, Empty } from "antd";
import { UserAddOutlined, EditOutlined, DeleteOutlined, ShopOutlined, IdcardOutlined, ContactsOutlined } from "@ant-design/icons";
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
            width: "25%",
            render: (_, record) => (
                <Space size="middle">
                    <Avatar 
                        size={52} 
                        src={record.avatarUrl} 
                        icon={<IdcardOutlined />} 
                        style={{ border: "2px solid #1890ff" }}
                    />
                    <div>
                        <Text strong style={{ fontSize: 16 }}>{record.name}</Text>
                        {record.email && (
                            <>
                                <br />
                                <Text type="secondary" style={{ fontSize: 13 }}>📧 {record.email}</Text>
                            </>
                        )}
                        {record.phone && (
                            <>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>📞 {record.phone}</Text>
                            </>
                        )}
                    </div>

                </Space>
            )
        },
        {
            title: "Chuyên môn",
            dataIndex: "specialties",
            key: "specialties",
            width: "20%",
            render: (text) => {
                if (!text) return <Text type="secondary">-</Text>;
                const tags = text.split(",").map(t => t.trim()).filter(Boolean);
                return (
                    <Space wrap>
                        {tags.map(tag => (
                            <Tag color="blue" key={tag} style={{ borderRadius: 4 }}>
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
            width: "35%",
            render: (items) => (
                <Space wrap size={[4, 8]}>
                    {items && items.length > 0 ? (
                        items.map(item => (
                            <Tag color="green" key={item.id}>
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
            title: "Thao tác",
            key: "actions",
            width: "15%",
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

    // Lấy danh sách các chuyên môn duy nhất từ danh sách nhân viên
    const uniqueSpecialties = Array.from(
        new Set(
            staffList
                .flatMap(s => (s.specialties || "").split(","))
                .map(t => t.trim())
                .filter(Boolean)
        )
    );

    // Lọc danh sách nhân viên hiển thị theo nhiều chuyên môn được chọn (AND match)
    const filteredStaffList = staffList.filter(s => {
        if (selectedSpecialties.length === 0) return true;
        const specs = (s.specialties || "").split(",").map(t => t.trim().toLowerCase());
        return selectedSpecialties.every(selected => specs.includes(selected.toLowerCase()));
    });

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
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        <ContactsOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Quản lý Nhân sự
                    </Title>
                    <Text type="secondary">Quản lý hồ sơ nhân viên, chuyên môn kỹ năng và phân công dịch vụ tại từng chi nhánh.</Text>
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

            <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                {loadingData ? (
                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                        <Spin tip="Đang tải dữ liệu nhân viên..." />
                    </div>
                ) : (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                            <Title level={4} style={{ margin: 0 }}>Đội ngũ nhân sự ({filteredStaffList.length})</Title>
                            <Space size="middle" style={{ flexWrap: "wrap" }}>
                                <Space>
                                    <Text strong>Chuyên môn:</Text>
                                    <Select
                                        mode="multiple"
                                        style={{ minWidth: 200, maxWidth: 350 }}
                                        value={selectedSpecialties}
                                        onChange={setSelectedSpecialties}
                                        options={uniqueSpecialties.map(spec => ({ label: spec, value: spec }))}
                                        placeholder="Tất cả chuyên môn"
                                        maxTagCount="responsive"
                                        allowClear
                                    />
                                </Space>
                                <Button
                                    type="primary"
                                    icon={<UserAddOutlined />}
                                    size="large"
                                    onClick={() => {
                                        setEditingStaff(null);
                                        setModalVisible(true);
                                    }}
                                >
                                    Thêm nhân viên mới
                                </Button>
                            </Space>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={filteredStaffList}
                            rowKey="id"
                            pagination={{ pageSize: 6 }}
                            bordered
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
