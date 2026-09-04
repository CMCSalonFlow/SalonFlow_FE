import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
    Card,
    Table,
    Tag,
    Button,
    Space,
    Input,
    DatePicker,
    Statistic,
    Row,
    Col,
    Modal,
    Typography,
    Alert,
    message,
    Tooltip,
    Badge,
    Grid
} from "antd";
import {
    SearchOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    UserOutlined,
    ReloadOutlined,
    CalendarOutlined,
    CheckOutlined,
    ScissorOutlined,
    FilterOutlined
} from "@ant-design/icons";
import api from "@/core/api/axios";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import {
    getBookingsByBranchApi,
    checkInBookingApi,
    completeBookingApi,
    confirmBookingApi
} from "../api/bookingApi";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_META = {
    PENDING: { label: "Chờ xử lý", color: "gold" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue" },
    CHECKED_IN: { label: "Đã check-in", color: "cyan" },
    COMPLETED: { label: "Đã hoàn thành", color: "green" },
    CANCELLED: { label: "Đã hủy", color: "red" },
    NO_SHOW: { label: "Vắng mặt", color: "default" }
};

export default function StaffAppointmentsPage() {
    const screens = Grid.useBreakpoint();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const currentUserId = String(localStorage.getItem("userId") || "");
    const currentEmail = (localStorage.getItem("email") || "").toLowerCase();
    const currentUsername = (localStorage.getItem("username") || "").toLowerCase();
    const currentFullName = (
        localStorage.getItem("fullName") ||
        JSON.parse(localStorage.getItem("user") || "{}")?.fullName ||
        ""
    ).toLowerCase();

    const loadStaffBookings = async () => {
        try {
            setLoading(true);
            const branches = await getMyBranchesApi().catch(() => []);
            if (!branches || branches.length === 0) {
                setBookings([]);
                return;
            }

            // Tải danh sách Staff entity của các chi nhánh để mapping đúng Staff.id và Staff.name
            const myStaffIds = new Set();
            const myStaffNames = new Set();

            const staffPromises = branches.map((branch) =>
                api
                    .get(`/api/v1/branches/${branch.id}/staff`)
                    .then((res) => res.data || [])
                    .catch(() => [])
            );

            const staffResults = await Promise.all(staffPromises);
            staffResults.flat().forEach((staff) => {
                const isMe =
                    String(staff.userId) === currentUserId ||
                    (currentEmail && staff.email?.toLowerCase() === currentEmail) ||
                    (currentUsername && staff.name?.toLowerCase().includes(currentUsername));

                if (isMe) {
                    myStaffIds.add(String(staff.id));
                    if (staff.name) myStaffNames.add(staff.name.toLowerCase());
                }
            });

            const bookingPromises = branches.map((branch) =>
                getBookingsByBranchApi(branch.id).catch(() => [])
            );

            const allResults = await Promise.all(bookingPromises);
            const allBookings = allResults.flat();

            // Lọc các lịch hẹn được phân công hoặc do nhân viên này thực hiện
            let myBookings = allBookings.filter((b) => {
                const assignedIdStr = String(b.assignedStaffId || "");
                const preferredIdStr = String(b.preferredStaffId || "");
                const assignedNameStr = (b.assignedStaffName || "").toLowerCase();
                const preferredNameStr = (b.preferredStaffName || "").toLowerCase();

                if (myStaffIds.has(assignedIdStr) || myStaffIds.has(preferredIdStr)) return true;
                if (assignedIdStr === currentUserId || preferredIdStr === currentUserId) return true;

                for (const name of myStaffNames) {
                    if (assignedNameStr.includes(name) || preferredNameStr.includes(name)) return true;
                }

                if (currentFullName) {
                    if (assignedNameStr.includes(currentFullName) || preferredNameStr.includes(currentFullName)) return true;
                }

                return false;
            });

            // Nếu không lọc được theo tiêu chuẩn cá nhân, hiển thị toàn bộ lịch hẹn chi nhánh để Staff xử lý công việc
            if (myBookings.length === 0 && allBookings.length > 0) {
                myBookings = allBookings;
            }

            // Sắp xếp ngày gần nhất lên trước
            myBookings.sort(
                (a, b) => new Date(`${b.bookingDate}T${b.startTime}`) - new Date(`${a.bookingDate}T${a.startTime}`)
            );

            setBookings(myBookings);
        } catch (err) {
            console.error("Lỗi khi tải lịch hẹn phân công:", err);
            message.error("Không thể tải danh sách lịch hẹn.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStaffBookings();
    }, []);

    const handleAction = async (bookingId, actionType) => {
        setActionLoading(true);
        try {
            if (actionType === "checkin") {
                await checkInBookingApi(bookingId);
                message.success("Đã check-in cho khách hàng thành công!");
            } else if (actionType === "complete") {
                await completeBookingApi(bookingId);
                message.success("Đã hoàn thành dịch vụ!");
            } else if (actionType === "confirm") {
                await confirmBookingApi(bookingId);
                message.success("Đã xác nhận lịch hẹn!");
            }
            loadStaffBookings();
            setIsDetailModalOpen(false);
        } catch (err) {
            console.error("Lỗi thao tác lịch hẹn:", err);
            message.error(err.response?.data?.message || "Thao tác không thành công.");
        } finally {
            setActionLoading(false);
        }
    };

    // Filtered Bookings
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            // Search Text Filter
            const searchLower = searchText.toLowerCase();
            const matchSearch =
                !searchText ||
                String(b.id).includes(searchLower) ||
                b.customerName?.toLowerCase().includes(searchLower) ||
                b.customerPhone?.includes(searchLower) ||
                b.items?.some((i) => i.serviceName?.toLowerCase().includes(searchLower));

            // Status Filter
            const matchStatus = statusFilter === "ALL" || b.status === statusFilter;

            // Date Filter
            const matchDate =
                !selectedDate ||
                dayjs(b.bookingDate).isSame(selectedDate, "day");

            return matchSearch && matchStatus && matchDate;
        });
    }, [bookings, searchText, statusFilter, selectedDate]);

    // Statistics
    const todayStr = dayjs().format("YYYY-MM-DD");
    const todayBookings = useMemo(() => bookings.filter((b) => b.bookingDate === todayStr), [bookings, todayStr]);
    const pendingCount = useMemo(() => bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").length, [bookings]);
    const completedCount = useMemo(() => bookings.filter((b) => b.status === "COMPLETED").length, [bookings]);

    const columns = [
        {
            title: "Mã hẹn",
            dataIndex: "id",
            key: "id",
            width: 90,
            sorter: (a, b) => Number(a?.id || 0) - Number(b?.id || 0),
            render: (id) => <Text strong style={{ color: "#1677ff" }}>#{id}</Text>
        },
        {
            title: "Thời gian",
            key: "time",
            width: 170,
            render: (_, record) => (
                <div>
                    <Text strong style={{ display: "block" }}>{record.bookingDate}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {record.startTime ? String(record.startTime).slice(0, 5) : ""} - {record.endTime ? String(record.endTime).slice(0, 5) : ""}
                    </Text>
                </div>
            )
        },
        {
            title: "Khách hàng",
            key: "customer",
            width: 200,
            render: (_, record) => (
                <div>
                    <Text strong style={{ display: "block" }}>
                        <UserOutlined style={{ marginRight: 6, color: "#1677ff" }} />
                        {record.customerName || "Khách lẻ"}
                    </Text>
                    {record.customerPhone && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            📱 {record.customerPhone}
                        </Text>
                    )}
                </div>
            )
        },
        {
            title: "Dịch vụ làm đẹp",
            key: "services",
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    {record.items && record.items.length > 0 ? (
                        record.items.map((item, idx) => (
                            <Tag key={idx} color="blue" icon={<ScissorOutlined />}>
                                {item.serviceName || item.bundleName || "Dịch vụ"}
                            </Tag>
                        ))
                    ) : (
                        <Text type="secondary">Cắt tạo kiểu</Text>
                    )}
                </Space>
            )
        },
        {
            title: "Tổng giá",
            dataIndex: "totalPrice",
            key: "totalPrice",
            width: 120,
            render: (val) => (
                <Text strong style={{ color: "#fa8c16" }}>
                    {Number(val || 0).toLocaleString("vi-VN")} đ
                </Text>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (status) => {
                const meta = STATUS_META[status] || { label: status, color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            }
        },
        {
            title: "Thao tác",
            key: "action",
            width: 100,
            render: (_, record) => (
                <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() => {
                        setSelectedBooking(record);
                        setIsDetailModalOpen(true);
                    }}
                >
                    Chi tiết
                </Button>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 40 }}>
            {/* Header & Refresh */}
            <div style={{
                display: "flex",
                flexDirection: screens.xs ? "column" : "row",
                justifyContent: "space-between",
                alignItems: screens.xs ? "flex-start" : "center",
                gap: 12,
                marginBottom: 20
            }}>
                <div>
                    <Title level={screens.xs ? 4 : 3} style={{ margin: 0 }}>
                        ✂️ Lịch hẹn làm đẹp phân công
                    </Title>
                    <Text type="secondary" style={{ fontSize: screens.xs ? 12 : 14 }}>
                        Quản lý toàn bộ danh sách lịch hẹn làm đẹp do {currentFullName || "bạn"} thực hiện
                    </Text>
                </div>
                <Button
                    icon={<ReloadOutlined />}
                    loading={loading}
                    onClick={loadStaffBookings}
                    style={{ width: screens.xs ? "100%" : "auto" }}
                >
                    Làm mới
                </Button>
            </div>

            {/* Quick Stats */}
            <Row gutter={screens.xs ? [10, 10] : [16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                        <Statistic
                            title="Lịch hẹn hôm nay"
                            value={todayBookings.length}
                            prefix={<CalendarOutlined style={{ color: "#1677ff" }} />}
                            suffix="đơn"
                            valueStyle={{ color: "#1677ff", fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                        <Statistic
                            title="Chờ thực hiện"
                            value={pendingCount}
                            prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
                            suffix="đơn"
                            valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                        <Statistic
                            title="Đã hoàn thành"
                            value={completedCount}
                            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                            suffix="đơn"
                            valueStyle={{ color: "#52c41a", fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filter Bar & Search */}
            <Card style={{ borderRadius: 16, marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={8}>
                        <Input
                            placeholder="Tìm theo Mã hẹn, Khách hàng, SĐT..."
                            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <DatePicker
                            placeholder="Lọc theo ngày"
                            style={{ width: "100%" }}
                            value={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                        />
                    </Col>
                    <Col xs={24} md={10} style={{ textAlign: screens.xs ? "left" : "right" }}>
                        <Space wrap size={screens.xs ? [6, 6] : 8}>
                            <Button
                                type={statusFilter === "ALL" ? "primary" : "default"}
                                size="small"
                                onClick={() => setStatusFilter("ALL")}
                            >
                                Tất cả ({bookings.length})
                            </Button>
                            <Button
                                type={statusFilter === "CONFIRMED" ? "primary" : "default"}
                                size="small"
                                onClick={() => setStatusFilter("CONFIRMED")}
                            >
                                Đã xác nhận
                            </Button>
                            <Button
                                type={statusFilter === "CHECKED_IN" ? "primary" : "default"}
                                size="small"
                                onClick={() => setStatusFilter("CHECKED_IN")}
                            >
                                Đã Check-in
                            </Button>
                            <Button
                                type={statusFilter === "COMPLETED" ? "primary" : "default"}
                                size="small"
                                onClick={() => setStatusFilter("COMPLETED")}
                            >
                                Đã hoàn thành
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Table */}
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                <Table
                    columns={columns}
                    dataSource={filteredBookings}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 800 }}
                    pagination={{ pageSize: 10, showSizeChanger: !screens.xs, simple: screens.xs }}
                />
            </Card>

            {/* Modal Chi tiết đơn hẹn */}
            <Modal
                title={selectedBooking ? `Chi tiết đơn đặt lịch #${selectedBooking.id}` : "Chi tiết đơn"}
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsDetailModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
            >
                {selectedBooking && (
                    <div style={{ padding: "10px 0", fontSize: 14 }}>
                        <Alert
                            message={`Trạng thái: ${STATUS_META[selectedBooking.status]?.label || selectedBooking.status}`}
                            type={selectedBooking.status === "COMPLETED" ? "success" : "info"}
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <p style={{ marginBottom: 8 }}>
                            <strong>Khách hàng:</strong> {selectedBooking.customerName || "Khách lẻ"}
                        </p>
                        <p style={{ marginBottom: 8 }}>
                            <strong>Số điện thoại:</strong> {selectedBooking.customerPhone || "Chưa cập nhật"}
                        </p>
                        <p style={{ marginBottom: 8 }}>
                            <strong>Ngày hẹn:</strong> {selectedBooking.bookingDate}
                        </p>
                        <p style={{ marginBottom: 8 }}>
                            <strong>Thời gian:</strong>{" "}
                            {selectedBooking.startTime ? String(selectedBooking.startTime).slice(0, 5) : ""}{" "}
                            đến {selectedBooking.endTime ? String(selectedBooking.endTime).slice(0, 5) : ""}
                        </p>
                        <p style={{ marginBottom: 8 }}>
                            <strong>Chi nhánh:</strong> {selectedBooking.branchName || "Chi nhánh Salon"}
                        </p>
                        <p style={{ marginBottom: 8 }}>
                            <strong>Tổng chi phí:</strong>{" "}
                            <Text strong style={{ color: "#fa8c16" }}>
                                {Number(selectedBooking.totalPrice || 0).toLocaleString("vi-VN")} đ
                            </Text>
                        </p>
                        {selectedBooking.notes && (
                            <p style={{ marginBottom: 8 }}>
                                <strong>Ghi chú từ khách:</strong> {selectedBooking.notes}
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
