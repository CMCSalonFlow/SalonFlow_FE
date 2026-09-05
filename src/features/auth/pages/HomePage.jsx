import { useEffect, useState, useRef } from "react";
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
    Skeleton,
    Statistic,
    Badge,
    Tag,
    Rate
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
    LoginOutlined,
    UserAddOutlined,
    ShopOutlined,
    ThunderboltOutlined,
    SafetyCertificateOutlined,
    EnvironmentOutlined,
    CrownOutlined,
    UnorderedListOutlined,
    FileTextOutlined,
    ScissorOutlined,
    SearchOutlined,
    LeftOutlined,
    RightOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";
import api from "@/core/api/axios";
import ROLES from "@/core/constants/roles";
import AiServiceRecommendationWidget from "@/features/recommendation/components/AiServiceRecommendationWidget";
import SalonCard from "@/features/salon/components/SalonCard";

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("auth") || "null"));
    const [publicSalons, setPublicSalons] = useState([]);
    const salonScrollRef = useRef(null);

    const scrollSalonsLeft = () => {
        if (salonScrollRef.current) {
            salonScrollRef.current.scrollBy({ left: -340, behavior: "smooth" });
        }
    };

    const scrollSalonsRight = () => {
        if (salonScrollRef.current) {
            salonScrollRef.current.scrollBy({ left: 340, behavior: "smooth" });
        }
    };
    const [loadingSalons, setLoadingSalons] = useState(true);
    const [loadingBranches, setLoadingBranches] = useState(true);
    // Dữ liệu đánh giá từ khách hàng (Mặc định dùng mock data nếu chưa tải được từ API)
    const [testimonials, setTestimonials] = useState([
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
    ]);
    const cachedStats = sessionStorage.getItem("homepage_stats");
    const [loadingStats, setLoadingStats] = useState(!cachedStats);
    const [branches, setBranches] = useState([]);
    const [stats, setStats] = useState(
        cachedStats
            ? JSON.parse(cachedStats)
            : {
                loyaltyPoints: 0,
                upcomingBookingsCount: 0,
                totalBookings: 0,
                revenue: 0,
                staffCount: 8
            }
    );

    const { logout } = useAuth();
    const token = localStorage.getItem("accessToken");
    const isLogin = !!token;

    useEffect(() => {
        // Tải danh sách Thương hiệu Salon công khai (Chỉ các Salon đã được duyệt - APPROVED)
        api.get("/api/v1/salons/public")
            .then((res) => {
                const approvedSalons = (res.data || []).filter(s => !s.status || s.status === "APPROVED");
                setPublicSalons(approvedSalons);
            })
            .catch(() => setPublicSalons([]))
            .finally(() => setLoadingSalons(false));

        if (isLogin) {
            const rolesStr = localStorage.getItem("roles");
            if (rolesStr) {
                const roles = JSON.parse(rolesStr).map(r => String(r).toUpperCase());
                if (roles.includes(ROLES.SUPER_ADMIN) || roles.includes(ROLES.ADMIN)) {
                    navigate("/admin", { replace: true });
                    return;
                }
                if (roles.includes(ROLES.SALON_OWNER)) {
                    navigate("/owner", { replace: true });
                    return;
                }
                if (roles.includes(ROLES.MANAGER) || roles.includes(ROLES.BRANCH_MANAGER)) {
                    navigate("/manager/walk-in", { replace: true });
                    return;
                }
                if (roles.includes(ROLES.STAFF)) {
                    navigate("/staff/schedule", { replace: true });
                    return;
                }
            }
        }

        const loadRealReviews = (salonId) => {
            api.get(`/api/v1/salons/${salonId}/reviews`, { params: { rating: 5, size: 6 } })
                .then((res) => {
                    const content = res.data?.content || res.data || [];
                    if (content.length > 0) {
                        const mapped = content.map((r) => ({
                            name: r.customerName || "Khách hàng",
                            role: r.branchName ? `Khách tại ${r.branchName}` : "Khách hàng thân thiết",
                            rating: r.rating || 5,
                            comment: r.comment || "Dịch vụ rất tốt và chuyên nghiệp!",
                            avatar: r.customerAvatar || ""
                        }));
                        setTestimonials(mapped);
                    }
                })
                .catch(() => {
                    // Tránh log lỗi rác console khi Salon chưa có bài đánh giá thực tế
                });
        };

        if (!isLogin) {
            // Tải danh sách chi nhánh công khai nếu chưa đăng nhập
            api.get("/api/v1/branches")
                .then((res) => {
                    const bList = res.data || [];
                    setBranches(bList);
                    if (bList.length > 0 && bList[0].salonId) {
                        loadRealReviews(bList[0].salonId);
                    }
                })
                .catch(() => {
                    setBranches([]);
                })
                .finally(() => {
                    setLoadingBranches(false);
                });
            return;
        }

        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
        const rawUserId = localStorage.getItem("userId");
        const currentUserId = rawUserId || auth?.id || JSON.parse(localStorage.getItem("user") || "{}")?.id;


        let isMounted = true;



        const isInternalUser = auth?.roles?.some((role) =>
            [ROLES.SUPER_ADMIN, ROLES.SALON_OWNER, ROLES.MANAGER, ROLES.BRANCH_MANAGER, ROLES.STAFF].includes(role.toUpperCase())
        );

        // ĐỒNG THỜI khởi tạo tất cả các yêu cầu API (Parallel Requests - loại bỏ Waterfall delay)
        const pUserInfo = currentUserId
            ? api.get(`/api/v1/users/${currentUserId}`).then((res) => res.data).catch(() => null)
            : Promise.resolve(null);

        const pLoyalty = api.get("/api/v1/loyalty/summary").then((res) => res.data).catch(() => null);

        const pBranches = api
            .get("/api/v1/branches/my-branches")
            .then((res) => res.data || [])
            .catch(() =>
                api.get("/api/v1/branches").then((res) => res.data || []).catch(() => [])
            );

        const pMyBookings = api
            .get("/api/v1/bookings/my-bookings")
            .then((res) => res.data || [])
            .catch(() => []);

        Promise.all([pUserInfo, pLoyalty, pBranches, pMyBookings]).then(([userData, loyaltyData, branchesData, myBookings]) => {
            if (!isMounted) return;

            if (userData) {
                setUser((prev) => ({ ...prev, ...userData }));
                if (userData.fullName) {
                    localStorage.setItem("fullName", userData.fullName);
                }
            }

            let upcoming = 0;
            let total = 0;
            let totalRevenue = 0;

            if (branchesData && branchesData.length > 0) {
                setBranches(branchesData);
                if (branchesData[0].salonId) {
                    loadRealReviews(branchesData[0].salonId);
                }
            }

            const validMyBookings = Array.isArray(myBookings) ? myBookings : [];
            upcoming = validMyBookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED").length;
            total = validMyBookings.length;

            const userPoints = loyaltyData?.totalPoints ?? loyaltyData?.pointsBalance ?? 0;

            const newStats = {
                loyaltyPoints: userPoints,
                upcomingBookingsCount: upcoming,
                totalBookings: total,
                revenue: totalRevenue,
                staffCount: 8
            };

            setStats(newStats);
            sessionStorage.setItem("homepage_stats", JSON.stringify(newStats));
            setLoadingStats(false);
        });

        return () => {
            isMounted = false;
        };
    }, [isLogin]);

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const userRoles = (user?.roles || []).map(role => String(role).toUpperCase());
    const isOwnerOrAdmin = userRoles.some(r => [ROLES.SUPER_ADMIN, ROLES.SALON_OWNER].includes(r));
    const isManager = userRoles.some(r => [ROLES.MANAGER, ROLES.BRANCH_MANAGER].includes(r));
    const isStaffRole = userRoles.includes(ROLES.STAFF);
    const isInternalUser = isOwnerOrAdmin || isManager || isStaffRole;

    const mainActionRoute = isOwnerOrAdmin ? "/owner" : isManager ? "/manager/walk-in" : isStaffRole ? "/staff/schedule" : "/booking";
    const mainActionText = isOwnerOrAdmin ? "Vào trang quản trị" : isManager ? "Vào trang Lễ Tân / POS" : isStaffRole ? "Xem lịch làm việc" : "Đặt lịch hẹn ngay";

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
            title: "Phục Hồi & Dưỡng Tóc VIP",
            desc: "Phục hồi cấu trúc tóc hư tổn, liệu trình dưỡng ẩm mượt sâu.",
            price: "Từ 250.000đ",
            tag: "YÊU THÍCH",
            tagColor: "pink",
            image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=80&w=800"
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
                    className="home-hero-card"
                    styles={{ body: { padding: "36px 32px" } }}
                >
                    <Row align="stretch" gutter={[36, 36]}>
                        <Col xs={24} lg={14} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <Title level={1} style={{ color: "#fff", margin: 0, fontSize: 38, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                                    SalonFlow - Nâng Tầm Trải Nghiệm Làm Đẹp
                                </Title>
                                <Paragraph style={{ color: "rgba(255, 255, 255, 0.92)", fontSize: 16, marginTop: 16, marginBottom: 28, lineHeight: 1.7 }}>
                                    Đặt lịch cắt tóc, tạo kiểu, uốn nhuộm thời trang và gội đầu dưỡng sinh chuyên nghiệp nhanh chóng trong 30 giây mà không cần đăng ký tài khoản. Đảm bảo giữ chỗ 100%!
                                </Paragraph>

                                <Space size="large" wrap>
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<CalendarOutlined />}
                                        onClick={() => navigate("/guest-booking")}
                                        style={{
                                            height: 52,
                                            padding: "0 32px",
                                            borderRadius: 26,
                                            fontSize: 16,
                                            fontWeight: 700,
                                            backgroundColor: "#4f46e5",
                                            borderColor: "#4f46e5",
                                            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.45)"
                                        }}
                                    >
                                        Đặt lịch vãng lai ngay
                                    </Button>
                                    <Button
                                        ghost
                                        size="large"
                                        icon={<SearchOutlined />}
                                        onClick={() => navigate("/search")}
                                        style={{
                                            height: 52,
                                            padding: "0 28px",
                                            borderRadius: 26,
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "#fff",
                                            borderColor: "rgba(255, 255, 255, 0.8)",
                                            backdropFilter: "blur(4px)"
                                        }}
                                    >
                                        Khám phá & Tìm Salon
                                    </Button>
                                </Space>
                            </div>

                            {/* 🌟 ĐƯỜNG GẠCH NGANG NHẸ TẠO SỰ CÂN BẰNG */}
                            <Divider style={{ borderColor: "rgba(255,255,255,0.18)", margin: "24px 0 16px" }} />

                            {/* 🌟 3 MỤC CAM KẾT XẾP TỰ NHIÊN DỄ NHÌN */}
                            <Space size={56} wrap>
                                <Space style={{ color: "rgba(255,255,255,0.92)" }}>
                                    <ThunderboltOutlined style={{ color: "#4ade80", fontSize: 16 }} />
                                    <Text style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Đặt lịch 30s</Text>
                                </Space>
                                <Space style={{ color: "rgba(255,255,255,0.92)" }}>
                                    <SafetyCertificateOutlined style={{ color: "#60a5fa", fontSize: 16 }} />
                                    <Text style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Giữ chỗ 100%</Text>
                                </Space>
                                <Space style={{ color: "rgba(255,255,255,0.92)" }}>
                                    <CheckCircleOutlined style={{ color: "#facc15", fontSize: 16 }} />
                                    <Text style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Xác nhận tức thì</Text>
                                </Space>
                            </Space>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card
                                className="home-glass-card"
                                bodyStyle={{ padding: "26px 22px", textAlign: "center" }}
                                style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}
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
                        Quy Trình Đặt Lịch Trong Vòng 3 Bước
                    </Title>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} md={8}>
                            <Card
                                bordered={false}
                                style={{ borderRadius: 20, height: "100%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}
                            >
                                <div style={{ height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                                    <img
                                        src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=500"
                                        alt="Chọn Salon & Dịch Vụ"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <Title level={4} style={{ margin: "12px 0 8px" }}>Bước 1: Chọn Salon & Dịch Vụ</Title>
                                <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                                    Dễ dàng tìm kiếm salon làm đẹp uy tín, tham khảo danh mục dịch vụ đa dạng và chọn combo chăm sóc tóc phù hợp nhất.
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
                                        src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=500"
                                        alt="Chọn Stylist & Giờ Cắt"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <Title level={4} style={{ margin: "12px 0 8px" }}>Bước 2: Chọn Stylist & Giờ Cắt</Title>
                                <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                                    Chủ động lựa chọn thợ làm tóc yêu thích, xem đánh giá tay nghề và chọn khung giờ trống tiện lợi với bạn.
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
                                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500"
                                        alt="Điền Thông Tin Liên Hệ"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <Title level={4} style={{ margin: "12px 0 8px" }}>Bước 3: Điền Thông Tin Liên Hệ</Title>
                                <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                                    Chỉ cần nhập tên và số điện thoại để hoàn tất giữ chỗ tức thì mà không bắt buộc phải đăng ký tài khoản.
                                </Paragraph>
                            </Card>
                        </Col>
                    </Row>
                </Card>

                {/* 🏬 THƯƠNG HIỆU SALON NỔI BẬT (CAROUSEL SLIDER VỚI MŨI TÊN 2 BÊN) */}
                {(loadingSalons || publicSalons.length > 0) && (
                    <div style={{ marginBottom: 48, position: "relative" }}>
                        <div style={{ marginBottom: 20 }}>
                            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                                Thương Hiệu Salon Nổi Bật Trên SalonFlow
                            </Title>
                            <Text type="secondary" style={{ fontSize: 15 }}>
                                Khám phá & chọn các thương hiệu Salon làm đẹp chất lượng cao đăng ký trên hệ thống.
                            </Text>
                        </div>

                        <div style={{ position: "relative" }}>
                            {/* Mũi tên trượt BÊN TRÁI (Chỉ hiển thị khi có TRÊN 4 Salon) */}
                            {!loadingSalons && publicSalons.length > 4 && (
                                <Button
                                    shape="circle"
                                    size="large"
                                    icon={<LeftOutlined />}
                                    onClick={scrollSalonsLeft}
                                    style={{
                                        position: "absolute",
                                        left: -20,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        zIndex: 10,
                                        boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                                        backgroundColor: "#fff",
                                        borderColor: "#e2e8f0"
                                    }}
                                />
                            )}

                            {/* Mũi tên trượt BÊN PHẢI (Chỉ hiển thị khi có TRÊN 4 Salon) */}
                            {!loadingSalons && publicSalons.length > 4 && (
                                <Button
                                    shape="circle"
                                    size="large"
                                    icon={<RightOutlined />}
                                    onClick={scrollSalonsRight}
                                    style={{
                                        position: "absolute",
                                        right: -20,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        zIndex: 10,
                                        boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                                        backgroundColor: "#fff",
                                        borderColor: "#e2e8f0"
                                    }}
                                />
                            )}

                            {/* Thanh trượt Carousel ngang mượt mà */}
                            <div
                                ref={salonScrollRef}
                                style={{
                                    display: "flex",
                                    gap: 24,
                                    overflowX: "auto",
                                    scrollBehavior: "smooth",
                                    padding: "8px 4px 20px",
                                    msOverflowStyle: "none"
                                }}
                            >
                                {loadingSalons
                                    ? [1, 2, 3, 4].map((idx) => (
                                        <div key={idx} style={{ flex: "0 0 calc(25% - 18px)", minWidth: 260, maxWidth: 300 }}>
                                            <Card style={{ borderRadius: 20, height: 320, padding: 12 }}>
                                                <Skeleton active avatar={{ shape: "square", size: 140 }} paragraph={{ rows: 3 }} />
                                            </Card>
                                        </div>
                                    ))
                                    : publicSalons.map((salon) => (
                                        <div key={salon.id} style={{ flex: "0 0 calc(25% - 18px)", minWidth: 260, maxWidth: 300 }}>
                                            <SalonCard salon={salon} />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 🏬 CHI NHÁNH SALON NỔI BẬT */}
                {(loadingBranches || branches.length > 0) && (
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
                            {loadingBranches
                                ? [1, 2, 3].map((idx) => (
                                    <Col xs={24} sm={12} md={8} key={idx}>
                                        <Card style={{ borderRadius: 20, height: 300, padding: 12 }}>
                                            <Skeleton active avatar={{ shape: "square", size: 140 }} paragraph={{ rows: 3 }} />
                                        </Card>
                                    </Col>
                                ))
                                : branches.slice(0, 3).map((branch, i) => (
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
                                            <Button type="primary" ghost block shape="round" icon={<CalendarOutlined />}>
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
        <div style={{ maxWidth: 1200, margin: "20px auto 60px", padding: "0 20px" }}>
            {/* 🌟 HERO BANNER CHO HỘI VIÊN DỰNG TRÊN ẢNH NỀN SALON SANG TRỌNG */}
            <Card
                className="home-member-card"
                style={{
                    borderRadius: 28,
                    border: "none",
                    overflow: "hidden",
                    background: isInternalUser
                        ? "linear-gradient(135deg, rgba(57, 16, 133, 0.9) 0%, rgba(114, 46, 209, 0.85) 100%), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600') center/cover no-repeat"
                        : "linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(22, 119, 255, 0.8) 50%, rgba(114, 46, 209, 0.82) 100%), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600') center/cover no-repeat",
                    color: "#fff",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
                    marginBottom: 40
                }}
            >
                <Row align="middle" gutter={[32, 32]}>
                    <Col xs={24} lg={14}>
                        <Title level={1} style={{ color: "#fff", margin: 0, fontSize: 36, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                            👋 Xin chào, {user?.fullName || localStorage.getItem("fullName") || user?.username || "Thành viên"}!
                        </Title>

                        <Paragraph style={{ color: "rgba(255, 255, 255, 0.92)", fontSize: 16, marginTop: 14, marginBottom: 28, lineHeight: 1.7 }}>
                            Chào mừng bạn quay trở lại với SalonFlow. Khám phá ngay các Salon làm đẹp uy tín, theo dõi lịch hẹn và trải nghiệm đặt chỗ giữ suất nhanh chóng chỉ trong 30 giây!
                        </Paragraph>

                        <div className="hero-member-buttons">
                            <Button
                                type="primary"
                                size="large"
                                icon={<CalendarOutlined />}
                                onClick={() => navigate(mainActionRoute)}
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
                                {mainActionText}
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                icon={<ScissorOutlined />}
                                onClick={() => navigate("/hair-ai")}
                                style={{
                                    height: 50,
                                    padding: "0 28px",
                                    borderRadius: 25,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                                    border: "none",
                                    boxShadow: "0 8px 20px rgba(99, 102, 241, 0.4)"
                                }}
                            >
                                Thử tóc AI
                            </Button>
                            <Button
                                type="text"
                                size="large"
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                style={{ color: "rgba(255, 255, 255, 0.8)", display: "flex", alignItems: "center" }}
                            >
                                Đăng xuất
                            </Button>
                        </div>
                    </Col>

                    {/* Khối thống kê Glassmorphism nổi bật */}
                    <Col xs={24} lg={10}>
                        <Card
                            className="hero-loyalty-card"
                            style={{
                                background: "rgba(255, 255, 255, 0.16)",
                                backdropFilter: "blur(16px)",
                                borderRadius: 24,
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)"
                            }}
                        >
                            <Spin spinning={loadingStats}>
                                <Row gutter={[16, 16]}>
                                    <Col span={24}>
                                        <div className="hero-loyalty-banner">
                                            <Space align="center" size="middle">
                                                <StarOutlined style={{ fontSize: 28, color: "#faad14" }} />
                                                <div>
                                                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, display: "block" }}>Điểm thưởng tích lũy</Text>
                                                    <Text strong style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>{stats.loyaltyPoints} điểm</Text>
                                                </div>
                                            </Space>
                                            <Button size="small" type="primary" onClick={() => navigate("/profile")} style={{ borderRadius: 12, backgroundColor: "#fa8c16", borderColor: "#fa8c16", fontWeight: 600 }}>
                                                Đổi quà
                                            </Button>
                                        </div>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <div style={{ background: "rgba(255, 255, 255, 0.15)", padding: "14px 16px", borderRadius: 16, textAlign: "center", height: "100%" }}>
                                            <ClockCircleOutlined style={{ fontSize: 24, color: "#52c41a", marginBottom: 4 }} />
                                            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, display: "block" }}>Lịch hẹn sắp tới</Text>
                                            <Text strong style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{stats.upcomingBookingsCount} lịch</Text>
                                        </div>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <div style={{ background: "rgba(255, 255, 255, 0.15)", padding: "14px 16px", borderRadius: 16, textAlign: "center", height: "100%" }}>
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
                {isOwnerOrAdmin ? (
                    /* Dashboard Quản Trị Dành Cho Owner / Super Admin */
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
                ) : isManager ? (
                    /* Dashboard & Phím Tắt Dành Cho Lễ Tân / Quản Lý (Manager) */
                    <div>
                        <Title level={3} style={{ marginBottom: 24 }}>
                            📊 Bảng điều khiển Lễ Tân & Quản Lý Salon
                        </Title>
                        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                            <Col xs={24} sm={12} lg={8}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
                                    <Statistic
                                        title="Tổng số lượt đặt lịch"
                                        value={stats.totalBookings}
                                        valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                                        prefix={<CalendarOutlined style={{ marginRight: 8, color: "#722ed1" }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
                                    <Statistic
                                        title="Lịch hẹn mới hôm nay"
                                        value={stats.upcomingBookingsCount}
                                        valueStyle={{ color: "#1890ff", fontWeight: 700 }}
                                        prefix={<ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
                                    <Statistic
                                        title="Nhân sự chi nhánh"
                                        value={stats.staffCount}
                                        valueStyle={{ color: "#fa8c16", fontWeight: 700 }}
                                        prefix={<TeamOutlined style={{ marginRight: 8, color: "#fa8c16" }} />}
                                        suffix="thợ"
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Title level={4} style={{ marginBottom: 16 }}>⚡ Phím tắt Thao tác nhanh (Lễ Tân / Manager)</Title>
                        <Row gutter={[20, 20]}>
                            <Col xs={24} sm={12} md={6}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/manager/walk-in")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <ShopOutlined style={{ fontSize: 40, color: "#722ed1", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Quản lý Khách Vãng Lai / POS</Title>
                                    <Text type="secondary">Check-in khách lẻ, tạo đơn thu ngân</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/manager/bookings")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <CalendarOutlined style={{ fontSize: 40, color: "#1890ff", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Quản Lý Lịch Hẹn</Title>
                                    <Text type="secondary">Điều phối lịch & kiểm tra trạng thái</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/manager/leave-requests")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <FileTextOutlined style={{ fontSize: 40, color: "#fa8c16", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Duyệt Đơn Nghỉ Phép</Title>
                                    <Text type="secondary">Phê duyệt đơn xin nghỉ từ nhân viên</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/manager/off-days")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <SettingOutlined style={{ fontSize: 40, color: "#52c41a", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Ngày Nghỉ Salon</Title>
                                    <Text type="secondary">Cấu hình đóng cửa chi nhánh & ngày lễ</Text>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : isStaffRole ? (
                    /* Dashboard & Phím Tắt Dành Cho Nhân Viên / Thợ (Staff) */
                    <div>
                        <Title level={3} style={{ marginBottom: 24 }}>
                            📊 Bảng điều khiển Nhân Viên
                        </Title>
                        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                            <Col xs={24} sm={12} lg={12}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
                                    <Statistic
                                        title="Lịch hẹn sắp tới của bạn"
                                        value={stats.upcomingBookingsCount}
                                        valueStyle={{ color: "#1890ff", fontWeight: 700 }}
                                        prefix={<ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} lg={12}>
                                <Card bordered={false} style={{ borderRadius: 20, boxShadow: "0 6px 24px rgba(0,0,0,0.03)" }}>
                                    <Statistic
                                        title="Tổng số lượt làm đẹp đã phục vụ"
                                        value={stats.totalBookings}
                                        valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                                        prefix={<CalendarOutlined style={{ marginRight: 8, color: "#722ed1" }} />}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Title level={4} style={{ marginBottom: 16 }}>⚡ Phím tắt Thao tác nhanh (Nhân viên)</Title>
                        <Row gutter={[20, 20]}>
                            <Col xs={24} sm={12} md={8}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/staff/schedule")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <CalendarOutlined style={{ fontSize: 40, color: "#1890ff", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Lịch Làm Việc Cá Nhân</Title>
                                    <Text type="secondary">Xem lịch trực và ca làm việc</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/staff/appointments")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <UnorderedListOutlined style={{ fontSize: 40, color: "#722ed1", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Danh Sách Khách Sắp Tới</Title>
                                    <Text type="secondary">Theo dõi khách hàng đã hẹn với bạn</Text>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Card
                                    hoverable
                                    onClick={() => navigate("/staff/leave-requests")}
                                    style={{ borderRadius: 20, textAlign: "center", padding: "16px 0" }}
                                >
                                    <FileTextOutlined style={{ fontSize: 40, color: "#fa8c16", marginBottom: 12 }} />
                                    <Title level={5} style={{ margin: 0 }}>Xin Nghỉ Phép Cá Nhân</Title>
                                    <Text type="secondary">Tạo đơn xin nghỉ phép gửi Quản lý</Text>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    /* Giao Diện Hội Viên Đầy ĐỦ Đẹp Như Bên Guest */
                    <div>
                        {/* 🚀 QUY TRÌNH 3 BƯỚC ĐẶT LỊCH */}
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
                                Quy Trình Đặt Lịch Trong Vòng 3 Bước
                            </Title>
                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={8}>
                                    <Card
                                        bordered={false}
                                        style={{ borderRadius: 20, height: "100%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" }}
                                    >
                                        <div style={{ height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                                            <img
                                                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=500"
                                                alt="Chọn Salon & Dịch Vụ"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>
                                        <Title level={4} style={{ margin: "12px 0 8px" }}>Bước 1: Chọn Salon & Dịch Vụ</Title>
                                        <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                                            Dễ dàng tìm kiếm salon làm đẹp uy tín, tham khảo danh mục dịch vụ đa dạng và chọn combo chăm sóc tóc phù hợp nhất.
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
                                                src="https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=500"
                                                alt="Chọn Stylist & Giờ Cắt"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>
                                        <Title level={4} style={{ margin: "12px 0 8px" }}>Bước 2: Chọn Stylist & Giờ Cắt</Title>
                                        <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                                            Chủ động lựa chọn thợ làm tóc yêu thích, xem đánh giá tay nghề và chọn khung giờ trống tiện lợi với bạn.
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
                                                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=500"
                                                alt="Điền Thông Tin Liên Hệ"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>
                                        <Title level={4} style={{ margin: "12px 0 8px" }}>Bước 3: Điền Thông Tin Liên Hệ</Title>
                                        <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                                            Chỉ cần nhập tên và số điện thoại để hoàn tất giữ chỗ tức thì mà không bắt buộc phải đăng ký tài khoản.
                                        </Paragraph>
                                    </Card>
                                </Col>
                            </Row>
                        </Card>

                        {/* 🌟 HỆ THỐNG SALON VÀ THƯƠNG HIỆU */}
                        {(loadingSalons || publicSalons.length > 0) && (
                            <div style={{ marginBottom: 40 }}>
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                                        🌟 Hệ Thống Salon & Thương Hiệu Nổi Bật
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 15 }}>
                                        Khám phá & chọn các thương hiệu Salon làm đẹp chất lượng cao đăng ký trên hệ thống.
                                    </Text>
                                </div>

                                <div style={{ position: "relative" }}>
                                    {/* Mũi tên trượt BÊN TRÁI (Chỉ hiển thị khi có TRÊN 4 Salon) */}
                                    {!loadingSalons && publicSalons.length > 4 && (
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={<LeftOutlined />}
                                            onClick={scrollSalonsLeft}
                                            style={{
                                                position: "absolute",
                                                left: -20,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                zIndex: 10,
                                                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                                                backgroundColor: "#fff",
                                                borderColor: "#e2e8f0"
                                            }}
                                        />
                                    )}

                                    {/* Mũi tên trượt BÊN PHẢI (Chỉ hiển thị khi có TRÊN 4 Salon) */}
                                    {!loadingSalons && publicSalons.length > 4 && (
                                        <Button
                                            shape="circle"
                                            size="large"
                                            icon={<RightOutlined />}
                                            onClick={scrollSalonsRight}
                                            style={{
                                                position: "absolute",
                                                right: -20,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                zIndex: 10,
                                                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                                                backgroundColor: "#fff",
                                                borderColor: "#e2e8f0"
                                            }}
                                        />
                                    )}

                                    {/* Thanh trượt Carousel ngang mượt mà */}
                                    <div
                                        ref={salonScrollRef}
                                        style={{
                                            display: "flex",
                                            gap: 24,
                                            overflowX: "auto",
                                            scrollBehavior: "smooth",
                                            padding: "8px 4px 20px",
                                            msOverflowStyle: "none"
                                        }}
                                    >
                                        {loadingSalons
                                            ? [1, 2, 3, 4].map((idx) => (
                                                <div key={idx} style={{ flex: "0 0 calc(25% - 18px)", minWidth: 260, maxWidth: 300 }}>
                                                    <Card style={{ borderRadius: 20, height: 320, padding: 12 }}>
                                                        <Skeleton active avatar={{ shape: "square", size: 140 }} paragraph={{ rows: 3 }} />
                                                    </Card>
                                                </div>
                                            ))
                                            : publicSalons.map((salon) => (
                                                <div key={salon.id} style={{ flex: "0 0 calc(25% - 18px)", minWidth: 260, maxWidth: 300 }}>
                                                    <SalonCard salon={salon} />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Spin>
        </div>
    );
}

function TagColor({ role }) {
    if (!role) return <Badge status="default" text="GUEST" />;

    const cleanRole = role.startsWith("ROLE_") ? role.substring(5) : role;

    let color = "blue";
    if (cleanRole === "OWNER" || cleanRole === "SALON_OWNER") color = "purple";
    if (cleanRole === "ADMIN" || cleanRole === "SUPER_ADMIN") color = "red";
    if (cleanRole === "STAFF" || cleanRole === "MANAGER" || cleanRole === "BRANCH_MANAGER") color = "orange";

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
            {cleanRole.toUpperCase()}
        </span>
    );
}