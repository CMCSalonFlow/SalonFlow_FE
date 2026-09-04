import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Space, Typography, Row, Col, Statistic, Popconfirm, message, Tooltip, Grid } from "antd";
import { PlusOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import offdayApi from "../api/offdayApi";
import StaffLeaveFormModal from "../components/StaffLeaveFormModal";

const { Title, Text } = Typography;

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

export default function StaffLeaveRequestPage() {
    const screens = Grid.useBreakpoint();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await offdayApi.getMyLeaveRequests();
            setRequests(Array.isArray(data) ? data : []);
        } catch {
            message.error("Lỗi khi tải lịch sử đơn xin nghỉ phép.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleCancel = async (id) => {
        try {
            await offdayApi.cancelLeaveRequest(id);
            message.success("Đã hủy đơn xin nghỉ phép.");
            loadRequests();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi hủy đơn xin nghỉ.");
        }
    };

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === "PENDING").length,
        approved: requests.filter(r => r.status === "APPROVED").length,
        rejected: requests.filter(r => r.status === "REJECTED").length
    };

    const columns = [
        {
            title: "Thời gian xin nghỉ",
            key: "dates",
            render: (_, record) => (
                <div>
                    <Text strong style={{ fontSize: 14 }}>
                        {dayjs(record.dateFrom).format("DD/MM/YYYY")} ➔ {dayjs(record.dateTo).format("DD/MM/YYYY")}
                    </Text>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                        Tổng số: <b>{record.totalDays || 1} ngày</b>
                    </div>
                </div>
            )
        },
        {
            title: "Loại hình nghỉ",
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
                <div>
                    <span>{text || "-"}</span>
                    {record.status === "REJECTED" && record.rejectionReason && (
                        <div style={{ marginTop: 4, color: "#ff4d4f", fontSize: 12 }}>
                            <b>Lý do từ chối:</b> {record.rejectionReason}
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
                return <Tag color={info.color} style={{ fontSize: 13, padding: "2px 10px" }}>{info.label}</Tag>;
            }
        },
        {
            title: "Ngày gửi đơn",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_, record) => {
                if (record.status === "PENDING") {
                    return (
                        <Popconfirm
                            title="Hủy đơn xin nghỉ"
                            description="Bạn có chắc chắn muốn hủy đơn xin nghỉ phép này không?"
                            onConfirm={() => handleCancel(record.id)}
                            okText="Hủy đơn"
                            cancelText="Đóng"
                        >
                            <Button danger size="small">Hủy đơn</Button>
                        </Popconfirm>
                    );
                }
                return <Text type="secondary" style={{ fontSize: 12 }}>-</Text>;
            }
        }
    ];

    return (
        <div style={{ padding: screens.sm ? 24 : "12px 8px" }}>
            <div style={{
                display: "flex",
                flexDirection: screens.xs ? "column" : "row",
                justifyContent: "space-between",
                alignItems: screens.xs ? "stretch" : "center",
                gap: 12,
                marginBottom: 20
            }}>
                <div>
                    <Title level={screens.xs ? 4 : 3} style={{ margin: 0 }}>Đơn Xin Nghỉ Phép Cá Nhân</Title>
                    <Text type="secondary" style={{ fontSize: screens.xs ? 12 : 14 }}>Tạo và theo dõi lịch sử đơn xin nghỉ phép gửi lên Quản lý / Salon Owner</Text>
                </div>
                <Button
                    type="primary"
                    size={screens.xs ? "middle" : "large"}
                    style={{ width: screens.xs ? "100%" : "auto" }}
                    onClick={() => setModalOpen(true)}
                >
                    Nộp đơn xin nghỉ
                </Button>
            </div>

            {/* Thống kê đơn nghỉ */}
            <Row gutter={screens.xs ? [10, 10] : [16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Tổng đơn đã nộp"
                            value={stats.total}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Đang chờ duyệt"
                            value={stats.pending}
                            valueStyle={{ color: "#faad14" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Đã được duyệt"
                            value={stats.approved}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic
                            title="Bị từ chối"
                            value={stats.rejected}
                            valueStyle={{ color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Bảng danh sách đơn nghỉ phép */}
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 750 }}
                    pagination={{ pageSize: 8, simple: screens.xs }}
                />
            </Card>

            <StaffLeaveFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={loadRequests}
            />
        </div>
    );
}
