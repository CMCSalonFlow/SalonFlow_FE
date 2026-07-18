import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Button, Typography, Row, Col, Space, Divider, Spin, Statistic, Badge } from "antd";
import { 
    UserOutlined, 
    CalendarOutlined, 
    DollarCircleOutlined, 
    ClockCircleOutlined, 
    TeamOutlined, 
    SettingOutlined, 
    StarOutlined, 
    ShoppingOutlined,
    ArrowRightOutlined,
    LogoutOutlined
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import api from "@/core/api/axios";

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [stats, setStats] = useState({
        loyaltyPoints: 0,
        upcomingBookingsCount: 0,
        totalBookings: 0,
        revenue: 0,
        staffCount: 0
    });

    const { logout } = useAuth();

    useEffect(() => {
        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
        setUser(auth);

        const currentUserId = localStorage.getItem("userId");
        if (currentUserId) {
            api.get(`/api/v1/users/${currentUserId}`)
                .then(res => {
                    setUser(prev => ({ ...prev, ...res.data }));
                    if (res.data?.fullName) {
                        localStorage.setItem("fullName", res.data.fullName);
                    }
                })
                .catch(err => console.error("Lỗi tải thông tin user:", err));
        }

        const fetchStats = async () => {
            const currentUserId = localStorage.getItem("userId");
            if (!currentUserId) return;

            const isStaff = auth?.roles?.some(role => 
                ["OWNER", "ADMIN", "STAFF", "MANAGER"].includes(role.toUpperCase())
            );

            try {
                setLoadingStats(true);
                
                // Lấy tất cả chi nhánh công khai
                const branchesData = await api.get("/api/v1/branches/public").then(res => res.data || []);
                
                if (branchesData.length > 0) {
                    const bookingsPromises = branchesData.map(branch =>
                        api.get(`/api/v1/branches/${branch.id}/bookings`)
                            .then(res => res.data || [])
                            .catch(() => [])
                    );

                    const allResults = await Promise.all(bookingsPromises);
                    
                    // Lọc lịch hẹn của chính khách hàng này
                    const mergedBookings = allResults
                        .flat()
                        .filter(booking => String(booking.customerId) === String(currentUserId));

                    const now = new Date();
                    const isUpcoming = (booking) => {
                        if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
                            return false;
                        }
                        const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
                        return bookingDateTime >= now;
                    };

                    const upcoming = mergedBookings.filter(isUpcoming).length;
                    const total = mergedBookings.length;

                    // Tính doanh thu thực tế từ tất cả lịch đã hoàn thành (nếu là STAFF/OWNER)
                    let totalRevenue = 0;
                    if (isStaff) {
                        const allBookings = allResults.flat();
                        totalRevenue = allBookings
                            .filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
                            .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
                    }

                    setStats({
                        loyaltyPoints: 0, // Hệ thống chưa kích hoạt tích lũy điểm thực tế
                        upcomingBookingsCount: upcoming,
                        totalBookings: total,
                        revenue: totalRevenue,
                        staffCount: 8 // Số lượng thợ mặc định trưng bày
                    });
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin thống kê thực tế:", err);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isStaffOrOwner = user?.roles?.some(role => 
        ["OWNER", "ADMIN", "STAFF", "MANAGER"].includes(role.toUpperCase())
    );

    return (
        <div style={{ maxWidth: 1200, margin: "30px auto", padding: "0 20px" }}>
            {/* Banner chào mừng & Profile tóm tắt */}
            <Card
                style={{
                    borderRadius: 24,
                    border: "none",
                    background: isStaffOrOwner 
                        ? "linear-gradient(135deg, #722ed1 0%, #391085 100%)" 
                        : "linear-gradient(135deg, #1677ff 0%, #003a8c 100%)",
                    color: "#fff",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
                    marginBottom: 32,
                    padding: "10px 20px"
                }}
            >
                <Row align="middle" gutter={[24, 24]}>
                    <Col xs={24} sm={4} style={{ textAlign: "center" }}>
                        <Avatar 
                            size={90} 
                            icon={<UserOutlined />} 
                            style={{ 
                                backgroundColor: "rgba(255, 255, 255, 0.25)",
                                border: "3px solid rgba(255, 255, 255, 0.5)",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={14}>
                        <Title level={2} style={{ color: "#fff", margin: 0 }}>
                            Xin chào, {user?.fullName || user?.username || "Thành viên"}!
                        </Title>
                        <Paragraph style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 16, marginTop: 8, marginBottom: 0 }}>
                            Chào mừng bạn quay lại hệ thống quản lý và đặt lịch **SalonFlow**. 
                            Bạn đang truy cập với vai trò: <TagColor role={user?.roles?.[0]} />
                        </Paragraph>
                    </Col>
                    <Col xs={24} sm={6} style={{ textAlign: "right" }}>
                        <Space size="middle">
                            <Button 
                                ghost 
                                shape="round" 
                                size="large" 
                                icon={<LogoutOutlined />} 
                                onClick={handleLogout}
                                style={{ borderColor: "rgba(255, 255, 255, 0.45)", color: "#fff" }}
                            >
                                Đăng xuất
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Spin spinning={loadingStats}>
                {isStaffOrOwner ? (
                    // ==========================================
                    // OWNER / ADMIN / STAFF DASHBOARD VIEW
                    // ==========================================
                    <div>
                        <Title level={3} style={{ marginBottom: 24 }}>
                            📊 Bảng điều khiển hoạt động kinh doanh
                        </Title>
                        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                            <Col xs={24} sm={12} lg={6}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Doanh thu tháng này" 
                                        value={stats.revenue} 
                                        precision={0}
                                        valueStyle={{ color: "#3f8600", fontWeight: 700 }}
                                        prefix={<DollarCircleOutlined style={{ marginRight: 8, color: "#3f8600" }} />}
                                        suffix="đ"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Tổng số lượt đặt lịch" 
                                        value={stats.totalBookings} 
                                        valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                                        prefix={<CalendarOutlined style={{ marginRight: 8, color: "#722ed1" }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Nhân sự đang hoạt động" 
                                        value={stats.staffCount} 
                                        valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                                        prefix={<TeamOutlined style={{ marginRight: 8, color: "#fa8c16" }} />}
                                        suffix="thợ"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Lịch hẹn mới hôm nay" 
                                        value={stats.upcomingBookingsCount} 
                                        valueStyle={{ color: "#1890ff", fontWeight: 700 }}
                                        prefix={<ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Title level={4} style={{ marginBottom: 16 }}>⚡ Phím tắt Quản trị nhanh</Title>
                        <Row gutter={[20, 20]}>
                            <Col xs={24} sm={12} md={8}>
                                <Card 
                                    hoverable 
                                    onClick={() => navigate("/dashboard")}
                                    style={{ borderRadius: 16, textAlign: "center", padding: "10px 0" }}
                                >
                                    <SettingOutlined style={{ fontSize: 36, color: "#722ed1", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Trang quản trị (Dashboard)</Title>
                                    <Text type="secondary">Quản lý doanh thu, báo cáo chi tiết</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card 
                                    hoverable 
                                    onClick={() => navigate("/staff")}
                                    style={{ borderRadius: 16, textAlign: "center", padding: "10px 0" }}
                                >
                                    <TeamOutlined style={{ fontSize: 36, color: "#fa8c16", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Quản lý nhân viên</Title>
                                    <Text type="secondary">Phân ca, trực lịch và thiết lập dịch vụ</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card 
                                    hoverable 
                                    onClick={() => navigate("/services")}
                                    style={{ borderRadius: 16, textAlign: "center", padding: "10px 0" }}
                                >
                                    <ShoppingOutlined style={{ fontSize: 36, color: "#1890ff", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Quản lý dịch vụ</Title>
                                    <Text type="secondary">Thêm mới dịch vụ, cài đặt giá và combo</Text>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    // ==========================================
                    // CLIENT / CUSTOMER PORTAL VIEW
                    // ==========================================
                    <div>
                        <Title level={3} style={{ marginBottom: 24 }}>
                            🌟 Thông tin hội viên & Tiện ích nhanh
                        </Title>
                        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                            <Col xs={24} sm={8}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Điểm tích lũy" 
                                        value={stats.loyaltyPoints} 
                                        valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                                        prefix={<StarOutlined style={{ marginRight: 8, color: "#fa8c16" }} />}
                                        suffix="điểm"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Lịch hẹn sắp tới" 
                                        value={stats.upcomingBookingsCount} 
                                        valueStyle={{ color: "#52c41a", fontWeight: 700 }}
                                        prefix={<ClockCircleOutlined style={{ marginRight: 8, color: "#52c41a" }} />}
                                        suffix="lịch"
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                                    <Statistic 
                                        title="Tổng số lượt làm đẹp" 
                                        value={stats.totalBookings} 
                                        valueStyle={{ color: "#1677ff", fontWeight: 700 }}
                                        prefix={<CalendarOutlined style={{ marginRight: 8, color: "#1677ff" }} />}
                                        suffix="lượt"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Row gutter={[24, 24]}>
                            {/* Phím tắt đặt lịch nhanh */}
                            <Col xs={24} md={12}>
                                <Card 
                                    style={{ 
                                        borderRadius: 20, 
                                        background: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                                        border: "none",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)"
                                    }}
                                    bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                                >
                                    <div>
                                        <Title level={4} style={{ color: "#0050b3", marginTop: 0 }}>✂️ Đặt lịch làm đẹp</Title>
                                        <Paragraph style={{ color: "#003a8c", fontSize: 14 }}>
                                            Đặt lịch chăm sóc tóc, tạo kiểu, làm móng hoặc các combo thư giãn nhanh chóng với thợ yêu thích tại chi nhánh gần nhất.
                                        </Paragraph>
                                    </div>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        icon={<ArrowRightOutlined />} 
                                        onClick={() => navigate("/booking")}
                                        style={{ alignSelf: "flex-start", borderRadius: 8, marginTop: 12 }}
                                    >
                                        Đặt lịch ngay
                                    </Button>
                                </Card>
                            </Col>

                            <Col xs={24} md={12}>
                                <Card 
                                    style={{ 
                                        borderRadius: 20, 
                                        background: "linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)",
                                        border: "none",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)"
                                    }}
                                    bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                                >
                                    <div>
                                        <Title level={4} style={{ color: "#531dab", marginTop: 0 }}>👤 Hồ sơ cá nhân</Title>
                                        <Paragraph style={{ color: "#391085", fontSize: 14 }}>
                                            Xem lại thông tin cá nhân, vai trò người dùng hiện tại và quản lý mã tích điểm của bạn.
                                        </Paragraph>
                                    </div>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        icon={<ArrowRightOutlined />} 
                                        onClick={() => navigate("/profile")}
                                        style={{ alignSelf: "flex-start", borderRadius: 8, marginTop: 12, backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                                    >
                                        Quản lý hồ sơ
                                    </Button>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
            </Spin>
        </div>
    );
}

function TagColor({ role }) {
    if (!role) return <Badge status="default" text="GUEST" />;
    
    let color = "blue";
    if (role === "OWNER") color = "purple";
    if (role === "ADMIN") color = "red";
    if (role === "STAFF" || role === "MANAGER") color = "orange";

    return (
        <span 
            style={{ 
                backgroundColor: color === "purple" ? "#f9f0ff" : color === "red" ? "#fff1f0" : color === "orange" ? "#fff7e6" : "#e6f7ff",
                color: color === "purple" ? "#722ed1" : color === "red" ? "#cf1322" : color === "orange" ? "#d46b08" : "#1890ff",
                border: `1px solid ${color === "purple" ? "#d3adf7" : color === "red" ? "#ffa39e" : color === "orange" ? "#ffd591" : "#91d5ff"}`,
                borderRadius: 6,
                fontWeight: 600,
                padding: "2px 8px",
                fontSize: 12,
                display: "inline-block",
                marginLeft: 4
            }}
        >
            {role.toUpperCase()}
        </span>
    );
}