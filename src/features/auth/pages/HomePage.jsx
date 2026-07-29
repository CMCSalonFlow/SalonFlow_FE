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
    Tag,
    Rate,
    Tooltip
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
    SmileOutlined,
    ThunderboltOutlined,
    SafetyCertificateOutlined,
    GiftOutlined,
    HeartOutlined,
    EnvironmentOutlined,
    CheckOutlined,
    CrownOutlined,
    FireOutlined
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

        // Tải danh sách chi nhánh
        api.get("/api/v1/branches/my-branches")
            .then(res => setBranches(res.data || []))
            .catch(() => {
                api.get("/api/v1/branches")
                    .then(res => setBranches(res.data || []))
                    .catch(() => setBranches([]));
            });

        if (isLogin) {
            const fetchStats = async () => {
                const rawUserId = localStorage.getItem("userId");
                const currentUserId = rawUserId || auth?.id || JSON.parse(localStorage.getItem("user") || "{}")?.id;
                if (!currentUserId) return;

                const isStaff = auth?.roles?.some(role => 
                    ["OWNER", "ADMIN", "STAFF", "MANAGER"].includes(role.toUpperCase())
                );

                try {
                    setLoadingStats(true);
                    let branchesData = await api.get("/api/v1/branches/my-branches")
                        .then(res => res.data || [])
                        .catch(() => []);
                    
                    if (branchesData.length === 0) {
                        branchesData = await api.get("/api/v1/branches")
                            .then(res => res.data || [])
                            .catch(() => []);
                    }

                    if (branchesData.length > 0) {
                        const bookingsPromises = branchesData.map(branch =>
                            api.get(`/api/v1/branches/${branch.id}/bookings`)
                                .then(res => res.data || [])
                                .catch(() => [])
                        );

                        const allResults = await Promise.all(bookingsPromises);
                        const mergedBookings = allResults
                            .flat()
                            .filter(b => 
                                String(b.customerId) === String(currentUserId) ||
                                String(b.userId) === String(currentUserId) ||
                                String(b.customer?.id) === String(currentUserId)
                            );

                        const upcoming = mergedBookings.filter(b => b.status === "PENDING" || b.status === "CONFIRMED").length;
                        const total = mergedBookings.length;

                        let totalRevenue = 0;
                        if (isStaff) {
                            const allBookings = allResults.flat();
                            totalRevenue = allBookings
                                .filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
                                .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
                        }

                        // Lấy đúng số điểm tích lũy của khách hàng từ endpoint /api/v1/loyalty/summary
                        let userPoints = 0;
                        try {
                            const loyaltyRes = await api.get("/api/v1/loyalty/summary").catch(() => null);
                            if (loyaltyRes && loyaltyRes.data) {
                                userPoints = loyaltyRes.data.totalPoints ?? loyaltyRes.data.pointsBalance ?? 0;
                            }
                        } catch (e) {
                            userPoints = 0;
                        }

                        setStats({
                            loyaltyPoints: userPoints,
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

    // Dữ liệu danh mục dịch vụ mẫu hình ảnh cao cấp
    const featuredCategories = [
        {
            title: "Cắt & Tạo Kiểu Tóc",
            desc: "Tạo kiểu thời thượng, tư vấn form tóc phù hợp với khuôn mặt.",
            price: "Từ 150.000đ",
            tag: "HOT",
            tagColor: "red",
            image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800"
        },
        {
            title: "Uốn & Nhuộm Hàn Quốc",
            desc: "Công nghệ phủ bóng giữ màu lâu, bảo vệ cấu trúc tóc.",
            price: "Từ 450.000đ",
            tag: "TRENDING",
            tagColor: "purple",
            image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800"
        },
        {
            title: "Gội Đầu Dưỡng Sinh Spa",
            desc: "Massage ấn huyệt cổ vai gáy, giảm căng thẳng mệt mỏi.",
            price: "Từ 200.000đ",
            tag: "THƯ GIÃN",
            tagColor: "green",
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800"
        },
        {
            title: "Làm Móng & Nail Art",
            desc: "Chăm sóc móng chuyên nghiệp, sơn gel và đính đá cao cấp.",
            price: "Từ 180.000đ",
            tag: "YÊU THÍCH",
            tagColor: "pink",
            image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800"
        }
    ];

    // Dữ liệu đặc quyền hội viên
    const memberPerks = [
        {
            icon: <GiftOutlined style={{ fontSize: 32, color: "#fa8c16" }} />,
            title: "Tích Điểm Thưởng 5%",
            desc: "Tích lũy 5% tổng giá trị mỗi hóa đơn để đổi Voucher giảm giá trực tiếp."
        },
        {
            icon: <ThunderboltOutlined style={{ fontSize: 32, color: "#1677ff" }} />,
            title: "Ưu Tiên Xếp Lịch",
            desc: "Ưu tiên phục vụ đúng khung giờ đặt, không phải chờ đợi tại salon."
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: "#52c41a" }} />,
            title: "Bảo Hành 7 Ngày",
            desc: "Miễn phí dặm lại màu nhuộm hoặc chỉnh nếp uốn nếu bạn chưa hài lòng."
        },
        {
            icon: <CrownOutlined style={{ fontSize: 32, color: "#722ed1" }} />,
            title: "Quà Sinh Nhật VIP",
            desc: "Nhận Voucher ưu đãi dịch vụ đặc biệt vào đúng tháng sinh nhật của bạn."
        }
    ];

    // Dữ liệu đánh giá từ khách hàng
    const testimonials = [
        {
            name: "Nguyễn Thị Lan",
            role: "Khách hàng thân thiết",
            rating: 5,
            comment: "Dịch vụ uốn nhuộm ở SalonFlow rất đẹp và bền màu. Thợ tư vấn tận tình, đặt lịch trên web đến là được phục vụ ngay không phải chờ!",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"
        },
        {
            name: "Trần Hoàng Anh",
            role: "Khách hàng đặt online",
            rating: 5,
            comment: "Không gian salon hiện đại, sạch sẽ. Đặt giữ chỗ 30 giây xong nhận tin nhắn xác nhận rất chuyên nghiệp. Đánh giá 5 sao!",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200"
        },
        {
            name: "Lê Mỹ Duyên",
            role: "Hội viên SalonFlow",
            rating: 5,
            comment: "Combo gội đầu dưỡng sinh ấn huyệt siêu dễ chịu. Cứ cuối tuần là mình lại tranh thủ đặt lịch làm đẹp và tích điểm đổi voucher.",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200"
        }
    ];

    // =========================================================================
    // GUEST LANDING VIEW (KHI CHƯA ĐĂNG NHẬP - KHÁCH VÃNG LAI)
    // =========================================================================
    if (!isLogin) {
        return (
            <div style={{ maxWidth: 1200, margin: "20px auto 60px", padding: "0 20px" }}>
                {/* HERO BANNER VÃNG LAI */}
                <Card
                    style={{
                        borderRadius: 28,
                        border: "none",
                        overflow: "hidden",
                        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(22, 119, 255, 0.78) 50%, rgba(114, 46, 209, 0.82) 100%), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600') center/cover no-repeat",
                        color: "#fff",
                        boxShadow: "0 20px 50px rgba(22, 119, 255, 0.3)",
                        marginBottom: 44,
                        padding: "36px 28px"
                    }}
                >
                    <Row align="middle" gutter={[36, 36]}>
                        <Col xs={24} lg={14}>
                            <Tag color="cyan" style={{ borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700, marginBottom: 16, border: "none" }}>
                                ✨ HỆ THỐNG ĐẶT LỊCH SALON LÀM ĐẸP CAO CẤP
                            </Tag>
                            <Title level={1} style={{ color: "#fff", margin: 0, fontSize: 40, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                                SalonFlow - Nâng Tầm Trải Nghiệm Làm Đẹp
                            </Title>
                            <Paragraph style={{ color: "rgba(255, 255, 255, 0.92)", fontSize: 17, marginTop: 16, marginBottom: 32, lineHeight: 1.7 }}>
                                Đặt lịch cắt tóc, tạo kiểu, uốn nhuộm Hàn Quốc, gội đầu dưỡng sinh & nail art trong **30 giây** mà **không cần đăng ký tài khoản**. Đảm bảo giữ chỗ 100%!
                            </Paragraph>

                            <Space size="large" wrap>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ScissorOutlined />}
                                    onClick={() => navigate("/guest-booking")}
                                    style={{
                                        height: 54,
                                        padding: "0 32px",
                                        borderRadius: 27,
                                        fontSize: 16,
                                        fontWeight: 700,
                                        backgroundColor: "#ff4d4f",
                                        borderColor: "#ff4d4f",
                                        boxShadow: "0 8px 24px rgba(255, 77, 79, 0.45)"
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
                                        height: 54,
                                        padding: "0 28px",
                                        borderRadius: 27,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color: "#fff",
                                        borderColor: "rgba(255, 255, 255, 0.8)",
                                        backdropFilter: "blur(4px)"
                                    }}
                                >
                                    Xem dịch vụ & Bảng giá
                                </Button>
                            </Space>

                            <Divider style={{ borderColor: "rgba(255,255,255,0.2)", margin: "28px 0 20px" }} />
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={8}>
                                    <Space style={{ color: "#fff" }}>
                                        <ThunderboltOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                                        <Text style={{ color: "#fff", fontWeight: 600 }}>Đặt lịch 30s</Text>
                                    </Space>
                                </Col>
                                <Col xs={12} sm={8}>
                                    <Space style={{ color: "#fff" }}>
                                        <SafetyCertificateOutlined style={{ color: "#1890ff", fontSize: 20 }} />
                                        <Text style={{ color: "#fff", fontWeight: 600 }}>Giữ chỗ 100%</Text>
                                    </Space>
                                </Col>
                                <Col xs={12} sm={8}>
                                    <Space style={{ color: "#fff" }}>
                                        <StarOutlined style={{ color: "#faad14", fontSize: 20 }} />
                                        <Text style={{ color: "#fff", fontWeight: 600 }}>4.9/5★ Đánh giá</Text>
                                    </Space>
                                </Col>
                            </Row>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card
                                style={{
                                    background: "rgba(255, 255, 255, 0.16)",
                                    backdropFilter: "blur(16px)",
                                    borderRadius: 24,
                                    border: "1px solid rgba(255, 255, 255, 0.3)",
                                    padding: "24px 20px",
                                    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)",
                                    textAlign: "center"
                                }}
                            >
                                <Avatar 
                                    size={64} 
                                    icon={<UserOutlined />} 
                                    style={{ 
                                        backgroundColor: "#ffffff", 
                                        color: "#1677ff", 
                                        fontSize: 32,
                                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                                        marginBottom: 12 
                                    }} 
                                />
                                <Title level={3} style={{ color: "#fff", margin: "0 0 6px 0" }}>
                                    Hội Viên SalonFlow
                                </Title>
                                <Paragraph style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: 14, marginBottom: 20 }}>
                                    Tích điểm thưởng sau mỗi lần dịch vụ, xem lại lịch sử cuộc hẹn và đổi các Voucher ưu đãi độc quyền.
                                </Paragraph>
                                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                                    <Button
                                        block
                                        size="large"
                                        icon={<LoginOutlined />}
                                        onClick={() => navigate("/login")}
                                        style={{ 
                                            borderRadius: 14, 
                                            fontWeight: 700,
                                            height: 46,
                                            borderColor: "#fff",
                                            color: "#1677ff",
                                            backgroundColor: "#fff" 
                                        }}
                                    >
                                        Đăng nhập ngay
                                    </Button>
                                    <Button
                                        block
                                        type="primary"
                                        size="large"
                                        icon={<UserAddOutlined />}
                                        onClick={() => navigate("/register")}
                                        style={{ 
                                            borderRadius: 14, 
                                            fontWeight: 700, 
                                            height: 46,
                                            backgroundColor: "#722ed1", 
                                            borderColor: "#722ed1" 
                                        }}
                                    >
                                        Tạo tài khoản mới
                                    </Button>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* ✂️ DANH MỤC DỊCH VỤ NỔI BẬT */}
                <div style={{ marginBottom: 48 }}>
                    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                        <Col>
                            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                                ✂️ Dịch Vụ Nổi Bật Tại SalonFlow
                            </Title>
                            <Text type="secondary" style={{ fontSize: 15 }}>
                                Đa dạng dịch vụ chăm sóc sắc đẹp cao cấp thực hiện bởi đội ngũ Stylist giàu kinh nghiệm.
                            </Text>
                        </Col>
                        <Col>
                            <Button 
                                type="primary" 
                                ghost 
                                shape="round" 
                                icon={<ArrowRightOutlined />}
                                onClick={() => navigate("/services")}
                            >
                                Xem tất cả dịch vụ
                            </Button>
                        </Col>
                    </Row>

                    <Row gutter={[24, 24]}>
                        {featuredCategories.map((item, idx) => (
                            <Col xs={24} sm={12} lg={6} key={idx}>
                                <Card
                                    hoverable
                                    cover={
                                        <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                                            <img
                                                alt={item.title}
                                                src={item.image}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                                                onMouseEnter={(e) => e.target.style.transform = "scale(1.08)"}
                                                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                            />
                                            <Tag 
                                                color={item.tagColor} 
                                                style={{ position: "absolute", top: 12, right: 12, borderRadius: 10, fontWeight: 700, padding: "2px 10px" }}
                                            >
                                                {item.tag}
                                            </Tag>
                                        </div>
                                    }
                                    style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.04)", height: "100%" }}
                                    bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                                >
                                    <div>
                                        <Title level={4} style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                                            {item.title}
                                        </Title>
                                        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16, height: 40, overflow: "hidden" }}>
                                            {item.desc}
                                        </Paragraph>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Text strong style={{ color: "#ff4d4f", fontSize: 16, fontWeight: 700 }}>
                                            {item.price}
                                        </Text>
                                        <Button
                                            type="primary"
                                            size="small"
                                            shape="round"
                                            icon={<ScissorOutlined />}
                                            onClick={() => navigate("/guest-booking")}
                                        >
                                            Đặt ngay
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* 🚀 QUY TRÌNH 3 BƯỚC ĐẶT LỊCH VÃNG LAI */}
                <Card
                    style={{
                        borderRadius: 24,
                        background: "linear-gradient(135deg, #f8fafc 0%, #e6f7ff 100%)",
                        border: "1px solid #bae7ff",
                        marginBottom: 48,
                        padding: "16px 8px"
                    }}
                >
                    <Title level={2} style={{ textAlign: "center", marginBottom: 32, fontWeight: 700 }}>
                        🚀 Quy Trình Đặt Lịch Khách Vãng Lai 3 Bước Siêu Tốc
                    </Title>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={8}>
                            <Card 
                                bordered={false} 
                                style={{ borderRadius: 20, height: "100%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}
                            >
                                <div style={{ height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=500"
                                        alt="Chọn dịch vụ"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <Tag color="blue" style={{ borderRadius: 12, fontWeight: 700, marginBottom: 8 }}>BƯỚC 1</Tag>
                                <Title level={4} style={{ margin: "4px 0 8px" }}>1. Chọn Salon & Dịch Vụ</Title>
                                <Paragraph type="secondary" style={{ fontSize: 14 }}>
                                    Lựa chọn chi nhánh Salon mún làm đẹp và combo dịch vụ yêu thích.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card 
                                bordered={false} 
                                style={{ borderRadius: 20, height: "100%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}
                            >
                                <div style={{ height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=500"
                                        alt="Chọn thợ"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <Tag color="purple" style={{ borderRadius: 12, fontWeight: 700, marginBottom: 8 }}>BƯỚC 2</Tag>
                                <Title level={4} style={{ margin: "4px 0 8px" }}>2. Chọn Stylist & Giờ Cắt</Title>
                                <Paragraph type="secondary" style={{ fontSize: 14 }}>
                                    Tự do lựa chọn thợ làm tóc quen thuộc và khung giờ trống tiện lợi.
                                </Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card 
                                bordered={false} 
                                style={{ borderRadius: 20, height: "100%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}
                            >
                                <div style={{ height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=500"
                                        alt="Điền thông tin"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <Tag color="green" style={{ borderRadius: 12, fontWeight: 700, marginBottom: 8 }}>BƯỚC 3</Tag>
                                <Title level={4} style={{ margin: "4px 0 8px" }}>3. Điền Tên & Nhận Giữ Chỗ</Title>
                                <Paragraph type="secondary" style={{ fontSize: 14 }}>
                                    Nhập SĐT nhận mã xác nhận cuộc hẹn tức thì mà không cần đăng nhập.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* 🏬 CHI NHÁNH SALON NỔI BẬT */}
                {branches.length > 0 && (
                    <div style={{ marginBottom: 48 }}>
                        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                            <Col>
                                <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                                    🏬 Hệ Thống Chi Nhánh Salon
                                </Title>
                                <Text type="secondary" style={{ fontSize: 15 }}>
                                    Không gian hiện đại, trang thiết bị tiên tiến tại các khu vực trung tâm.
                                </Text>
                            </Col>
                            <Col>
                                <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate("/search")}>
                                    Tìm chi nhánh gần bạn
                                </Button>
                            </Col>
                        </Row>
                        <Row gutter={[24, 24]}>
                            {branches.slice(0, 3).map((branch, i) => (
                                <Col xs={24} sm={12} md={8} key={branch.id}>
                                    <Card
                                        hoverable
                                        onClick={() => navigate("/guest-booking")}
                                        cover={
                                            <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                                                <img
                                                    alt={branch.name}
                                                    src={i === 0 
                                                        ? "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=800" 
                                                        : i === 1 
                                                        ? "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800"
                                                        : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800"
                                                    }
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                                <Tag color="gold" style={{ position: "absolute", top: 12, left: 12, borderRadius: 10, fontWeight: 700 }}>
                                                    ⭐ 4.9/5
                                                </Tag>
                                            </div>
                                        }
                                        style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}
                                    >
                                        <Title level={4} style={{ marginTop: 0, marginBottom: 8, color: "#1677ff" }}>
                                            {branch.name}
                                        </Title>
                                        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                                            <EnvironmentOutlined style={{ marginRight: 6, color: "#ff4d4f" }} />
                                            {branch.address || "Chi nhánh chính thức SalonFlow"}
                                        </Paragraph>
                                        <Button type="primary" ghost block shape="round" icon={<ScissorOutlined />}>
                                            Đặt lịch tại chi nhánh này
                                        </Button>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* ⭐ ĐÁNH GIÁ TỪ KHÁCH HÀNG THỰC TẾ */}
                <div style={{ marginBottom: 40 }}>
                    <Title level={2} style={{ textAlign: "center", marginBottom: 32, fontWeight: 700 }}>
                        ⭐ Khách Hàng Nói Gì Về SalonFlow?
                    </Title>
                    <Row gutter={[24, 24]}>
                        {testimonials.map((item, idx) => (
                            <Col xs={24} md={8} key={idx}>
                                <Card
                                    bordered={false}
                                    style={{
                                        borderRadius: 20,
                                        boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    <div>
                                        <Rate disabled defaultValue={item.rating} style={{ fontSize: 16, color: "#faad14", marginBottom: 12 }} />
                                        <Paragraph style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, fontStyle: "italic", marginBottom: 20 }}>
                                            "{item.comment}"
                                        </Paragraph>
                                    </div>
                                    <Space size="middle">
                                        <Avatar src={item.avatar} size={44} />
                                        <div>
                                            <Text strong style={{ display: "block", fontSize: 15 }}>{item.name}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{item.role}</Text>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MEMBER / STAFF LOGGED-IN VIEW (KHI ĐÃ ĐĂNG NHẬP)
    // =========================================================================
    return (
        <div style={{ maxWidth: 1200, margin: "20px auto 60px", padding: "0 20px" }}>
            {/* 🌟 HERO BANNER CHO HỘI VIÊN DỰNG TRÊN ẢNH NỀN SALON SANG TRỌNG */}
            <Card
                style={{
                    borderRadius: 28,
                    border: "none",
                    overflow: "hidden",
                    background: isStaffOrOwner 
                        ? "linear-gradient(135deg, rgba(57, 16, 133, 0.9) 0%, rgba(114, 46, 209, 0.85) 100%), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600') center/cover no-repeat" 
                        : "linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(22, 119, 255, 0.8) 50%, rgba(114, 46, 209, 0.82) 100%), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600') center/cover no-repeat",
                    color: "#fff",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
                    marginBottom: 40,
                    padding: "32px 24px"
                }}
            >
                <Row align="middle" gutter={[32, 32]}>
                    <Col xs={24} lg={14}>
                        <Space align="center" style={{ marginBottom: 12 }}>
                            <Avatar 
                                size={72} 
                                icon={<UserOutlined />} 
                                style={{ 
                                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                                    border: "3px solid rgba(255, 255, 255, 0.6)",
                                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
                                }}
                            />
                            <div>
                                <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
                                    Xin chào, {user?.fullName || user?.username || "Thành viên"}! 👋
                                </Title>
                                <Space style={{ marginTop: 6 }}>
                                    <Tag color="gold" style={{ borderRadius: 12, fontWeight: 700, padding: "2px 10px" }}>
                                        <CrownOutlined style={{ marginRight: 4 }} /> HỘI VIÊN SALONFLOW
                                    </Tag>
                                    <TagColor role={user?.roles?.[0]} />
                                </Space>
                            </div>
                        </Space>

                        <Paragraph style={{ color: "rgba(255, 255, 255, 0.92)", fontSize: 16, marginTop: 16, marginBottom: 28, lineHeight: 1.6 }}>
                            Chào mừng bạn quay lại hệ thống **SalonFlow**. Tận hưởng ưu đãi tích điểm 5%, đặt giữ chỗ ưu tiên và trải nghiệm các dịch vụ làm đẹp cao cấp ngay hôm nay!
                        </Paragraph>

                        <Space size="middle" wrap>
                            <Button 
                                type="primary" 
                                size="large" 
                                icon={<ScissorOutlined />} 
                                onClick={() => navigate(isStaffOrOwner ? "/owner" : "/booking")}
                                style={{ 
                                    height: 50, 
                                    padding: "0 28px", 
                                    borderRadius: 25, 
                                    fontSize: 16, 
                                    fontWeight: 700,
                                    backgroundColor: "#ff4d4f",
                                    borderColor: "#ff4d4f",
                                    boxShadow: "0 8px 20px rgba(255, 77, 79, 0.4)"
                                }}
                            >
                                {isStaffOrOwner ? "Vào trang quản trị" : "Đặt lịch hẹn ngay"}
                            </Button>
                            <Button 
                                ghost 
                                size="large" 
                                icon={<UserOutlined />} 
                                onClick={() => navigate("/profile")}
                                style={{ 
                                    height: 50, 
                                    padding: "0 24px", 
                                    borderRadius: 25, 
                                    fontSize: 16, 
                                    color: "#fff", 
                                    borderColor: "rgba(255, 255, 255, 0.8)",
                                    backdropFilter: "blur(4px)"
                                }}
                            >
                                Hồ sơ cá nhân
                            </Button>
                            <Button 
                                type="text" 
                                size="large" 
                                icon={<LogoutOutlined />} 
                                onClick={handleLogout}
                                style={{ color: "rgba(255, 255, 255, 0.8)" }}
                            >
                                Đăng xuất
                            </Button>
                        </Space>
                    </Col>

                    {/* Khối thống kê Glassmorphism nổi bật */}
                    <Col xs={24} lg={10}>
                        <Card
                            style={{
                                background: "rgba(255, 255, 255, 0.16)",
                                backdropFilter: "blur(16px)",
                                borderRadius: 24,
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                padding: "20px 16px",
                                boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)"
                            }}
                        >
                            <Spin spinning={loadingStats}>
                                <Row gutter={[16, 16]}>
                                    <Col span={24}>
                                        <div style={{ background: "rgba(255, 255, 255, 0.15)", padding: "14px 18px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Space>
                                                <StarOutlined style={{ fontSize: 28, color: "#faad14" }} />
                                                <div>
                                                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, display: "block" }}>Điểm thưởng tích lũy</Text>
                                                    <Text strong style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{stats.loyaltyPoints} điểm</Text>
                                                </div>
                                            </Space>
                                            <Button size="small" type="primary" onClick={() => navigate("/profile")} style={{ borderRadius: 12, backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}>
                                                Đổi quà
                                            </Button>
                                        </div>
                                    </Col>

                                    <Col span={12}>
                                        <div style={{ background: "rgba(255, 255, 255, 0.15)", padding: "14px 16px", borderRadius: 16, textAlign: "center" }}>
                                            <ClockCircleOutlined style={{ fontSize: 24, color: "#52c41a", marginBottom: 4 }} />
                                            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, display: "block" }}>Lịch hẹn sắp tới</Text>
                                            <Text strong style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{stats.upcomingBookingsCount} lịch</Text>
                                        </div>
                                    </Col>

                                    <Col span={12}>
                                        <div style={{ background: "rgba(255, 255, 255, 0.15)", padding: "14px 16px", borderRadius: 16, textAlign: "center" }}>
                                            <CalendarOutlined style={{ fontSize: 24, color: "#1890ff", marginBottom: 4 }} />
                                            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, display: "block" }}>Tổng số lượt làm đẹp</Text>
                                            <Text strong style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{stats.totalBookings} lượt</Text>
                                        </div>
                                    </Col>
                                </Row>
                            </Spin>
                        </Card>
                    </Col>
                </Row>
            </Card>

            <Spin spinning={loadingStats}>
                {isStaffOrOwner ? (
                    /* Dashboard Quản Trị Dành Cho Owner/Staff */
                    <div>
                        <Title level={3} style={{ marginBottom: 24 }}>
                            📊 Bảng điều khiển hoạt động kinh doanh
                        </Title>
                        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                            <Col xs={24} sm={12} lg={6}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
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
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
                                    <Statistic 
                                        title="Tổng số lượt đặt lịch" 
                                        value={stats.totalBookings} 
                                        valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                                        prefix={<CalendarOutlined style={{ marginRight: 8, color: "#722ed1" }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
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
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
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
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <SettingOutlined style={{ fontSize: 40, color: "#722ed1", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Trang quản trị (Dashboard)</Title>
                                    <Text type="secondary">Quản lý doanh thu, báo cáo chi tiết</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card 
                                    hoverable 
                                    onClick={() => navigate("/owner/staff")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <TeamOutlined style={{ fontSize: 40, color: "#fa8c16", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Quản lý nhân viên</Title>
                                    <Text type="secondary">Phân ca, trực lịch và thiết lập dịch vụ</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card 
                                    hoverable 
                                    onClick={() => navigate("/owner/services")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <ShoppingOutlined style={{ fontSize: 40, color: "#1890ff", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Quản lý dịch vụ</Title>
                                    <Text type="secondary">Thêm mới dịch vụ, cài đặt giá và combo</Text>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    /* Giao Diện Hội Viên Đầy Đủ Đẹp Như Bên Guest */
                    <div>
                        {/* ✂️ DANH MỤC DỊCH VỤ NỔI BẬT DÀNH CHO HỘI VIÊN */}
                        <div style={{ marginBottom: 48 }}>
                            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                                <Col>
                                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                                        ✂️ Khám Phá Dịch Vụ Làm Đẹp Nổi Bật
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 15 }}>
                                        Dịch vụ chăm sóc sắc đẹp cao cấp thực hiện bởi đội ngũ Stylist tay nghề cao.
                                    </Text>
                                </Col>
                                <Col>
                                    <Button 
                                        type="primary" 
                                        ghost 
                                        shape="round" 
                                        icon={<ArrowRightOutlined />}
                                        onClick={() => navigate("/services")}
                                    >
                                        Xem tất cả dịch vụ
                                    </Button>
                                </Col>
                            </Row>

                            <Row gutter={[24, 24]}>
                                {featuredCategories.map((item, idx) => (
                                    <Col xs={24} sm={12} lg={6} key={idx}>
                                        <Card
                                            hoverable
                                            cover={
                                                <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
                                                    <img
                                                        alt={item.title}
                                                        src={item.image}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.08)"}
                                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                                    />
                                                    <Tag 
                                                        color={item.tagColor} 
                                                        style={{ position: "absolute", top: 12, right: 12, borderRadius: 10, fontWeight: 700, padding: "2px 10px" }}
                                                    >
                                                        {item.tag}
                                                    </Tag>
                                                </div>
                                            }
                                            style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.04)", height: "100%" }}
                                            bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                                        >
                                            <div>
                                                <Title level={4} style={{ margin: "0 0 8px 0", fontSize: 18 }}>
                                                    {item.title}
                                                </Title>
                                                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16, height: 40, overflow: "hidden" }}>
                                                    {item.desc}
                                                </Paragraph>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Text strong style={{ color: "#ff4d4f", fontSize: 16, fontWeight: 700 }}>
                                                    {item.price}
                                                </Text>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    shape="round"
                                                    icon={<ScissorOutlined />}
                                                    onClick={() => navigate("/booking")}
                                                >
                                                    Đặt ngay
                                                </Button>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>

                        {/* 🌟 ĐẶC QUYỀN HỘI VIÊN SALONFLOW */}
                        <Card
                            style={{
                                borderRadius: 24,
                                background: "linear-gradient(135deg, #f8fafc 0%, #e6f7ff 100%)",
                                border: "1px solid #bae7ff",
                                marginBottom: 48,
                                padding: "16px 8px"
                            }}
                        >
                            <Title level={2} style={{ textAlign: "center", marginBottom: 32, fontWeight: 700 }}>
                                🌟 Đặc Quyền Dành Cho Hội Viên SalonFlow
                            </Title>
                            <Row gutter={[24, 24]}>
                                {memberPerks.map((perk, pIdx) => (
                                    <Col xs={24} sm={12} md={6} key={pIdx}>
                                        <Card
                                            bordered={false}
                                            style={{ borderRadius: 20, height: "100%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}
                                        >
                                            <div style={{ marginBottom: 16 }}>{perk.icon}</div>
                                            <Title level={4} style={{ margin: "4px 0 8px" }}>{perk.title}</Title>
                                            <Paragraph type="secondary" style={{ fontSize: 14 }}>
                                                {perk.desc}
                                            </Paragraph>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>

                        {/* 🏬 CHI NHÁNH SALON NỔI BẬT */}
                        {branches.length > 0 && (
                            <div style={{ marginBottom: 48 }}>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                                    <Col>
                                        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                                            🏬 Chi Nhánh Salon Phục Vụ
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: 15 }}>
                                            Không gian hiện đại, trang thiết bị tiên tiến tại các khu vực trung tâm.
                                        </Text>
                                    </Col>
                                    <Col>
                                        <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate("/search")}>
                                            Xem tất cả chi nhánh
                                        </Button>
                                    </Col>
                                </Row>
                                <Row gutter={[24, 24]}>
                                    {branches.slice(0, 3).map((branch, i) => (
                                        <Col xs={24} sm={12} md={8} key={branch.id}>
                                            <Card
                                                hoverable
                                                onClick={() => navigate("/booking")}
                                                cover={
                                                    <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                                                        <img
                                                            alt={branch.name}
                                                            src={i === 0 
                                                                ? "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=800" 
                                                                : i === 1 
                                                                ? "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800"
                                                                : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800"
                                                            }
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                        <Tag color="gold" style={{ position: "absolute", top: 12, left: 12, borderRadius: 10, fontWeight: 700 }}>
                                                            ⭐ 4.9/5
                                                        </Tag>
                                                    </div>
                                                }
                                                style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.04)" }}
                                            >
                                                <Title level={4} style={{ marginTop: 0, marginBottom: 8, color: "#1677ff" }}>
                                                    {branch.name}
                                                </Title>
                                                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
                                                    <EnvironmentOutlined style={{ marginRight: 6, color: "#ff4d4f" }} />
                                                    {branch.address || "Chi nhánh chính thức SalonFlow"}
                                                </Paragraph>
                                                <Button type="primary" ghost block shape="round" icon={<ScissorOutlined />}>
                                                    Đặt lịch tại chi nhánh này
                                                </Button>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}

                        {/* ⭐ ĐÁNH GIÁ TỪ KHÁCH HÀNG THỰC TẾ */}
                        <div style={{ marginBottom: 40 }}>
                            <Title level={2} style={{ textAlign: "center", marginBottom: 32, fontWeight: 700 }}>
                                ⭐ Đánh Giá Từ Khách Hàng Thân Thiết
                            </Title>
                            <Row gutter={[24, 24]}>
                                {testimonials.map((item, idx) => (
                                    <Col xs={24} md={8} key={idx}>
                                        <Card
                                            bordered={false}
                                            style={{
                                                borderRadius: 20,
                                                boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                                                height: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between"
                                            }}
                                        >
                                            <div>
                                                <Rate disabled defaultValue={item.rating} style={{ fontSize: 16, color: "#faad14", marginBottom: 12 }} />
                                                <Paragraph style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, fontStyle: "italic", marginBottom: 20 }}>
                                                    "{item.comment}"
                                                </Paragraph>
                                            </div>
                                            <Space size="middle">
                                                <Avatar src={item.avatar} size={44} />
                                                <div>
                                                    <Text strong style={{ display: "block", fontSize: 15 }}>{item.name}</Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{item.role}</Text>
                                                </div>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
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