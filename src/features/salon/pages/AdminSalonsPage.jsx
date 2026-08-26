import React, { useState, useEffect } from "react";
import {
    Table,
    Tabs,
    Tag,
    Button,
    Modal,
    Form,
    Input,
    Space,
    Drawer,
    Timeline,
    Typography,
    Avatar,
    message,
    Card,
    Tooltip,
    Popconfirm
} from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    HistoryOutlined,
    ShopOutlined,
    EyeOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    CrownOutlined
} from "@ant-design/icons";
import {
    getAllSalonsApi,
    getSalonsByStatusApi,
    approveSalonApi,
    rejectSalonApi,
    getSalonAuditsApi
} from "../api/salonApi";
import { activateManualEnterpriseApi } from "@/features/subscription/api/subscriptionApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function AdminSalonsPage() {
    const [activeTab, setActiveTab] = useState("PENDING");
    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal Reject State
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [rejectForm] = Form.useForm();
    const [submittingReject, setSubmittingReject] = useState(false);

    // Drawer Audit Log State
    const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
    const [audits, setAudits] = useState([]);
    const [loadingAudits, setLoadingAudits] = useState(false);

    // Modal View Detail State
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Enterprise Manual Activation State
    const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
    const [enterpriseForm] = Form.useForm();
    const [submittingEnterprise, setSubmittingEnterprise] = useState(false);

    useEffect(() => {
        fetchSalons();
    }, [activeTab]);

    const fetchSalons = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === "ALL") {
                res = await getAllSalonsApi();
            } else {
                res = await getSalonsByStatusApi(activeTab);
            }
            setSalons(res || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách salon:", error);
            message.error("Không thể tải danh sách Salon!");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (salonId) => {
        try {
            await approveSalonApi(salonId);
            message.success("Đã phê duyệt Salon thành công!");
            fetchSalons();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Duyệt Salon thất bại!");
        }
    };

    const handleOpenRejectModal = (salon) => {
        setSelectedSalon(salon);
        rejectForm.resetFields();
        setRejectModalOpen(true);
    };

    const handleRejectSubmit = async (values) => {
        if (!selectedSalon) return;
        setSubmittingReject(true);
        try {
            await rejectSalonApi(selectedSalon.id, values.reason);
            message.success("Đã từ chối đơn đăng ký Salon!");
            setRejectModalOpen(false);
            fetchSalons();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Từ chối Salon thất bại!");
        } finally {
            setSubmittingReject(false);
        }
    };

    const handleOpenAudits = async (salon) => {
        setSelectedSalon(salon);
        setAuditDrawerOpen(true);
        setLoadingAudits(true);
        try {
            const res = await getSalonAuditsApi(salon.id);
            setAudits(res || []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải lịch sử Audit!");
        } finally {
            setLoadingAudits(false);
        }
    };

    const handleOpenEnterpriseModal = (salon) => {
        setSelectedSalon(salon);
        enterpriseForm.resetFields();
        setEnterpriseModalOpen(true);
    };

    const handleEnterpriseSubmit = async (values) => {
        if (!selectedSalon) return;
        setSubmittingEnterprise(true);
        try {
            await activateManualEnterpriseApi({
                salonId: selectedSalon.id,
                plan: "ENTERPRISE",
                billingCycle: "MANUAL",
                price: Number(values.price),
                durationDays: Number(values.durationDays)
            });
            message.success("Đã kích hoạt gói Enterprise thành công cho Salon!");
            setEnterpriseModalOpen(false);
            fetchSalons();
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || "Kích hoạt Enterprise thất bại!");
        } finally {
            setSubmittingEnterprise(false);
        }
    };

    const renderStatusTag = (status) => {
        switch (status) {
            case "PENDING":
                return <Tag icon={<ClockCircleOutlined />} color="warning">CHỜ DUYỆT</Tag>;
            case "APPROVED":
                return <Tag icon={<CheckCircleOutlined />} color="success">ĐÃ PHÊ DUYỆT</Tag>;
            case "REJECTED":
                return <Tag icon={<CloseCircleOutlined />} color="error">ĐÃ TỪ CHỐI</Tag>;
            case "SUSPENDED":
                return <Tag icon={<ExclamationCircleOutlined />} color="default">TẠM KHÓA</Tag>;
            default:
                return <Tag color="default">{status}</Tag>;
        }
    };

    const columns = [
        {
            title: "Salon",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Space size="middle">
                    <Avatar
                        size={48}
                        src={record.logoUrl}
                        icon={<ShopOutlined />}
                        style={{ backgroundColor: "#1890ff" }}
                    />
                    <div>
                        <Text strong style={{ fontSize: 16 }}>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 13 }}>ID: #{record.id}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: "Liên hệ",
            key: "contact",
            render: (_, record) => (
                <div>
                    <div><Text strong>Email:</Text> {record.email || "---"}</div>
                    <div><Text strong>SĐT:</Text> {record.phone || "---"}</div>
                    {record.website && (
                        <div><Text strong>Website:</Text> <a href={record.website} target="_blank" rel="noreferrer">{record.website}</a></div>
                    )}
                </div>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => renderStatusTag(status)
        },
        {
            title: "Lý do từ chối",
            dataIndex: "rejectionReason",
            key: "rejectionReason",
            render: (text, record) => record.status === "REJECTED" ? (
                <Tooltip title={text}>
                    <Text type="danger" ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
                        {text || "Chưa có lý do"}
                    </Text>
                </Tooltip>
            ) : "---"
        },
        {
            title: "Hành động",
            key: "action",
            align: "right",
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedSalon(record);
                            setDetailModalOpen(true);
                        }}
                    >
                        Chi tiết
                    </Button>

                    <Button
                        type="text"
                        icon={<HistoryOutlined />}
                        onClick={() => handleOpenAudits(record)}
                    >
                        Audit Log
                    </Button>

                    {record.status === "APPROVED" && (
                        <Button
                            type="text"
                            icon={<CrownOutlined style={{ color: "#faad14" }} />}
                            onClick={() => handleOpenEnterpriseModal(record)}
                        >
                            Enterprise
                        </Button>
                    )}

                    {record.status === "PENDING" && (
                        <>
                            <Popconfirm
                                title="Xác nhận duyệt Salon này?"
                                description="Salon sẽ được phép hoạt động trên hệ thống."
                                onConfirm={() => handleApprove(record.id)}
                                okText="Duyệt"
                                cancelText="Hủy"
                            >
                                <Button type="primary" icon={<CheckCircleOutlined />} style={{ backgroundColor: "#52c41a" }}>
                                    Approve
                                </Button>
                            </Popconfirm>

                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleOpenRejectModal(record)}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Space>
            )
        }
    ];

    const tabItems = [
        { key: "PENDING", label: `Chờ duyệt (${activeTab === "PENDING" ? salons.length : "..."})` },
        { key: "APPROVED", label: "Đã duyệt" },
        { key: "REJECTED", label: "Đã từ chối" },
        { key: "ALL", label: "Tất cả Salon" }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                title={
                    <Space size="middle">
                        <ShopOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                        <div>
                            <Title level={4} style={{ margin: 0 }}>Quản lý & Duyệt Salon</Title>
                            <Text type="secondary">Phê duyệt đơn đăng ký salon mới, gửi email thông báo và theo dõi nhật ký quyết định.</Text>
                        </div>
                    </Space>
                }
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key)}
                    items={tabItems}
                    style={{ marginBottom: 16 }}
                />

                <Table
                    columns={columns}
                    dataSource={salons}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            {/* Modal Reject */}
            <Modal
                title={`Từ chối đăng ký Salon: ${selectedSalon?.name}`}
                open={rejectModalOpen}
                onCancel={() => setRejectModalOpen(false)}
                footer={null}
            >
                <Form
                    form={rejectForm}
                    layout="vertical"
                    onFinish={handleRejectSubmit}
                >
                    <Form.Item
                        name="reason"
                        label="Lý do từ chối (bắt buộc - sẽ được gửi qua email cho chủ Salon)"
                        rules={[{ required: true, message: "Vui lòng nhập lý do từ chối!" }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Ví dụ: Giấy phép kinh doanh chưa rõ nét, địa chỉ chưa chính xác, thiếu thông tin liên hệ..."
                        />
                    </Form.Item>

                    <div style={{ textAlign: "right", marginTop: 16 }}>
                        <Space>
                            <Button onClick={() => setRejectModalOpen(false)}>Hủy</Button>
                            <Button type="primary" danger htmlType="submit" loading={submittingReject}>
                                Xác nhận Từ chối
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>

            {/* Drawer Audit Logs */}
            <Drawer
                title={`Nhật ký Audit: ${selectedSalon?.name}`}
                placement="right"
                width={450}
                open={auditDrawerOpen}
                onClose={() => setAuditDrawerOpen(false)}
            >
                {loadingAudits ? (
                    <Text>Đang tải lịch sử...</Text>
                ) : audits.length === 0 ? (
                    <Text type="secondary">Chưa có nhật ký quyết định nào cho Salon này.</Text>
                ) : (
                    <Timeline
                        items={audits.map((item) => {
                            let color = "blue";
                            if (item.action === "APPROVE") color = "green";
                            if (item.action === "REJECT") color = "red";
                            if (item.action === "APPEAL") color = "orange";

                            return {
                                color: color,
                                children: (
                                    <div style={{ marginBottom: 12 }}>
                                        <Space style={{ marginBottom: 4 }}>
                                            <Tag color={color}>{item.action}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(item.createdAt).toLocaleString("vi-VN")}
                                            </Text>
                                        </Space>
                                        <div>
                                            <Text strong>Thực hiện bởi:</Text> {item.adminName || item.adminEmail || "Hệ thống"}
                                        </div>
                                        {item.reason && (
                                            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontStyle: "italic", background: "#f5f5f5", padding: 8, borderRadius: 4 }}>
                                                "{item.reason}"
                                            </Paragraph>
                                        )}
                                    </div>
                                )
                            };
                        })}
                    />
                )}
            </Drawer>

            {/* Modal Detail */}
            <Modal
                title={`Chi tiết Salon: ${selectedSalon?.name}`}
                open={detailModalOpen}
                onCancel={() => setDetailModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>
                ]}
            >
                {selectedSalon && (
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        <div style={{ textAlign: "center" }}>
                            <Avatar size={80} src={selectedSalon.logoUrl} icon={<ShopOutlined />} />
                            <Title level={4} style={{ marginTop: 8 }}>{selectedSalon.name}</Title>
                            {renderStatusTag(selectedSalon.status)}
                        </div>

                        <div>
                            <Text strong>Mô tả:</Text>
                            <Paragraph>{selectedSalon.description || "Không có mô tả"}</Paragraph>
                        </div>

                        <div>
                            <Text strong>Số điện thoại:</Text> {selectedSalon.phone || "N/A"}
                        </div>

                        <div>
                            <Text strong>Email liên hệ:</Text> {selectedSalon.email || "N/A"}
                        </div>

                        <div>
                            <Text strong>Website:</Text> {selectedSalon.website ? <a href={selectedSalon.website} target="_blank" rel="noreferrer">{selectedSalon.website}</a> : "N/A"}
                        </div>

                        {selectedSalon.rejectionReason && (
                            <div style={{ background: "#fff2f0", border: "1px solid #ffccc7", padding: 12, borderRadius: 6 }}>
                                <Text type="danger" strong>Lý do từ chối trước đó:</Text>
                                <Paragraph type="danger" style={{ margin: 0 }}>{selectedSalon.rejectionReason}</Paragraph>
                            </div>
                        )}
                    </Space>
                )}
            </Modal>

            {/* Modal Enterprise Activation */}
            <Modal
                title={`Kích hoạt gói Enterprise cho Salon: ${selectedSalon?.name}`}
                open={enterpriseModalOpen}
                onCancel={() => setEnterpriseModalOpen(false)}
                footer={null}
            >
                <Form
                    form={enterpriseForm}
                    layout="vertical"
                    initialValues={{ price: 15000000, durationDays: 365 }}
                    onFinish={handleEnterpriseSubmit}
                >
                    <Form.Item
                        name="price"
                        label="Chi phí thanh toán thỏa thuận (VND)"
                        rules={[{ required: true, message: "Vui lòng nhập chi phí!" }]}
                    >
                        <Input type="number" placeholder="Ví dụ: 15000000" />
                    </Form.Item>
                    
                    <Form.Item
                        name="durationDays"
                        label="Thời hạn sử dụng (ngày)"
                        rules={[{ required: true, message: "Vui lòng nhập số ngày!" }]}
                    >
                        <Input type="number" placeholder="Ví dụ: 365" />
                    </Form.Item>

                    <div style={{ textAlign: "right", marginTop: 16 }}>
                        <Space>
                            <Button onClick={() => setEnterpriseModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={submittingEnterprise} style={{ backgroundColor: "#faad14", borderColor: "#faad14" }}>
                                Xác nhận kích hoạt
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
