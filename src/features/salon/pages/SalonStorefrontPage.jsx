import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    Typography,
    Row,
    Col,
    Button,
    Tag,
    Tabs,
    Space,
    Divider,
    Rate,
    Spin,
    Avatar,
    Image,
    Empty,
    Breadcrumb,
    Badge,
    Tooltip,
    Skeleton
} from "antd";
import {
    ShopOutlined,
    PhoneOutlined,
    MailOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    StarOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    TeamOutlined,
    ScissorOutlined,
    PictureOutlined,
    ArrowLeftOutlined,
    RightOutlined,
    DollarOutlined,
    UserOutlined
} from "@ant-design/icons";
import api from "@/core/api/axios";
import { isAuthenticated } from "@/core/utils/auth";

const { Title, Text, Paragraph } = Typography;

export default function SalonStorefrontPage() {
    const { salonId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [salon, setSalon] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [staffList, setStaffList] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Tải dữ liệu Dịch vụ & Nhân viên theo Chi nhánh
    const loadBranchData = (bId) => {
        setLoadingServices(true);
        const pServices = api.get(`/api/v1/branches/${bId}/services/public`).then(r => r.data || []).catch(() => []);
        const pStaff = api.get(`/api/v1/branches/${bId}/staff/public`).then(r => r.data || []).catch(() => []);

        Promise.all([pServices, pStaff])
            .then(([servList, stfList]) => {
                setServices(servList);
                setStaffList(stfList);
            })
            .finally(() => setLoadingServices(false));
    };

    // Tải dữ liệu song song cực nhanh ngay khi Mount
    useEffect(() => {
        if (!salonId) return;

        setLoading(true);
        setLoadingServices(true);

        // 1. Lấy thông tin Salon
        api.get(`/api/v1/salons/${salonId}`)
            .then(res => setSalon(res.data))
            .catch(() => setSalon(null))
            .finally(() => setLoading(false));

        // 2. Lấy Đánh giá Salon
        api.get(`/api/v1/salons/${salonId}/reviews`, { params: { size: 10 } })
            .then(res => setReviews(res.data?.content || res.data || []))
            .catch(() => setReviews([]));

        // 3. Lấy Danh sách Chi nhánh và nạp luôn Dịch vụ chi nhánh 1
        api.get("/api/v1/branches/public", { params: { salonId } })
            .then(res => {
                const branchData = res.data || [];
                setBranches(branchData);
                if (branchData.length > 0) {
                    const firstBranchId = branchData[0].id;
                    setSelectedBranchId(firstBranchId);
                    loadBranchData(firstBranchId);
                } else {
                    setLoadingServices(false);
                }
            })
            .catch(() => {
                setBranches([]);
                setLoadingServices(false);
            });
    }, [salonId]);

    // Xử lý khi chuyển đổi chi nhánh thủ công
    const handleBranchChange = (bId) => {
        setSelectedBranchId(bId);
        loadBranchData(bId);
    };

    // Chuyển hướng sang trang đặt lịch kèm tham số đã chọn sẵn (Branch, Service)
    const handleBookingRedirect = ({ branchId, serviceId } = {}) => {
        const isLogin = isAuthenticated();
        const baseUrl = isLogin ? "/booking" : "/guest-booking";
        const params = new URLSearchParams();
        if (salon?.id) params.append("salonId", salon.id);
        if (branchId) params.append("branchId", branchId);
        if (serviceId) params.append("serviceId", serviceId);

        navigate(`${baseUrl}?${params.toString()}`);
    };

    if (!loading && !salon) {
        return (
            <div style={{ maxWidth: 800, margin: "60px auto", textAlign: "center", padding: "0 20px" }}>
                <Empty description="Không tìm thấy thông tin thương hiệu Salon này" />
                <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate("/")} style={{ marginTop: 20 }}>
                    Quay lại trang chủ
                </Button>
            </div>
        );
    }

    // Xác định ảnh Cover & Logo
    const primaryPhoto = salon?.photos?.find(p => p.isPrimary || p.primary)?.url || salon?.photos?.[0]?.url;
    const coverUrl = primaryPhoto || salon?.logoUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600";

    // Nhóm dịch vụ theo Danh mục và sắp xếp theo displayOrder của Category
    const categoriesMap = new Map();

    services.forEach(serv => {
        const catId = serv.categoryId || 999;
        const catName = serv.categoryName || serv.category?.name || "Dịch vụ phổ biến";
        const displayOrder = serv.categoryDisplayOrder ?? serv.category?.displayOrder ?? catId;

        if (!categoriesMap.has(catId)) {
            categoriesMap.set(catId, {
                id: catId,
                name: catName,
                displayOrder: displayOrder,
                services: []
            });
        }
        categoriesMap.get(catId).services.push(serv);
    });

    const sortedCategoryGroups = Array.from(categoriesMap.values()).sort(
        (a, b) => (a.displayOrder ?? a.id) - (b.displayOrder ?? b.id)
    );

    return (
        <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: 60 }}>
            {/* 🌟 HERO COVER BANNER TOÀN KHỔ */}
            <div style={{ position: "relative", backgroundColor: "#0f172a", overflow: "hidden" }}>
                <div
                    style={{
                        height: 320,
                        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.45) 0%, rgba(15, 23, 42, 0.95) 100%), url('${coverUrl}')`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        filter: "blur(0px)"
                    }}
                />

                {/* Nút mũi tên quay về Trang chủ góc trên bên trái */}
                <div style={{ position: "absolute", top: 20, left: 24, zIndex: 20 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
                        onClick={() => navigate("/")}
                        style={{
                            height: 42,
                            padding: "0 18px",
                            borderRadius: 21,
                            backgroundColor: "rgba(15, 23, 42, 0.55)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255, 255, 255, 0.25)",
                            color: "#fff",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
                        }}
                    >
                        Quay lại Trang chủ
                    </Button>
                </div>

                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", position: "relative", marginTop: -90, zIndex: 10 }}>

                    <Card
                        style={{
                            borderRadius: 24,
                            boxShadow: "0 20px 45px rgba(0,0,0,0.12)",
                            border: "1px solid #f1f5f9",
                            overflow: "hidden"
                        }}
                        styles={{ body: { padding: 28 } }}
                    >
                        {loading ? (
                            <Skeleton active avatar={{ shape: "square", size: 96 }} paragraph={{ rows: 3 }} />
                        ) : (
                            <Row align="middle" gutter={[24, 24]}>
                                <Col xs={24} md={16}>
                                    <Space align="start" size={20} wrap>
                                        <Avatar
                                            size={96}
                                            src={coverUrl}
                                            icon={<ShopOutlined />}
                                            style={{
                                                borderRadius: 20,
                                                border: "3px solid #fff",
                                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                                flexShrink: 0
                                            }}
                                        />
                                        <div>
                                            <Space align="center" wrap style={{ marginBottom: 4 }}>
                                                <Title level={2} style={{ margin: 0, color: "#1e1b4b", fontWeight: 800 }}>
                                                    {salon.name}
                                                </Title>
                                            </Space>

                                            {salon.description && (
                                                <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 12, maxWidth: 650 }}>
                                                    {salon.description}
                                                </Paragraph>
                                            )}

                                            <Space wrap size="middle" style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                                                <Tag color="gold" style={{ borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
                                                    <StarOutlined style={{ marginRight: 4 }} /> {salon.rating ? Number(salon.rating).toFixed(1) : "5.0"}/5★ ({salon.reviewCount || reviews.length || 12} đánh giá)
                                                </Tag>
                                                {salon.phone && (
                                                    <Text type="secondary">
                                                        <PhoneOutlined style={{ color: "#10b981", marginRight: 4 }} /> Hotline: {salon.phone}
                                                    </Text>
                                                )}
                                                {branches.length > 0 && (
                                                    <Text type="secondary">
                                                        <EnvironmentOutlined style={{ color: "#ef4444", marginRight: 4 }} /> {branches.length} chi nhánh đang hoạt động
                                                    </Text>
                                                )}
                                            </Space>
                                        </div>
                                    </Space>
                                </Col>

                                <Col xs={24} md={8} style={{ textAlign: "right" }}>
                                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                                        <Button
                                            type="primary"
                                            size="large"
                                            block
                                            icon={<CalendarOutlined />}
                                            onClick={() => handleBookingRedirect({ branchId: selectedBranchId })}
                                            style={{
                                                height: 52,
                                                borderRadius: 26,
                                                fontSize: 16,
                                                fontWeight: 700,
                                                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                                                borderColor: "transparent",
                                                boxShadow: "0 10px 25px rgba(79, 70, 229, 0.4)"
                                            }}
                                        >
                                            Đặt Lịch Hẹn Ngay
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        )}
                    </Card>
                </div>
            </div>

            {/* 📋 NỘI DUNG CHÍNH (TABS & THÔNG TIN CHI TIẾT SALON) */}
            <div style={{ maxWidth: 1200, margin: "32px auto 0", padding: "0 24px" }}>
                {/* Chọn Chi Nhánh nếu có nhiều hơn 1 chi nhánh */}
                {branches.length > 1 && (
                    <Card style={{ borderRadius: 16, marginBottom: 24, border: "1px solid #e2e8f0" }} styles={{ body: { padding: "16px 20px" } }}>
                        <Space wrap align="center">
                            <Text strong style={{ fontSize: 14 }}>
                                <EnvironmentOutlined style={{ color: "#4f46e5", marginRight: 6 }} /> Chọn chi nhánh để xem dịch vụ & thợ:
                            </Text>
                            {branches.map((b) => (
                                <Button
                                    key={b.id}
                                    type={String(b.id) === String(selectedBranchId) ? "primary" : "default"}
                                    onClick={() => handleBranchChange(b.id)}
                                    style={{ borderRadius: 20, fontWeight: 600 }}
                                >
                                    {b.name}
                                </Button>
                            ))}
                        </Space>
                    </Card>
                )}

                <Tabs
                    defaultActiveKey="services"
                    size="large"
                    type="line"
                    tabBarStyle={{ fontWeight: 700, marginBottom: 24 }}
                    items={[
                        {
                            key: "services",
                            label: (
                                <span>
                                    <ScissorOutlined /> Bảng Dịch Vụ & Giá ({services.length})
                                </span>
                            ),
                            children: (
                                loadingServices ? (
                                    <Row gutter={[20, 20]}>
                                        {[1, 2, 3, 4, 5, 6].map(idx => (
                                            <Col xs={24} sm={12} md={8} key={idx}>
                                                <Card style={{ borderRadius: 16, height: 160, padding: 12 }}>
                                                    <Skeleton active paragraph={{ rows: 2 }} />
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : sortedCategoryGroups.length > 0 ? (
                                    sortedCategoryGroups.map((group) => (
                                        <div key={group.id} style={{ marginBottom: 32 }}>
                                            <Title level={4} style={{ marginBottom: 16, color: "#1e1b4b", display: "flex", alignItems: "center" }}>
                                                <Tag color="indigo" style={{ borderRadius: 8, marginRight: 8, padding: "2px 8px" }}>✦</Tag>
                                                {group.name}
                                            </Title>
                                            <Row gutter={[20, 20]}>
                                                {group.services.map((serv) => (
                                                    <Col xs={24} sm={12} md={8} key={serv.id}>
                                                        <Card
                                                            hoverable
                                                            style={{
                                                                borderRadius: 16,
                                                                height: "100%",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                justifyContent: "space-between",
                                                                border: "1px solid #f1f5f9",
                                                                boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                                                            }}
                                                            styles={{ body: { padding: 18, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" } }}
                                                        >
                                                            <div>
                                                                <Row justify="space-between" align="start">
                                                                    <Col span={17}>
                                                                        <Text strong style={{ fontSize: 16, color: "#1e1b4b", display: "block", marginBottom: 4 }}>
                                                                            {serv.name}
                                                                        </Text>
                                                                    </Col>
                                                                    <Col span={7} style={{ textAlign: "right" }}>
                                                                        <Tag color="blue" style={{ borderRadius: 10, fontWeight: 700, margin: 0 }}>
                                                                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                                            {serv.durationMinutes || 30} phút
                                                                        </Tag>
                                                                    </Col>
                                                                </Row>

                                                                {serv.description && (
                                                                    <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 8, marginBottom: 12 }} ellipsis={{ rows: 2 }}>
                                                                        {serv.description}
                                                                    </Paragraph>
                                                                )}
                                                            </div>

                                                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                                <Text strong style={{ fontSize: 18, color: "#4f46e5", fontWeight: 800 }}>
                                                                    {Number(serv.price || 0).toLocaleString("vi-VN")} đ
                                                                </Text>
                                                                <Button
                                                                    type="primary"
                                                                    size="small"
                                                                    shape="round"
                                                                    icon={<CalendarOutlined />}
                                                                    onClick={() => handleBookingRedirect({ branchId: selectedBranchId, serviceId: serv.id })}
                                                                    style={{ backgroundColor: "#4f46e5", borderColor: "#4f46e5", fontWeight: 600 }}
                                                                >
                                                                    Đặt lịch
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    ))
                                ) : (
                                    <Empty description="Chưa có thông tin dịch vụ tại chi nhánh này" style={{ padding: "40px 0" }} />
                                )
                            )
                        },
                        {
                            key: "branches",
                            label: (
                                <span>
                                    <ShopOutlined /> Hệ Thống Chi Nhánh ({branches.length})
                                </span>
                            ),
                            children: (
                                <Row gutter={[20, 20]}>
                                    {branches.map((branch) => (
                                        <Col xs={24} md={12} key={branch.id}>
                                            <Card
                                                style={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}
                                                styles={{ body: { padding: 20 } }}
                                            >
                                                <Space align="start" size="middle">
                                                    <Avatar size={48} icon={<ShopOutlined />} style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }} />
                                                    <div>
                                                        <Title level={4} style={{ margin: "0 0 6px 0", color: "#1e1b4b" }}>
                                                            {branch.name}
                                                        </Title>
                                                        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 8 }}>
                                                            <EnvironmentOutlined style={{ color: "#ef4444", marginRight: 6 }} />
                                                            {branch.address || "Chi nhánh SalonFlow"}
                                                        </Paragraph>
                                                        {branch.phone && (
                                                            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
                                                                <PhoneOutlined style={{ color: "#10b981", marginRight: 6 }} />
                                                                {branch.phone}
                                                            </Text>
                                                        )}
                                                        <Button
                                                            type="outline"
                                                            size="small"
                                                            icon={<CalendarOutlined />}
                                                            onClick={() => handleBookingRedirect({ branchId: branch.id })}
                                                            style={{ borderRadius: 12, fontWeight: 600, color: "#4f46e5", borderColor: "#818cf8" }}
                                                        >
                                                            Đặt lịch tại chi nhánh này
                                                        </Button>
                                                    </div>
                                                </Space>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )
                        },
                        {
                            key: "stylists",
                            label: (
                                <span>
                                    <TeamOutlined /> Đội Ngũ Stylist ({staffList.length})
                                </span>
                            ),
                            children: (
                                loadingServices ? (
                                    <Row gutter={[20, 20]}>
                                        {[1, 2, 3, 4].map(idx => (
                                            <Col xs={24} sm={12} md={6} key={idx}>
                                                <Card style={{ borderRadius: 16, height: 180, padding: 12 }}>
                                                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : staffList.length > 0 ? (
                                    <Row gutter={[20, 20]}>
                                        {staffList.map((stf) => {
                                            const stfAvatar = stf.avatarUrl || stf.photoUrl || stf.avatar || stf.photo || stf.user?.avatarUrl;
                                            const isManager = stf.roleCode === "MANAGER" || stf.role === "MANAGER" || stf.roleName?.includes("Quản lý");
                                            return (
                                                <Col xs={24} sm={12} md={6} key={stf.id}>
                                                    <Card
                                                        hoverable
                                                        style={{
                                                            borderRadius: 16,
                                                            textAlign: "center",
                                                            border: "1px solid #f1f5f9",
                                                            height: "100%",
                                                            boxShadow: "0 4px 16px rgba(0,0,0,0.03)"
                                                        }}
                                                        styles={{ body: { padding: "20px 16px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" } }}
                                                    >
                                                        <div>
                                                            <Avatar
                                                                size={72}
                                                                src={stfAvatar || undefined}
                                                                icon={<UserOutlined />}
                                                                style={{
                                                                    marginBottom: 12,
                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                                                    backgroundColor: stfAvatar ? "transparent" : "#4f46e5",
                                                                    color: "#fff"
                                                                }}
                                                            />
                                                            <Title level={5} style={{ margin: "0 0 6px 0", color: "#1e1b4b", fontWeight: 700 }}>
                                                                {stf.name || stf.fullName || "Nhân viên"}
                                                            </Title>
                                                            <Tag
                                                                color={isManager ? "gold" : "blue"}
                                                                style={{ borderRadius: 10, marginBottom: 8, fontWeight: 700, padding: "2px 10px" }}
                                                            >
                                                                {isManager ? "Quản lý" : "Stylist"}
                                                            </Tag>
                                                        </div>

                                                        {stf.bio ? (
                                                            <Paragraph type="secondary" style={{ fontSize: 12, margin: "8px 0 0", minHeight: 36 }} ellipsis={{ rows: 2 }}>
                                                                {stf.bio}
                                                            </Paragraph>
                                                        ) : (
                                                            <div style={{ height: 16 }} />
                                                        )}
                                                    </Card>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                ) : (
                                    <Empty description="Đội ngũ Stylist đang được hoàn thiện thông tin" />
                                )
                            )
                        },
                        {
                            key: "gallery",
                            label: (
                                <span>
                                    <PictureOutlined /> Album Hình Ảnh ({salon?.photos?.length || 0})
                                </span>
                            ),
                            children: (
                                salon?.photos && salon.photos.length > 0 ? (
                                    <Image.PreviewGroup>
                                        <Row gutter={[16, 16]}>
                                            {salon.photos.map((ph, idx) => (
                                                <Col xs={12} sm={8} md={6} key={idx}>
                                                    <Image
                                                        src={ph.url || ph.photoUrl}
                                                        alt={`photo-${idx}`}
                                                        style={{ borderRadius: 12, height: 160, objectFit: "cover", width: "100%" }}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </Image.PreviewGroup>
                                ) : (
                                    <Empty description="Salon chưa đăng tải album ảnh không gian" />
                                )
                            )
                        },
                        {
                            key: "reviews",
                            label: (
                                <span>
                                    <StarOutlined /> Đánh Giá Khách Hàng ({reviews.length})
                                </span>
                            ),
                            children: (
                                <Row gutter={[0, 16]}>
                                    {reviews.length > 0 ? (
                                        reviews.map((rev, idx) => (
                                            <Col xs={24} key={idx}>
                                                <Card style={{ borderRadius: 16, border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }} styles={{ body: { padding: 20 } }}>
                                                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                                        <Avatar
                                                            size={44}
                                                            src={rev.customerAvatar || undefined}
                                                            icon={<UserOutlined />}
                                                            style={{ backgroundColor: rev.customerAvatar ? "transparent" : "#4f46e5", color: "#fff", flexShrink: 0, fontWeight: 700 }}
                                                        >
                                                            {!rev.customerAvatar && (rev.customerName ? rev.customerName.charAt(0).toUpperCase() : "K")}
                                                        </Avatar>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                                                <Space align="center" size="small">
                                                                    <Text strong style={{ fontSize: 15, color: "#1e1b4b" }}>{rev.customerName || "Khách hàng"}</Text>
                                                                    <Rate disabled defaultValue={rev.rating || 5} style={{ fontSize: 13 }} />
                                                                </Space>
                                                                {rev.createdAt && (
                                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                                        {new Date(rev.createdAt).toLocaleDateString("vi-VN")}
                                                                    </Text>
                                                                )}
                                                            </div>

                                                            <Paragraph style={{ fontSize: 14, margin: "8px 0", color: "#334155", lineHeight: 1.6 }}>
                                                                "{rev.comment || "Dịch vụ rất tốt và nhân viên phục vụ tận tình!"}"
                                                            </Paragraph>

                                                            {/* 📸 THỰC HIỆN HIỂN THỊ HÌNH ẢNH REVIEW ĐÃ TẢI LÊN CỦA KHÁCH HÀNG */}
                                                            {rev.photos && rev.photos.length > 0 && (
                                                                <div style={{ marginTop: 10, marginBottom: 8 }}>
                                                                    <Image.PreviewGroup>
                                                                        <Space size={8} wrap>
                                                                            {rev.photos.map((imgUrl, pIdx) => (
                                                                                <Image
                                                                                    key={pIdx}
                                                                                    src={imgUrl}
                                                                                    alt={`review-photo-${pIdx}`}
                                                                                    style={{ width: 76, height: 76, borderRadius: 10, objectFit: "cover", border: "1px solid #e2e8f0" }}
                                                                                />
                                                                            ))}
                                                                        </Space>
                                                                    </Image.PreviewGroup>
                                                                </div>
                                                            )}

                                                            {rev.branchName && (
                                                                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                                                                    📍 Khách trải nghiệm tại <strong style={{ color: "#475569" }}>{rev.branchName}</strong>
                                                                </Text>
                                                            )}

                                                            {/* 💬 Phản hồi của Chủ Salon */}
                                                            {rev.ownerReply && (
                                                                <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 12, borderLeft: "4px solid #4f46e5" }}>
                                                                    <Text strong style={{ fontSize: 13, color: "#4f46e5", display: "block", marginBottom: 2 }}>
                                                                        💬 Phản hồi từ Salon:
                                                                    </Text>
                                                                    <Text style={{ fontSize: 13, color: "#475569" }}>{rev.ownerReply}</Text>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Col>
                                        ))
                                    ) : (
                                        <Col span={24}>
                                            <Empty description="Chưa có lượt đánh giá nào cho Salon này" />
                                        </Col>
                                    )}
                                </Row>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
