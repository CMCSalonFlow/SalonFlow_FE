import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Empty,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message
} from "antd";
import {
    CheckCircleOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShoppingOutlined,
    TeamOutlined,
    UserOutlined
} from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import {
    checkInBookingApi,
    completeBookingApi,
    confirmBookingApi,
    getBookingsByBranchApi
} from "../api/bookingApi";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const STATUS_META = {
    PENDING: { label: "Chờ xử lý", color: "gold" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue" },
    CHECKED_IN: { label: "Đã check-in", color: "cyan" },
    COMPLETED: { label: "Đã hoàn thành", color: "green" },
    CANCELLED: { label: "Đã hủy", color: "red" },
    NO_SHOW: { label: "Vắng mặt", color: "default" }
};

const ACTION_TEXT = {
    confirm: "Xác nhận lịch",
    checkin: "Check-in khách",
    complete: "Hoàn thành dịch vụ"
};

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

const formatDate = (value) => {
    if (!value) return "-";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY") : String(value);
};

const formatTime = (value) => {
    if (!value) return "--:--";
    return String(value).substring(0, 5);
};

const buildSearchText = (booking) => [
    booking?.id,
    booking?.customerName,
    booking?.customerPhone,
    booking?.branchName,
    booking?.assignedStaffName,
    booking?.staffName,
    booking?.notes,
    booking?.status,
    ...(Array.isArray(booking?.items) ? booking.items.flatMap((item) => [
        item?.serviceName,
        item?.bundleName
    ]) : [])
]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getWorkflowAction = (status) => {
    if (status === "PENDING") {
        return { key: "confirm", label: ACTION_TEXT.confirm, color: "blue", icon: <CheckOutlined /> };
    }

    if (status === "CONFIRMED") {
        return { key: "checkin", label: ACTION_TEXT.checkin, color: "gold", icon: <ClockCircleOutlined /> };
    }

    if (status === "CHECKED_IN") {
        return { key: "complete", label: ACTION_TEXT.complete, color: "green", icon: <CheckCircleOutlined /> };
    }

    return null;
};

export default function OwnerBookingWorkflowPage() {
    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(() => localStorage.getItem("currentBranchId") || "");
    const [bookings, setBookings] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [actionLoadingKey, setActionLoadingKey] = useState("");

    const selectedBranch = useMemo(
        () => branches.find((branch) => String(branch.id) === String(branchId)),
        [branches, branchId]
    );

    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            const data = await getMyBranchesApi();
            const nextBranches = Array.isArray(data) ? data : [];
            setBranches(nextBranches);

            const storedBranchId = localStorage.getItem("currentBranchId");
            const hasStoredBranch = storedBranchId
                ? nextBranches.some((branch) => String(branch.id) === String(storedBranchId))
                : false;

            if (!branchId && nextBranches.length > 0) {
                const firstBranchId = String(nextBranches[0].id);
                setBranchId(firstBranchId);
                localStorage.setItem("currentBranchId", firstBranchId);
                return;
            }

            if (storedBranchId && !hasStoredBranch && nextBranches.length > 0) {
                const firstBranchId = String(nextBranches[0].id);
                setBranchId(firstBranchId);
                localStorage.setItem("currentBranchId", firstBranchId);
            }
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách chi nhánh.");
        } finally {
            setLoadingBranches(false);
        }
    };

    const loadBookings = async (targetBranchId = branchId) => {
        if (!targetBranchId) {
            setBookings([]);
            return;
        }

        try {
            setLoadingBookings(true);
            const data = await getBookingsByBranchApi(targetBranchId);
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách booking.");
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBranches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!branchId) return;
        localStorage.setItem("currentBranchId", String(branchId));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBookings(branchId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId]);

    const filteredBookings = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();

        const inRange = (booking) => {
            if (!dateRange || dateRange.length !== 2) return true;
            const [start, end] = dateRange;
            if (!start || !end) return true;
            const bookingDate = dayjs(booking?.bookingDate);
            if (!bookingDate.isValid()) return false;
            return (
                bookingDate.isSame(start, "day") ||
                bookingDate.isSame(end, "day") ||
                (bookingDate.isAfter(start, "day") && bookingDate.isBefore(end, "day"))
            );
        };

        return bookings
            .filter((booking) => {
                if (statusFilter !== "ALL" && String(booking?.status || "") !== statusFilter) {
                    return false;
                }

                if (!inRange(booking)) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                return buildSearchText(booking).includes(normalizedSearch);
            })
            .sort((a, b) => {
                const dateA = dayjs(`${a?.bookingDate || ""}T${a?.startTime || "00:00:00"}`);
                const dateB = dayjs(`${b?.bookingDate || ""}T${b?.startTime || "00:00:00"}`);
                if (dateA.isValid() && dateB.isValid()) {
                    return dateB.valueOf() - dateA.valueOf();
                }
                return String(b?.id || "").localeCompare(String(a?.id || ""));
            });
    }, [bookings, searchText, statusFilter, dateRange]);

    const summary = useMemo(() => {
        const total = bookings.length;
        const pending = bookings.filter((booking) => booking.status === "PENDING").length;
        const confirmed = bookings.filter((booking) => booking.status === "CONFIRMED").length;
        const checkedIn = bookings.filter((booking) => booking.status === "CHECKED_IN").length;
        const completed = bookings.filter((booking) => booking.status === "COMPLETED").length;

        return {
            total,
            pending,
            confirmed,
            checkedIn,
            completed
        };
    }, [bookings]);

    const handleBranchChange = (value) => {
        setBranchId(value);
        localStorage.setItem("currentBranchId", String(value));
    };

    const handleRefresh = () => {
        void loadBookings(branchId);
    };

    const runWorkflowAction = (booking, actionKey) => {
        const actionMap = {
            confirm: {
                title: "Xác nhận lịch hẹn",
                description: "Dùng khi booking đang ở trạng thái chờ xử lý.",
                api: confirmBookingApi,
                success: "Đã xác nhận lịch hẹn."
            },
            checkin: {
                title: "Xác nhận khách đã đến",
                description: "Đánh dấu khách đã đến salon và bắt đầu phục vụ.",
                api: checkInBookingApi,
                success: "Đã check-in khách."
            },
            complete: {
                title: "Hoàn thành dịch vụ",
                description: "Chuyển booking sang trạng thái hoàn thành để customer có thể đánh giá.",
                api: completeBookingApi,
                success: "Đã chuyển booking sang trạng thái hoàn thành."
            }
        };

        const action = actionMap[actionKey];
        if (!action) return;

        Modal.confirm({
            title: action.title,
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <Paragraph style={{ marginBottom: 8 }}>
                        {action.description}
                    </Paragraph>
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Mã booking">
                            #{booking.id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khách hàng">
                            {booking.customerName || booking.customer?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian">
                            {formatDate(booking.bookingDate)} {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            ),
            okText: action.title,
            cancelText: "Hủy",
            okButtonProps: { type: "primary" },
            onOk: async () => {
                const loadingKey = `${booking.id}-${actionKey}`;
                try {
                    setActionLoadingKey(loadingKey);
                    await action.api(booking.id);
                    message.success(action.success);
                    await loadBookings(branchId);
                } catch (error) {
                    console.error(error);
                    message.error(error?.response?.data?.message || error?.message || "Không thể cập nhật trạng thái booking.");
                } finally {
                    setActionLoadingKey("");
                }
            }
        });
    };

    const columns = [
        {
            title: "Mã booking",
            dataIndex: "id",
            width: 110,
            render: (value, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>#{value}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDate(record.bookingDate)}
                    </Text>
                </Space>
            )
        },
        {
            title: "Khách hàng",
            width: 210,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Space size={8}>
                        <UserOutlined />
                        <Text strong>{record.customerName || record.customer?.name || "-"}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.customerPhone || "-"}
                    </Text>
                </Space>
            )
        },
        {
            title: "Dịch vụ / Combo",
            render: (_, record) => {
                const items = Array.isArray(record.items) ? record.items : [];

                if (items.length === 0) {
                    return <Text type="secondary">Chưa có dữ liệu</Text>;
                }

                return (
                    <Space wrap size={[0, 8]}>
                        {items.map((item, idx) => (
                            <Tag color="blue" key={item.id || `${record.id}-${idx}`}>
                                {item.serviceName || item.bundleName || "Dịch vụ"}
                            </Tag>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: "Nhân viên",
            width: 180,
            render: (_, record) => (
                <Space>
                    <TeamOutlined />
                    <Text>{record.assignedStaffName || record.staffName || "Tự động phân bổ"}</Text>
                </Space>
            )
        },
        {
            title: "Giờ hẹn",
            width: 180,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{formatTime(record.startTime)} - {formatTime(record.endTime)}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(record.bookingDate)}</Text>
                </Space>
            )
        },
        {
            title: "Cọc / Tổng",
            width: 150,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: "#cf1322" }}>
                        {formatCurrency(record.depositAmount || record.payableAmount || 0)} đ
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Tổng {formatCurrency(record.totalPrice || 0)} đ
                    </Text>
                </Space>
            )
        },
        {
            title: "Trạng thái",
            width: 150,
            render: (_, record) => {
                const meta = STATUS_META[record.status] || { label: record.status || "-", color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            }
        },
        {
            title: "Thao tác",
            width: 240,
            fixed: "right",
            render: (_, record) => {
                const workflowAction = getWorkflowAction(record.status);
                const isBusy = actionLoadingKey === `${record.id}-${workflowAction?.key}`;

                return (
                    <Space wrap>
                        <Button size="small" onClick={() => { setSelectedBooking(record); setDetailOpen(true); }}>
                            Chi tiết
                        </Button>
                        {workflowAction ? (
                            <Button
                                size="small"
                                type="primary"
                                icon={isBusy ? <LoadingOutlined /> : workflowAction.icon}
                                loading={isBusy}
                                style={{
                                    backgroundColor: workflowAction.color === "green" ? "#52c41a" : undefined,
                                    borderColor: workflowAction.color === "green" ? "#52c41a" : undefined
                                }}
                                onClick={() => runWorkflowAction(record, workflowAction.key)}
                            >
                                {workflowAction.label}
                            </Button>
                        ) : (
                            <Tag color={STATUS_META[record.status]?.color || "default"}>
                                {STATUS_META[record.status]?.label || "Không có thao tác"}
                            </Tag>
                        )}
                    </Space>
                );
            }
        }
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Title level={3} style={{ marginBottom: 4 }}>
                    Check-in & Hoàn thành booking
                </Title>
                <Text type="secondary">
                    Màn hình dành cho owner/staff để theo dõi booking, xác nhận khách đến và chuyển sang hoàn thành sau khi phục vụ xong.
                </Text>
            </div>

            <Alert
                type="info"
                showIcon
                message="Workflow"
                description="Quy trình gợi ý: PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED. Customer chỉ có thể đánh giá sau khi booking sang COMPLETED."
            />

            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Tổng booking" value={summary.total} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Chờ xử lý" value={summary.pending} valueStyle={{ color: "#d48806" }} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Đã xác nhận" value={summary.confirmed} valueStyle={{ color: "#1677ff" }} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Đã hoàn thành" value={summary.completed} valueStyle={{ color: "#52c41a" }} />
                    </Col>
                </Row>
            </Card>

            <Card>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space wrap>
                            <Select
                                showSearch
                                style={{ width: 260 }}
                                placeholder="Chọn chi nhánh"
                                value={branchId || undefined}
                                onChange={handleBranchChange}
                                loading={loadingBranches}
                                options={branches.map((branch) => ({
                                    value: String(branch.id),
                                    label: branch.name
                                }))}
                                optionFilterProp="label"
                            />

                            <Select
                                style={{ width: 180 }}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    { value: "ALL", label: "Tất cả trạng thái" },
                                    { value: "PENDING", label: "Chờ xử lý" },
                                    { value: "CONFIRMED", label: "Đã xác nhận" },
                                    { value: "CHECKED_IN", label: "Đã check-in" },
                                    { value: "COMPLETED", label: "Đã hoàn thành" },
                                    { value: "CANCELLED", label: "Đã hủy" },
                                    { value: "NO_SHOW", label: "Vắng mặt" }
                                ]}
                            />

                            <RangePicker
                                value={dateRange}
                                onChange={(value) => setDateRange(value || null)}
                            />
                        </Space>

                        <Space wrap>
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loadingBookings}>
                                Làm mới
                            </Button>
                        </Space>
                    </Space>

                    <Input.Search
                        allowClear
                        placeholder="Tìm theo mã booking, tên khách, SĐT, nhân viên, dịch vụ..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={(value) => setSearchText(value)}
                        enterButton={<SearchOutlined />}
                    />
                </Space>
            </Card>

            <Card
                title={
                    <Space>
                        <ShoppingOutlined />
                        <span>Danh sách booking</span>
                        {selectedBranch ? (
                            <Tag color="blue">{selectedBranch.name}</Tag>
                        ) : null}
                    </Space>
                }
                extra={
                    <Text type="secondary">
                        {filteredBookings.length} / {bookings.length} booking
                    </Text>
                }
            >
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredBookings}
                    loading={loadingBookings}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"]
                    }}
                    scroll={{ x: 1450 }}
                    locale={{
                        emptyText: (
                            <Empty
                                description="Không có booking phù hợp với bộ lọc hiện tại."
                            />
                        )
                    }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined />
                        <span>Chi tiết booking #{selectedBooking?.id || ""}</span>
                    </Space>
                }
                open={detailOpen}
                onCancel={() => {
                    setDetailOpen(false);
                    setSelectedBooking(null);
                }}
                footer={[
                    <Button
                        key="close"
                        onClick={() => {
                            setDetailOpen(false);
                            setSelectedBooking(null);
                        }}
                    >
                        Đóng
                    </Button>,
                    selectedBooking && getWorkflowAction(selectedBooking.status) ? (
                        <Button
                            key="workflow"
                            type="primary"
                            loading={actionLoadingKey === `${selectedBooking.id}-${getWorkflowAction(selectedBooking.status)?.key}`}
                            icon={getWorkflowAction(selectedBooking.status)?.icon}
                            onClick={() => {
                                const workflowAction = getWorkflowAction(selectedBooking.status);
                                if (workflowAction) {
                                    runWorkflowAction(selectedBooking, workflowAction.key);
                                }
                            }}
                        >
                            {getWorkflowAction(selectedBooking.status)?.label}
                        </Button>
                    ) : null
                ]}
                width={760}
            >
                {selectedBooking ? (
                    <Space direction="vertical" size={16} style={{ width: "100%" }}>
                        <Descriptions bordered column={1} size="middle">
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={STATUS_META[selectedBooking.status]?.color || "default"}>
                                    {STATUS_META[selectedBooking.status]?.label || selectedBooking.status || "-"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">
                                {selectedBooking.customerName || selectedBooking.customer?.name || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {selectedBooking.customerPhone || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chi nhánh">
                                {selectedBooking.branchName || selectedBranch?.name || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nhân viên">
                                {selectedBooking.assignedStaffName || selectedBooking.staffName || "Tự động phân bổ"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày / Giờ">
                                {formatDate(selectedBooking.bookingDate)} {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tiền cọc">
                                {formatCurrency(selectedBooking.depositAmount || selectedBooking.payableAmount || 0)} đ
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng giá trị">
                                {formatCurrency(selectedBooking.totalPrice || 0)} đ
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <Text strong>Dịch vụ / combo</Text>
                            <div style={{ marginTop: 8 }}>
                                {Array.isArray(selectedBooking.items) && selectedBooking.items.length > 0 ? (
                                    <Space wrap>
                                        {selectedBooking.items.map((item, idx) => (
                                            <Tag color="blue" key={item.id || `${selectedBooking.id}-${idx}`}>
                                                {item.serviceName || item.bundleName || "Dịch vụ"}
                                            </Tag>
                                        ))}
                                    </Space>
                                ) : (
                                    <Text type="secondary">Không có dữ liệu chi tiết.</Text>
                                )}
                            </div>
                        </div>

                        {selectedBooking.notes ? (
                            <div style={{ padding: 16, borderRadius: 12, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                                <Text strong>Ghi chú khách hàng</Text>
                                <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                                    {selectedBooking.notes}
                                </Paragraph>
                            </div>
                        ) : null}
                    </Space>
                ) : null}
            </Modal>
        </div>
    );
}
