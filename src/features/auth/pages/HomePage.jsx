import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Card, 
    Avatar, 
    Button, 
    Typography, 
    Row, 
    Col, 
    Space, 
    Divider, 
    Spin, 
    Statistic, 
    Badge,
    Tag
} from "antd";
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
    LogoutOutlined,
    ScissorOutlined,
    CheckCircleOutlined,
    LoginOutlined,
    UserAddOutlined,
    ShopOutlined,
    SmileOutlined
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import api from "@/core/api/axios";

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [branches, setBranches] = useState([]);
    const [stats, setStats] = useState({
        loyaltyPoints: 0,
        upcomingBookingsCount: 0,
        totalBookings: 0,
        revenue: 0,
        staffCount: 0
    });

    const { logout } = useAuth();
    const token = localStorage.getItem("accessToken");
    const isLogin = !!token;

    useEffect(() => {
        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
        if (isLogin) {
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
        }

        // Tải chi nhánh công khai trưng bày cho cả Khách vãng lai và Member
        api.get("/api/v1/branches/public")
            .then(res => setBranches(res.data || []))
            .catch(() => setBranches([]));

        if (isLogin) {
            const fetchStats = async () => {
                const currentUserId = localStorage.getItem("userId");
                if (!currentUserId) return;

                const isStaff = auth?.roles?.some(role => 
                    ["OWNER", "ADMIN", "STAFF", "MANAGER"].includes(role.toUpperCase())
                );

                try {
                    setLoadingStats(true);
                    const branchesData = await api.get("/api/v1/branches/public").then(res => res.data || []);
                    
                    if (branchesData.length > 0) {
                        const bookingsPromises = branchesData.map(branch =>
                            api.get(`/api/v1/branches/${branch.id}/bookings`)
                                .then(res => res.data || [])
                                .catch(() => [])
                        );

                        const allResults = await Promise.all(bookingsPromises);
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

                        let totalRevenue = 0;
                        if (isStaff) {
                            const allBookings = allResults.flat();
                            totalRevenue = allBookings
                                .filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
                                .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
                        }

                        setStats({
                            loyaltyPoints: 0,
                            upcomingBookingsCount: upcoming,
                            totalBookings: total,
                            revenue: totalRevenue,
                            staffCount: 8
                        });
                    }
                } catch (err) {
                    console.error("Lỗi khi tải thông tin thống kê:", err);
                } finally {
                    setLoadingStats(false);
                }
            };

            fetchStats();
        }
    }, [isLogin]);

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const isStaffOrOwner = user?.roles?.some(role => 
        ["OWNER", "ADMIN", "STAFF", "MANAGER"].includes(role.toUpperCase())
    );

    // =========================================================================
    // GUEST LANDING VIEW (KHI CHƯA ĐĂNG NHẬP - KHÁCH VÃNG LAI)
    // =========================================================================
    if (!isLogin) {
        return (
            <div style={{ maxWidth: 1200, margin: "20px auto 40px", padding: "0 20px" }}>
                {/* Hero Banner Khách Vãng Lai */}
                <Card
                    style={{
                        borderRadius: 24,
                        border: "none",
                        background: "linear-gradient(135deg, #002c8c 0%, #1677ff 50%, #13c2c2 100%)",
                        color: "#fff",
                        boxShadow: "0 12px 36px rgba(22, 119, 255, 0.25)",
                        marginBottom: 36,
                        padding: "24px 20px"
                    }}
                >
                    <Row align="middle" gutter={[32, 32]}>
                        <Col xs={24} md={14}>
                            <Tag color="cyan" style={{ borderRadius: 12, padding: "4px 12px", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                                ✨ Trải nghiệm Đặt Lịch Nhanh Không Cần Đăng Nhập
                            </Tag>
                            <Title level={1} style={{ color: "#fff", margin: 0, fontSize: 36, fontWeight: 800 }}>
                                SalonFlow - Đặt Lịch Làm Đẹp Dễ Dàng
                            </Title>
                            <Paragraph style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 17, marginTop: 12, marginBottom: 24, lineHeight: 1.6 }}>
                                Đặt lịch cắt tóc, uốn nhuộm, làm móng & chăm sóc da nhanh chóng chỉ với vài cú nhấp chuột. Khách vãng lai có thể đặt giữ chỗ ngay lập tức!
                            </Paragraph>

                            <Space size="middle" wrap>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ScissorOutlined />}
                                    onClick={() => navigate("/guest-booking")}
                                    style={{
                                        height: 50,
                                        padding: "0 28px",
                                        borderRadius: 25,
                                        fontSize: 16,
                                        fontWeight: 700,
                                        backgroundColor: "#ff4d4f",
                                        borderColor: "#ff4d4f",
                                        boxShadow: "0 6px 20px rgba(255, 77, 79, 0.4)"
                                    }}
                                >
                                    Đặt lịch vãng lai ngay
                                </Button>
                                <Button
                                    ghost
                                    size="large"
                                    icon={<ShoppingOutlined />}
                                    onClick={() => navigate("/services")}
                                    style={{
                                        height: 50,
                                        padding: "0 24px",
                                        borderRadius: 25,
                                        fontSize: 16,
                                        color: "#fff",
                                        borderColor: "rgba(255, 255, 255, 0.7)"
                                    }}
                                >
                                    Xem dịch vụ & Giá
                                </Button>
                            </Space>
                        </Col>
                        <Col xs={24} md={10} style={{ textAlign: "center" }}>
                            <div style={{
                                background: "rgba(255, 255, 255, 0.15)",
                                backdropFilter: "blur(10px)",
                                padding: 28,
                                borderRadius: 20,
                                border: "1px solid rgba(255, 255, 255, 0.25)"
                            }}>
                                <SmileOutlined style={{ fontSize: 48, color: "#fff", marginBottom: 12 }} />
                                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                                    Bạn đã có tài khoản SalonFlow?
                                </Title>
                                <Paragraph style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 14, marginTop: 8 }}>
                                    Đăng nhập để xem lịch sử hẹn, tích điểm thưởng và nhận các ưu đãi độc quyền.
                                </Paragraph>
                                <Space style={{ marginTop: 12 }} wrap>
                                    <Button
                                        type="default"
                                        icon={<LoginOutlined />}
                                        onClick={() => navigate("/login")}
                                        style={{ borderRadius: 8, fontWeight: 600 }}
                                    >
                                        Đăng nhập
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<UserAddOutlined />}
                                        onClick={() => navigate("/register")}
                                        style={{ borderRadius: 8, fontWeight: 600, backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                                    >
                                        Đăng ký tài khoản
                                    </Button>
                                </Space>
                            </div>
                        </Col>
                    </Row>
                </Card>

                {/* Quy trình 3 bước đặt lịch nhanh */}
                <Title level={3} style={{ marginBottom: 20, textAlign: "center" }}>
                    🚀 Quy trình Đặt lịch Khách vãng lai 3 bước
                </Title>
                <Row gutter={[20, 20]} style={{ marginBottom: 40 }}>
                    <Col xs={24} md={8}>
                        <Card hoverable style={{ borderRadius: 20, height: "100%", textAlign: "center", border: "1px solid #e6f7ff" }}>
                            <ShopOutlined style={{ fontSize: 42, color: "#1677ff", marginBottom: 16 }} />
                            <Title level={4}>1. Chọn Salon & Dịch vụ</Title>
                            <Paragraph type="secondary">
                                Lựa chọn chi nhánh Salon gần bạn nhất và bộ dịch vụ làm đẹp yêu thích.
                            </Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable style={{ borderRadius: 20, height: "100%", textAlign: "center", border: "1px solid #f9f0ff" }}>
                            <ClockCircleOutlined style={{ fontSize: 42, color: "#722ed1", marginBottom: 16 }} />
                            <Title level={4}>2. Chọn Thợ & Giờ cắt</Title>
                            <Paragraph type="secondary">
                                Chọn thợ tạo kiểu tay nghề cao và khung giờ trống phù hợp với thời gian của bạn.
                            </Paragraph>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card hoverable style={{ borderRadius: 20, height: "100%", textAlign: "center", border: "1px solid #f6ffed" }}>
                            <CheckCircleOutlined style={{ fontSize: 42, color: "#52c41a", marginBottom: 16 }} />
                            <Title level={4}>3. Điền thông tin & Hoàn tất</Title>
                            <Paragraph type="secondary">
                                Nhập Tên & Số điện thoại liên hệ để nhận mã xác nhận lịch hẹn tức thì.
                            </Paragraph>
                        </Card>
                    </Col>
                </Row>

                {/* Danh sách Chi nhánh Trưng bày */}
                {branches.length > 0 && (
                    <div>
                        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                            <Col><Title level={3} style={{ margin: 0 }}>🏬 Chi nhánh Salon nổi bật</Title></Col>
                            <Col>
                                <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate("/search")}>
                                    Xem tất cả chi nhánh
                                </Button>
                            </Col>
                        </Row>
                        <Row gutter={[20, 20]} style={{ marginBottom: 40 }}>
                            {branches.slice(0, 3).map(branch => (
                                <Col xs={24} sm={12} md={8} key={branch.id}>
                                    <Card
                                        hoverable
                                        onClick={() => navigate("/guest-booking")}
                                        style={{ borderRadius: 16, overflow: "hidden" }}
                                    >
                                        <Title level={5} style={{ marginTop: 0, marginBottom: 8, color: "#1677ff" }}>
                                            {branch.name}
                                        </Title>
                                        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                                            📍 {branch.address || "Chi nhánh chính thức SalonFlow"}
                                        </Paragraph>
                                        <Button type="primary" ghost size="small" icon={<ScissorOutlined />}>
                                            Đặt lịch tại chi nhánh này
                                        </Button>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </div>
        );
    }

    // =========================================================================
    // MEMBER / STAFF LOGGED-IN VIEW (KHI ĐÃ ĐĂNG NHẬP)
    // =========================================================================
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
                                    onClick={() => navigate("/owner")}
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
                                    onClick={() => navigate("/owner/staff")}
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
                                    onClick={() => navigate("/owner/services")}
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