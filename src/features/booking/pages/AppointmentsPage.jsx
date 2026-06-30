import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Table, Tag, Button, Typography, Space, Spin, message, Empty } from "antd";
import { CalendarOutlined, PlusOutlined, ClockCircleOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getBookingsByBranchApi } from "../api/bookingApi";

const { Title, Text } = Typography;

/**
 * Trang danh sách lịch hẹn của Khách hàng (AppointmentsPage).
 * Tự động quét và hợp nhất lịch đặt của khách hàng trên toàn bộ chi nhánh.
 */
export default function AppointmentsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [myBookings, setMyBookings] = useState([]);

    useEffect(() => {
        const loadMyBookings = async () => {
            const currentUserId = localStorage.getItem("userId");
            if (!currentUserId) {
                message.error("Vui lòng đăng nhập để xem lịch hẹn.");
                navigate("/login");
                return;
            }

            try {
                setLoading(true);
                // 1. Lấy tất cả chi nhánh
                const branchesData = await getMyBranchesApi();
                
                if (branchesData && branchesData.length > 0) {
                    // 2. Gọi đồng thời API lấy lịch đặt của từng chi nhánh
                    const bookingsPromises = branchesData.map(b => 
                        getBookingsByBranchApi(b.id).catch(() => []) // Catch lỗi của từng branch để tránh crash toàn bộ
                    );
                    const allResults = await Promise.all(bookingsPromises);
                    
                    // 3. Gộp danh sách lịch đặt và lọc theo ID của khách hàng hiện tại
                    const mergedBookings = allResults
                        .flat()
                        .filter(booking => String(booking.customerId) === String(currentUserId));
                    
                    // Sắp xếp lịch hẹn theo ngày và giờ bắt đầu giảm dần (mới nhất lên đầu)
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

        loadMyBookings();
    }, [navigate]);

    // Trả về thẻ Tag trạng thái tương ứng với mã màu sắc
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
                return <Tag color="default">{status}</Tag>;
        }
    };

    // Định nghĩa các cột cho bảng lịch hẹn
    const columns = [
        {
            title: "Mã đặt",
            dataIndex: "id",
            key: "id",
            width: "10%",
            render: (id) => <Text strong>#{id}</Text>
        },
        {
            title: "Chi nhánh",
            dataIndex: "branchName",
            key: "branchName",
            width: "20%",
            render: (text) => (
                <Space>
                    <ShopOutlined style={{ color: "#1890ff" }} />
                    <Text>{text}</Text>
                </Space>
            )
        },
        {
            title: "Dịch vụ đặt chỗ",
            key: "services",
            width: "25%",
            render: (_, record) => (
                <Space wrap size={[2, 4]}>
                    {record.items?.map(item => (
                        <Tag color="blue" key={item.id}>
                            {item.serviceName || item.bundleName}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Thợ đảm nhận",
            dataIndex: "assignedStaffName",
            key: "assignedStaffName",
            width: "15%",
            render: (name) => (
                <Space>
                    <UserOutlined style={{ color: "#52c41a" }} />
                    <Text>{name || "Tự động phân bổ"}</Text>
                </Space>
            )
        },
        {
            title: "Thời gian hẹn",
            key: "bookingTime",
            width: "15%",
            render: (_, record) => (
                <div>
                    <Text strong>{record.bookingDate}</Text>
                    <br />
                    <Text size="small" type="secondary">
                        <ClockCircleOutlined /> {record.startTime.substring(0, 5)} - {record.endTime.substring(0, 5)}
                    </Text>
                </div>
            )
        },
        {
            title: "Tổng tiền",
            dataIndex: "totalPrice",
            key: "totalPrice",
            width: "15%",
            render: (val) => <Text strong style={{ color: "#faad14" }}>{parseFloat(val).toLocaleString()} đ</Text>
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: "10%",
            render: (status) => getStatusTag(status)
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        <CalendarOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Lịch hẹn của tôi
                    </Title>
                    <Text type="secondary">Quản lý và xem lịch sử các đặt lịch hẹn làm đẹp của bạn.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => navigate("/booking")}
                >
                    Đặt lịch mới
                </Button>
            </div>

            <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <Spin size="large" tip="Đang tải lịch hẹn của bạn..." />
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={myBookings}
                        rowKey="id"
                        pagination={{ pageSize: 8 }}
                        bordered
                        locale={{
                            emptyText: (
                                <Empty
                                    description="Bạn chưa có lịch hẹn nào."
                                    style={{ padding: "40px 0" }}
                                >
                                    <Button type="primary" onClick={() => navigate("/booking")}>
                                        Đặt lịch hẹn đầu tiên ngay!
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
