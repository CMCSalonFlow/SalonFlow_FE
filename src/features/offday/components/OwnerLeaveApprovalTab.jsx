import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Select, Space, Typography, Row, Col, Statistic, Modal, Form, Input, Popconfirm, message, Avatar, Badge, Grid } from "antd";
import { CheckOutlined, CloseOutlined, ClockCircleOutlined, UserOutlined, ShopOutlined, FilterOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import offdayApi from "../api/offdayApi";

const { Text } = Typography;
const { Option } = Select;

const LEAVE_TYPE_MAP = {
    PERSONAL: { label: "Việc riêng", color: "blue" },
    SICK: { label: "Nghỉ bệnh", color: "volcano" },
    ANNUAL: { label: "Phép năm", color: "green" },
    OTHER: { label: "Khác", color: "default" }
};

const STATUS_MAP = {
    PENDING: { label: "Chờ duyệt", color: "warning" },
    APPROVED: { label: "Đã duyệt", color: "success" },
    REJECTED: { label: "Từ chối", color: "error" },
    CANCELLED: { label: "Đã hủy", color: "default" }
};

export default function OwnerLeaveApprovalTab({ branches = [], userRole = "SALON_OWNER" }) {
    const screens = Grid.useBreakpoint();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("ALL");

    // Modal từ chối đơn
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [targetRequestId, setTargetRequestId] = useState(null);
    const [rejectForm] = Form.useForm();
    const [rejecting, setRejecting] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedStatus && selectedStatus !== "ALL") {
                params.status = selectedStatus;
            }
            if (selectedBranchId) {
                params.branchId = selectedBranchId;
            }
            const data = await offdayApi.getApprovalLeaveRequests(params);
            setRequests(Array.isArray(data) ? data : []);
        } catch {
            message.error("Không thể tải danh sách đơn xin nghỉ phép.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedBranchId, selectedStatus]);

    const handleApprove = async (id) => {
        try {
            await offdayApi.approveLeaveRequest(id);
            message.success("Đã phê duyệt đơn xin nghỉ phép! Lịch của nhân viên đã được khóa.");
            loadData();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi phê duyệt đơn.");
        }
    };

    const handleOpenRejectModal = (id) => {
        setTargetRequestId(id);
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async (values) => {
        if (!targetRequestId) return;
        try {
            setRejecting(true);
            await offdayApi.rejectLeaveRequest(targetRequestId, values.rejectionReason);
            message.success("Đã từ chối đơn xin nghỉ phép.");
            setRejectModalOpen(false);
            rejectForm.resetFields();
            loadData();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi từ chối đơn.");
        } finally {
            setRejecting(false);
        }
    };

    const stats = {
        pending: requests.filter(r => r.status === "PENDING").length,
        approved: requests.filter(r => r.status === "APPROVED").length,
        rejected: requests.filter(r => r.status === "REJECTED").length
    };

    const columns = [
        {
            title: "Nhân viên xin nghỉ",
            key: "staff",
            render: (_, record) => (
                <div>
                    <Text strong style={{ fontSize: 15 }}>{record.staffName || "Nhân viên"}</Text>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        {record.staffRole || "Nhân viên"}
                    </div>
                </div>
            )
        },
        {
            title: "Chi nhánh",
            dataIndex: "branchName",
            key: "branchName",
            render: (text) => (
                <Tag color="cyan">{text || "Chi nhánh"}</Tag>
            )
        },
        {
            title: "Thời gian nghỉ",
            key: "dates",
            render: (_, record) => (
                <div>
                    <Text strong style={{ color: "#d46b08" }}>
                        {dayjs(record.dateFrom).format("DD/MM/YYYY")} ➔ {dayjs(record.dateTo).format("DD/MM/YYYY")}
                    </Text>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        Số ngày: <b>{record.totalDays || 1} ngày</b>
                    </div>
                </div>
            )
        },
        {
            title: "Loại nghỉ",
            dataIndex: "leaveType",
            key: "leaveType",
            render: (type) => {
                const info = LEAVE_TYPE_MAP[type] || LEAVE_TYPE_MAP.PERSONAL;
                return <Tag color={info.color}>{info.label}</Tag>;
            }
        },
        {
            title: "Lý do xin nghỉ",
            dataIndex: "reason",
            key: "reason",
            render: (text, record) => (
                <div style={{ maxWidth: 220 }}>
                    <Text style={{ fontSize: 13 }}>{text || "Không có ghi chú"}</Text>
                    {record.rejectionReason && (
                        <div style={{ fontSize: 12, color: "#ff4d4f", marginTop: 4 }}>
                            Lý do từ chối: <i>{record.rejectionReason}</i>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                const info = STATUS_MAP[status] || STATUS_MAP.PENDING;
                return <Tag color={info.color} style={{ fontSize: 13, padding: "2px 8px" }}>{info.label}</Tag>;
            }
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => {
                const isOwner = userRole === "SALON_OWNER" || userRole === "ROLE_SALON_OWNER";
                const isManagerApplicant = record.staffRole?.includes("Manager") || record.staffRole?.includes("Owner");

                if (record.status === "PENDING") {
                    if (!isOwner && isManagerApplicant) {
                        return (
                            <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
                                Chờ Owner duyệt
                            </Text>
                        );
                    }

                    return (
                        <Space>
                            <Popconfirm
                                title="Phê duyệt đơn xin nghỉ"
                                description="Bạn có chắc chắn muốn duyệt đơn xin nghỉ phép này không? Hệ thống sẽ tự động khóa lịch nhân viên."
                                onConfirm={() => handleApprove(record.id)}
                                okText="Duyệt đơn"
                                cancelText="Đóng"
                            >
                                <Button type="primary" size="small" style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}>
                                    Duyệt
                                </Button>
                            </Popconfirm>

                            <Button
                                danger
                                size="small"
                                onClick={() => handleOpenRejectModal(record.id)}
                            >
                                Từ chối
                            </Button>
                        </Space>
                    );
                }

                if (record.status === "APPROVED" && userRole === "SALON_OWNER") {
                    return (
                        <Button
                            danger
                            size="small"
                            onClick={() => handleOpenRejectModal(record.id)}
                        >
                            Đổi thành Từ chối
                        </Button>
                    );
                }

                return (
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        {record.approvedByName ? `Duyệt bởi: ${record.approvedByName}` : "-"}
                    </div>
                );
            }
        }
    ];

    return (
        <div>
            {/* Bộ lọc & Thống kê */}
            <Row gutter={screens.xs ? [12, 12] : [16, 16]} align="middle" style={{ marginBottom: 20 }}>
                {(userRole === "SALON_OWNER" || userRole === "ROLE_SALON_OWNER") && (
                    <Col xs={24} sm={8} md={6}>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                            Lọc Chi nhánh:
                        </label>
                        <Select
                            style={{ width: "100%" }}
                            value={selectedBranchId}
                            onChange={setSelectedBranchId}
                            allowClear
                            placeholder="Tất cả Chi nhánh"
                        >
                            {branches.map(b => (
                                <Option key={b.id} value={b.id}>{b.name}</Option>
                            ))}
                        </Select>
                    </Col>
                )}

                <Col xs={24} sm={8} md={6}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                        Trạng thái đơn:
                    </label>
                    <Select
                        style={{ width: "100%" }}
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                    >
                        <Option value="ALL">Tất cả trạng thái</Option>
                        <Option value="PENDING">Đơn chờ duyệt</Option>
                        <Option value="APPROVED">Đơn đã được duyệt</Option>
                        <Option value="REJECTED">Đơn bị từ chối</Option>
                    </Select>
                </Col>

                <Col xs={24} sm={8} md={12} style={{ textAlign: screens.xs ? "left" : "right" }}>
                    <Space size="large">
                        <Statistic
                            title="Chờ duyệt"
                            value={stats.pending}
                            valueStyle={{ color: stats.pending > 0 ? "#faad14" : "#8c8c8c", fontWeight: 700 }}
                        />
                        <Statistic
                            title="Đã duyệt"
                            value={stats.approved}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Space>
                </Col>
            </Row>

            {/* Bảng dữ liệu */}
            <Table
                columns={columns}
                dataSource={requests}
                rowKey="id"
                loading={loading}
                scroll={{ x: 850 }}
                pagination={{ pageSize: 8, simple: screens.xs }}
            />

            {/* Modal Nhập lý do từ chối */}
            <Modal
                open={rejectModalOpen}
                title="❌ Từ Chối Đơn Xin Nghỉ Phép"
                okText="Xác nhận Từ chối"
                cancelText="Đóng"
                okButtonProps={{ danger: true, loading: rejecting }}
                width={screens.xs ? "95%" : 520}
                onCancel={() => {
                    setRejectModalOpen(false);
                    rejectForm.resetFields();
                }}
                onOk={() => rejectForm.submit()}
                destroyOnClose
            >
                <Form form={rejectForm} layout="vertical" onFinish={handleConfirmReject} style={{ marginTop: 16 }}>
                    <Form.Item
                        name="rejectionReason"
                        label="Lý do từ chối"
                        rules={[{ required: true, message: "Vui lòng nhập lý do từ chối để phản hồi lại nhân viên!" }]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Ví dụ: Ngày này salon đang trùng lịch hẹn với nhiều khách hàng hoặc thiếu nhân lực ca..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
