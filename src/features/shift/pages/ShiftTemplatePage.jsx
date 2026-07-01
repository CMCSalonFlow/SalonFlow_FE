import { useEffect, useState } from "react";
import {
    Button,
    Table,
    Space,
    Tag,
    Popconfirm,
    message,
    Typography,
    Modal,
    DatePicker,
    Checkbox,
    Card,
    Row,
    Col,
    Empty,
    Spin,
    Select,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CalendarOutlined,
    CheckOutlined,
    ShopOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
} from "../api/shiftApi";

import ShiftTemplateFormModal from "../components/ShiftTemplateFormModal";
import { getMyBranchesApi, getBranchUsersApi } from "@/features/branch/api/branchApi";
dayjs.extend(isoWeek);

const { Title, Text } = Typography;

const DAY_NAMES = {
    1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4",
    4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "CN",
};

/**
 * Trang quản lý template ca làm việc.
 * Route: /owner/shifts
 *
 * Props:
 *   userId   — ID staff hiện tại (lấy từ auth context sau)
 *   branchId — ID chi nhánh đang chọn
 *   users    — danh sách staff để hiện dropdown
 *   branches — danh sách chi nhánh
 */
export default function ShiftTemplatePage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);

    const [branches, setBranches] = useState([]);
    const [users, setUsers] = useState([]);
    const [branchId, setBranchId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // Modal tạo/sửa template
    const [formOpen, setFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    // Modal áp dụng template
    const [applyOpen, setApplyOpen] = useState(false);
    const [applyingTemplate, setApplyingTemplate] = useState(null);
    const [applyWeek, setApplyWeek] = useState(null);
    const [applyOverwrite, setApplyOverwrite] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);

    const loadBranches = async () => {
        try {
            const data = await getMyBranchesApi();
            setBranches(data);
            if (data.length > 0) {
                setBranchId(data[0].id);
            }
        } catch {
            message.error("Không thể tải danh sách chi nhánh");
        }
    };

    const loadUsers = async () => {
        try {
            const data = await getBranchUsersApi(branchId);
            setUsers(data);
        } catch {
            message.error("Không thể tải nhân viên");
        }
    };

    const loadTemplates = async () => {
        if (!branchId) return;

        setLoading(true);
        try {
            const data = await getTemplates(selectedUserId || undefined, branchId);
            setTemplates(data);
        } catch {
            message.error("Không thể tải danh sách template");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadBranches();
    }, []);

    useEffect(() => {
        if (!branchId) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId]);

    useEffect(() => {
        if (!branchId) return;

        loadUsers();
    }, [branchId]);
    useEffect(() => {
        if (!selectedUserId) return;

        loadTemplates();
    }, [selectedUserId]);
    const openCreate = () => {
        setEditingTemplate({ branchId });
        setFormOpen(true);
    };

    const openEdit = (template) => {
        setEditingTemplate(template);
        setFormOpen(true);
    };

    const handleFormSubmit = async (payload) => {
        try {
            if (editingTemplate && editingTemplate.id) {
                await updateTemplate(editingTemplate.id, payload);
                message.success("Cập nhật template thành công");
            } else {
                await createTemplate(payload);
                message.success("Tạo template thành công");
            }
            setFormOpen(false);
            loadTemplates();
        } catch (err) {
            const msg = err?.response?.data?.message || "Có lỗi xảy ra";
            message.error(msg);
            throw err;
        }
    };

    const handleDelete = async (templateId) => {
        try {
            await deleteTemplate(templateId);
            message.success("Đã xóa template");
            loadTemplates();
        } catch {
            message.error("Xóa thất bại");
        }
    };

    // Mở modal áp dụng template
    const openApply = (template) => {
        setApplyingTemplate(template);
        setApplyWeek(null);
        setApplyOverwrite(false);
        setApplyOpen(true);
    };

    // Áp dụng tuần này
    const handleApplyThisWeek = () => {
        const monday = dayjs().isoWeekday(1);
        setApplyWeek(monday);
    };

    // Áp dụng tuần sau
    const handleApplyNextWeek = () => {
        const monday = dayjs().add(1, "week").isoWeekday(1);
        setApplyWeek(monday);
    };

    const handleApplyConfirm = async () => {
        if (!applyWeek) {
            message.error("Vui lòng chọn tuần muốn áp dụng");
            return;
        }
        setApplyLoading(true);
        try {
            const weekStartDate = applyWeek.format("YYYY-MM-DD");
            const shifts = await applyTemplate(
                applyingTemplate.id,
                weekStartDate,
                applyOverwrite
            );
            message.success(
                Array.isArray(shifts)
                    ? `Đã tạo ${shifts.length} ca làm việc`
                    : "Áp dụng template thành công"
            );
            setApplyOpen(false);
        } catch (err) {
            const msg = err?.response?.data?.message || "Áp dụng thất bại";
            message.error(msg);
        } finally {
            setApplyLoading(false);
        }
    };

    // Cột bảng danh sách template
    const columns = [
        {
            title: "Tên template",
            dataIndex: "name",
            key: "name",
            render: (name, record) => (
                <div>
                    <Text strong>{name}</Text>
                    {record.description && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.description}
                            </Text>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Nhân viên",
            dataIndex: "userName",
            key: "userName",
            render: (userName, record) => record.user?.fullName || record.user?.username || userName || "N/A"
        },
        {
            title: "Chi nhánh",
            dataIndex: "branchName",
            key: "branchName",
            render: (branchName, record) => record.branch?.name || branchName || "N/A"
        },
        {
            title: "Lịch trong tuần",
            dataIndex: "details",
            key: "details",
            render: (details = []) => (
                <Space wrap>
                    {details
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((d) => (
                            <Tag key={d.dayOfWeek} color="blue">
                                {DAY_NAMES[d.dayOfWeek]}{" "}
                                {d.startTime?.slice(0, 5)} -{" "}
                                {d.endTime?.slice(0, 5)}
                            </Tag>
                        ))}
                </Space>
            ),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button
                        size="small"
                        icon={<CalendarOutlined />}
                        type="primary"
                        onClick={() => openApply(record)}
                    >
                        Áp dụng
                    </Button>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(record)}
                    />
                    <Popconfirm
                        title="Xóa template này?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }} gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Title level={3} style={{ margin: 0 }}>
                        Template ca làm việc
                    </Title>
                    <Text type="secondary">Quản lý các template ca làm việc cố định theo tuần của nhân viên.</Text>
                </Col>
                <Col xs={24} md={16} style={{ textAlign: "right" }}>
                    <Space wrap style={{ display: "inline-flex", justifyContent: "flex-end" }}>
                        <Space>
                            <ShopOutlined style={{ color: "#1890ff" }} />
                            <Text strong>Chi nhánh:</Text>
                            <Select
                                style={{ width: 180 }}
                                value={branchId}
                                onChange={(val) => {
                                    setBranchId(val);
                                    setSelectedUserId(null);
                                }}
                                options={branches.map((b) => ({
                                    label: b.name,
                                    value: b.id,
                                }))}
                            />
                        </Space>
                        <Space>
                            <TeamOutlined style={{ color: "#1890ff" }} />
                            <Text strong>Nhân viên:</Text>
                            <Select
                                style={{ width: 180 }}
                                value={selectedUserId}
                                onChange={setSelectedUserId}
                                placeholder="Tất cả nhân viên"
                                allowClear
                                options={users.map((u) => ({
                                    label: u.fullName || u.username,
                                    value: u.id,
                                }))}
                            />
                        </Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={openCreate}
                        >
                            Tạo template mới
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Spin spinning={loading}>
                <Table
                    dataSource={templates}
                    columns={columns}
                    rowKey="id"
                    locale={{ emptyText: <Empty description="Chưa có template nào" /> }}
                />
            </Spin>

            {/* Modal tạo/sửa template */}
            <ShiftTemplateFormModal
                open={formOpen}
                onCancel={() => setFormOpen(false)}
                onSuccess={handleFormSubmit}
                initialValues={editingTemplate}
                users={users}
                branches={branches}
            />

            {/* Modal áp dụng template vào tuần */}
            <Modal
                title={`Áp dụng template: ${applyingTemplate?.name}`}
                open={applyOpen}
                onCancel={() => setApplyOpen(false)}
                onOk={handleApplyConfirm}
                confirmLoading={applyLoading}
                okText="Xác nhận áp dụng"
                cancelText="Hủy"
            >
                <div style={{ marginBottom: 16 }}>
                    <Text>Chọn tuần muốn áp dụng:</Text>
                </div>

                {/* 2 nút shortcut */}
                <Row gutter={8} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Button
                            block
                            type={
                                applyWeek?.isSame(
                                    dayjs().isoWeekday(1),
                                    "day"
                                )
                                    ? "primary"
                                    : "default"
                            }
                            icon={<CheckOutlined />}
                            onClick={handleApplyThisWeek}
                        >
                            Tuần này
                            <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {dayjs().isoWeekday(1).format("DD/MM")} -{" "}
                                {dayjs().isoWeekday(7).format("DD/MM")}
                            </div>
                        </Button>
                    </Col>
                    <Col span={12}>
                        <Button
                            block
                            type={
                                applyWeek?.isSame(
                                    dayjs().add(1, "week").isoWeekday(1),
                                    "day"
                                )
                                    ? "primary"
                                    : "default"
                            }
                            icon={<CalendarOutlined />}
                            onClick={handleApplyNextWeek}
                        >
                            Tuần sau
                            <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {dayjs()
                                    .add(1, "week")
                                    .isoWeekday(1)
                                    .format("DD/MM")}{" "}
                                -{" "}
                                {dayjs()
                                    .add(1, "week")
                                    .isoWeekday(7)
                                    .format("DD/MM")}
                            </div>
                        </Button>
                    </Col>
                </Row>

                {/* Hoặc chọn tuần bất kỳ bằng DatePicker */}
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary">Hoặc chọn tuần khác:</Text>
                    <DatePicker
                        picker="week"
                        style={{ width: "100%", marginTop: 8 }}
                        value={applyWeek}
                        onChange={(week) => {
                            if (week) {
                                setApplyWeek(week.isoWeekday(1));
                            }
                        }}
                        format="[Tuần] ww/YYYY"
                        placeholder="Chọn tuần"
                    />
                </div>

                {applyWeek && (
                    <Card
                        size="small"
                        style={{ background: "#f0f7ff", marginBottom: 16 }}
                    >
                        <Text>
                            Sẽ áp dụng cho tuần:{" "}
                            <Text strong>
                                {applyWeek.format("DD/MM/YYYY")} -{" "}
                                {applyWeek.add(6, "day").format("DD/MM/YYYY")}
                            </Text>
                        </Text>
                    </Card>
                )}

                <Checkbox
                    checked={applyOverwrite}
                    onChange={(e) => setApplyOverwrite(e.target.checked)}
                >
                    Ghi đè ca đã có trong tuần đó
                </Checkbox>
                <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Nếu không tích, những ngày đã có ca sẽ được bỏ qua
                    </Text>
                </div>
            </Modal>
        </div>
    );
}