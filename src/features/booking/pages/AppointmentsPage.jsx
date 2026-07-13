import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    Table,
    Tag,
    Button,
    Typography,
    Space,
    Spin,
    message,
    Empty,
    Modal,
    Input
} from "antd";
import {
    CalendarOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    ShopOutlined,
    UserOutlined
} from "@ant-design/icons";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import {
    getBookingsByBranchApi,
    cancelBookingApi
} from "../api/bookingApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AppointmentsPage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [myBookings, setMyBookings] = useState([]);

    const formatCurrency = (value) =>
        Number(value || 0).toLocaleString("vi-VN");

    useEffect(() => {
        loadMyBookings();
    }, []);

    const loadMyBookings = async () => {
        const currentUserId = localStorage.getItem("userId");

        if (!currentUserId) {
            message.error("Vui lòng đăng nhập để xem lịch hẹn.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);

            const branchesData = await getMyBranchesApi();

            if (branchesData && branchesData.length > 0) {

                const bookingsPromises = branchesData.map(branch =>
                    getBookingsByBranchApi(branch.id).catch(() => [])
                );

                const allResults = await Promise.all(bookingsPromises);

                const mergedBookings = allResults
                    .flat()
                    .filter(
                        booking =>
                            String(booking.customerId) === String(currentUserId)
                    );

                mergedBookings.sort((a, b) => {
                    const dateA = new Date(`${a.bookingDate}T${a.startTime}`);
                    const dateB = new Date(`${b.bookingDate}T${b.startTime}`);
                    return dateB - dateA;
                });

                setMyBookings(mergedBookings);
            }

        } catch (error) {
            message.error("Lỗi khi tải lịch sử đặt chỗ.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusTag = (status) => {
        switch (status) {
            case "PENDING":
                return <Tag color="warning">Đang chờ</Tag>;
            case "CONFIRMED":
                return <Tag color="processing">Đã xác nhận</Tag>;
            case "COMPLETED":
                return <Tag color="success">Đã hoàn thành</Tag>;
            case "CANCELLED":
                return <Tag color="error">Đã hủy</Tag>;
            case "NO_SHOW":
                return <Tag color="default">Vắng mặt</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };
    

    const handleCancelBooking = (bookingId) => {

    let reason = "";

    Modal.confirm({
        title: "Hủy lịch hẹn",

        content: (
            <TextArea
                rows={4}
                placeholder="Nhập lý do hủy (không bắt buộc)"
                onChange={(e) => {
                    reason = e.target.value;
                }}
            />
        ),

        okText: "Hủy lịch",
        cancelText: "Đóng",

        okButtonProps: {
            danger: true
        },

        onOk: async () => {
            try {

                const result = await cancelBookingApi(
                    bookingId,
                    reason
                );

                Modal.success({
                    title: "Hủy lịch thành công",
                    content: (
                        <div>
                            <p>
                                <strong>Kết quả:</strong> {result.message}
                            </p>

                            <p>
                                <strong>Phí hủy:</strong>{" "}
                                {Number(result.feeAmount).toLocaleString()} đ
                            </p>

                            <p>
                                <strong>Miễn phí:</strong>{" "}
                                {result.isFreeCancel ? "Có" : "Không"}
                            </p>
                        </div>
                    )
                });

                await loadMyBookings();

            } catch (error) {

                message.error(
                    error.response?.data?.message ||
                    "Không thể hủy lịch"
                );

            }
        }
    });
};

    const columns = [
        {
            title: "Mã đặt",
            dataIndex: "id",
            render: (id) => <Text strong>#{id}</Text>
        },
        {
            title: "Chi nhánh",
            dataIndex: "branchName",
            render: (text) => (
                <Space>
                    <ShopOutlined />
                    {text}
                </Space>
            )
        },
        {
            title: "Dịch vụ",
            render: (_, record) => (
                <Space wrap>
                    {record.items?.map(item => (
                        <Tag color="blue" key={item.id}>
                            {item.serviceName || item.bundleName}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Nhân viên",
            dataIndex: "assignedStaffName",
            render: (name) => (
                <Space>
                    <UserOutlined />
                    {name || "Tự động phân bổ"}
                </Space>
            )
        },
        {
            title: "Thời gian",
            render: (_, record) => (
                <>
                    <div>{record.bookingDate}</div>
                    <Text type="secondary">
                        {record.startTime.substring(0, 5)}
                        {" - "}
                        {record.endTime.substring(0, 5)}
                    </Text>
                </>
            )
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalPrice",
            render: (value) => (
                <Text strong style={{ color: "#faad14" }}>
                    {formatCurrency(value)} đ
                </Text>
            )
        },
        {
            title: "Tiền cọc",
            dataIndex: "depositAmount",
            render: (value) => (
                <Text strong style={{ color: "#f5222d" }}>
                    {formatCurrency(value)} đ
                </Text>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: getStatusTag
        },
        {
            title: "Thao tác",
            render: (_, record) => (
                (record.status === "PENDING" ||
                    record.status === "CONFIRMED") && (
                    <Button
                        danger
                        onClick={() =>
                            handleCancelBooking(record.id)
                        }
                    >
                        Hủy lịch
                    </Button>
                )
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px" }}>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20
                }}
            >
                <div>
                    <Title level={2}>
                        <CalendarOutlined /> Lịch hẹn của tôi
                    </Title>

                    <Text type="secondary">
                        Quản lý các lịch hẹn của bạn
                    </Text>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate("/booking")}
                >
                    Đặt lịch mới
                </Button>
            </div>

            <Card>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 80 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={myBookings}
                        pagination={{
                            pageSize: 8
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    description="Bạn chưa có lịch hẹn nào."
                                >
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            navigate("/booking")
                                        }
                                    >
                                        Đặt lịch ngay
                                    </Button>
                                </Empty>
                            )
                        }}
                    />
                )}

            </Card>

        </div>
    );
}
