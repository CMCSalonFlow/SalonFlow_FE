import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/core/api/endpoints";
import {
    Card,
    Typography,
    Row,
    Col,
    Button,
    Tag,
    Input,
    Tabs,
    Modal,
    Space,
    Divider,
    Rate,
    Badge,
    Spin
} from "antd";
import {
    ScissorOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    RightOutlined,
    StarOutlined,
    HeartOutlined,
    SmileOutlined,
    InfoCircleOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function CategoryListUserPage() {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [detailModalService, setDetailModalService] = useState(null);
    const [categoriesFromApi, setCategoriesFromApi] = useState([]);
    const [loadingApi, setLoadingApi] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingApi(true);
                const response = await fetch(`${API_BASE_URL}/api/v1/categories/public`);
                if (response.ok) {
                    const data = await response.json();
                    setCategoriesFromApi(data);
                }
            } catch (err) {
                console.error("Lỗi khi tải danh mục API:", err);
            } finally {
                setLoadingApi(false);
            }
        };

        fetchCategories();
    }, []);

    // Danh sách Dịch vụ & Combo Làm Đẹp Phong Phú & Chi Tiết
    const servicesCatalog = [
        {
            id: 1,
            name: "Cắt Tóc Nam Classic & Modern Styling",
            category: "CẮT & TẠO KIỂU",
            price: "120.000đ",
            originalPrice: "150.000đ",
            duration: "30 phút",
            tag: "BEST SELLER",
            tagColor: "red",
            rating: 5.0,
            reviewsCount: 320,
            image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800",
            shortDesc: "Tạo kiểu tóc thời thượng (Undercut, Side Part, Pompadour) chuẩn form khuôn mặt.",
            benefits: ["Khám tình trạng tóc & tư vấn form dáng", "Gội xả thư giãn tinh chất bạc hà", "Cắt tạo dáng chuyên nghiệp", "Sấy sáp tạo kiểu giữ nếp 24h"],
            procedure: [
                "Bước 1: Tư vấn dáng tóc phù hợp với khuôn mặt và phong cách.",
                "Bước 2: Gội xả massage đầu thư giãn với dầu gội sinh học.",
                "Bước 3: Thực hiện cắt tạo form chuẩn xác bởi Stylist tay nghề cao.",
                "Bước 4: Xả sạch vụn tóc và sấy định hình.",
                "Bước 5: Vuốt sáp/gel vuốt tóc giữ nếp rạng rỡ."
            ]
        },
        {
            id: 2,
            name: "Cắt & Sấy Tạo Kiểu Nữ Layer / Bob",
            category: "CẮT & TẠO KIỂU",
            price: "180.000đ",
            originalPrice: "220.000đ",
            duration: "45 phút",
            tag: "HOT TREND",
            tagColor: "purple",
            rating: 4.9,
            reviewsCount: 280,
            image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800",
            shortDesc: "Cắt Layer bay bổng, Bob nữ tính kết hợp sấy xoăn bồng bềnh tự nhiên.",
            benefits: ["Thiết kế tỉa Layer tạo độ phồng tối đa", "Gội xả dưỡng ẩm sâu collagen", "Sấy tạo xoăn/thẳng thời trang", "Xịt dưỡng bảo vệ ngọn tóc"],
            procedure: [
                "Bước 1: Lắng nghe mong muốn và kiểm tra chất tóc của khách hàng.",
                "Bước 2: Gội xả cân bằng độ ẩm phục hồi đuôi tóc khô xơ.",
                "Bước 3: Thiết kế cắt Layer/Bob đa tầng tạo hiệu ứng bồng bềnh.",
                "Bước 4: Sấy xoăn nhẹ phần đuôi tóc bằng lô sấy chuyên dụng.",
                "Bước 5: Thoa tinh dầu dưỡng bóng tóc mượt mà."
            ]
        },
        {
            id: 3,
            name: "Uốn Sóng Lơi Hàn Quốc / Uốn Hippie",
            category: "UỐN & NHUỘM",
            price: "650.000đ",
            originalPrice: "850.000đ",
            duration: "120 phút",
            tag: "XU HƯỚNG",
            tagColor: "magenta",
            rating: 5.0,
            reviewsCount: 450,
            image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
            shortDesc: "Uốn nếp sóng lơi tự nhiên hoặc uốn Hippie cá tính, giữ nếp lâu từ 6-8 tháng.",
            benefits: ["Thuốc uốn hữu cơ không gây mùi nồng", "Tặng kèm 1 lần hấp phục hồi Keratin", "Định hình sóng tóc bồng bềnh tự nhiên", "Bảo hành sóng uốn 14 ngày"],
            procedure: [
                "Bước 1: Kiểm tra độ khỏe của tóc và cắt tỉa form trước uốn.",
                "Bước 2: Thoa serum bảo vệ ngọn tóc khỏi nhiệt độ cao.",
                "Bước 3: Lên trục uốn và chạy nhiệt điện từ theo thời gian chuẩn.",
                "Bước 4: Thoa dập định hình nếp xoăn giữ lọn.",
                "Bước 5: Xả sạch, dập khoáng và sấy tạo lọn cuốn hút."
            ]
        },
        {
            id: 4,
            name: "Nhuộm Cân Bằng Màu & Tẩy Tóc L'Oréal",
            category: "UỐN & NHUỘM",
            price: "750.000đ",
            originalPrice: "950.000đ",
            duration: "150 phút",
            tag: "CAO CẤP",
            tagColor: "volcano",
            rating: 4.9,
            reviewsCount: 510,
            image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=800",
            shortDesc: "Bảng màu nhuộm đa dạng (Nâu trà sữa, Xám khói, Than chì, Nâu tây) chuẩn tone mượt mà.",
            benefits: ["Mỹ phẩm nhuộm L'Oréal chính hãng 100%", "Bảo vệ da đầu với tinh dầu dừa", "Màu nhuộm chuẩn ánh kim lấp lánh", "Khóa màu giúp duy trì độ bền màu lâu"],
            procedure: [
                "Bước 1: Thử màu tóc và tư vấn tone màu hợp sắc tố da.",
                "Bước 2: Thoa tinh dầu bảo vệ chân tóc và da đầu.",
                "Bước 3: Pha chế màu nhuộm L'Oréal chuẩn công thức.",
                "Bước 4: Chờ lên màu từ 35 - 45 phút.",
                "Bước 5: Gội khử kiềm, xả khóa màu và sấy hoàn thiện."
            ]
        },
        {
            id: 5,
            name: "Phục Hồi Tóc Keratin & Olaplex Chuyên Sâu",
            category: "UỐN & NHUỘM",
            price: "350.000đ",
            originalPrice: "450.000đ",
            duration: "60 phút",
            tag: "PHỤC HỒI",
            tagColor: "gold",
            rating: 4.8,
            reviewsCount: 190,
            image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800",
            shortDesc: "Tái tạo liên kết tóc hư tổn do uốn tẩy nhiều lần, trả lại độ đàn hồi bóng mượt.",
            benefits: ["Bổ sung Keratin và Protein thiếu hụt", "Hấp nhiệt Nano thúc đẩy dưỡng chất", "Giảm xơ rối chẻ ngọn tức thì 90%", "Tóc suôn mượt ngay sau 1 buổi"],
            procedure: [
                "Bước 1: Gội sạch sâu loại bỏ hóa chất tích tụ.",
                "Bước 2: Phủ huyết thanh Olaplex/Keratin lên từng tép tóc.",
                "Bước 3: Đưa vào máy hấp sóng Nano vi điểm trong 25 phút.",
                "Bước 4: Xả nhẹ với nước mát khóa biểu bì tóc.",
                "Bước 5: Kẹp nhiệt nhẹ định hình lớp màng bảo vệ Keratin."
            ]
        },
        {
            id: 6,
            name: "Gội Đầu Dưỡng Sinh Thảo Dược 14 Bước",
            category: "GỘI DƯỠNG SINH & SPA",
            price: "180.000đ",
            originalPrice: "250.000đ",
            duration: "45 phút",
            tag: "THƯ GIÃN",
            tagColor: "green",
            rating: 5.0,
            reviewsCount: 680,
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800",
            shortDesc: "Khai thông kinh lạc, ấn huyệt đầu, massage cổ vai gáy đánh tan mệt mỏi stress.",
            benefits: ["Nước gội nấu từ Bồ kết, Vỏ bưởi, Sả chanh", "Ấn huyệt giúp ngủ ngon sâu giấc", "Massage vai gáy giảm đau mỏi", "Sấy khô và thoa xịt dưỡng tóc"],
            procedure: [
                "Bước 1: Khai thông huyệt đạo vùng đầu và cổ.",
                "Bước 2: Gội rửa lần 1 với dầu gội thảo mộc thơm dịu.",
                "Bước 3: Rửa mặt và đắp mặt nạ dưa leo/ngọc trai.",
                "Bước 4: Gội lần 2 kết hợp massage bấm huyệt thái dương.",
                "Bước 5: Xả tóc canh thảo dược nóng vòm vòi sen tuần hoàn.",
                "Bước 6: Massage vai gáy, sấy khô và xịt dưỡng thảo mộc."
            ]
        },
        {
            id: 7,
            name: "Spa Chăm Sóc Da Mặt Điện Di Vitamin C",
            category: "GỘI DƯỠNG SINH & SPA",
            price: "250.000đ",
            originalPrice: "350.000đ",
            duration: "60 phút",
            tag: "SÁNG DA",
            tagColor: "cyan",
            rating: 4.9,
            reviewsCount: 230,
            image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800",
            shortDesc: "Làm sạch sâu bã nhờn, hút mụn cám và điện di serum C giúp da sáng mịn căng bóng.",
            benefits: ["Tẩy tế bào chết bã nhờn dịu nhẹ", "Xông hơi hút mụn cám vô trùng", "Điện di tinh chất C giúp mờ thâm", "Đắp mặt nạ sinh học cấp ẩm"],
            procedure: [
                "Bước 1: Tẩy trang và rửa mặt bằng sữa rửa mặt dịu nhẹ.",
                "Bước 2: Tẩy tế bào chết enzym hoa quả.",
                "Bước 3: Xông hơi nóng làm mềm lỗ chân lông & hút mụn cám.",
                "Bước 4: Điện di tinh chất Vitamin C tươi lạnh ion âm.",
                "Bước 5: Đắp nạ cấp ẩm dừa tươi & thoa kem chống nắng bảo vệ."
            ]
        },
        {
            id: 8,
            name: "Combo Chăm Sóc Móng OPI & Sơn Gel Hàn Quốc",
            category: "NAIL & MI",
            price: "180.000đ",
            originalPrice: "240.000đ",
            duration: "45 phút",
            tag: "YÊU THÍCH",
            tagColor: "pink",
            rating: 4.8,
            reviewsCount: 340,
            image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800",
            shortDesc: "Chăm sóc viền móng sạch sẽ, dưỡng tinh dầu OPI và sơn Gel Hàn Quốc bóng bền.",
            benefits: ["Tạo phom móng vuông/tròn thời trang", "Cắt tỉa da thừa nhẹ nhàng không đau", "Sơn Gel bóng bền >3 tuần", "Bảo hành tróc sơn 7 ngày"],
            procedure: [
                "Bước 1: Ngâm tay/chân nước ấm thảo mộc.",
                "Bước 2: Cắt tỉa da thừa & tạo dáng phom móng.",
                "Bước 3: Phủ lớp liên kết kiềm dầu dính chắc.",
                "Bước 4: Sơn 2 lớp màu Gel theo yêu cầu & hơ đèn UV.",
                "Bước 5: Phủ sơn bóng cứng móng và thoa dưỡng OPI."
            ]
        },
        {
            id: 9,
            name: "Nối Mi Thiết Kế & Uốn Mi Collagen",
            category: "NAIL & MI",
            price: "220.000đ",
            originalPrice: "300.000đ",
            duration: "60 phút",
            tag: "TỰ NHIÊN",
            tagColor: "purple",
            rating: 4.9,
            reviewsCount: 160,
            image: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?q=80&w=800",
            shortDesc: "Nối mi Katun, Classic, Volume nhẹ mắt hoặc uốn mi cong tự nhiên kéo dài mi thật.",
            benefits: ["Sợi mi lụa siêu nhẹ không cay mắt", "Keo nối mi an toàn chuẩn y tế", "Kèm chổi chải mi cá nhân", "Duy trì độ cong và độ bền 4-6 tuần"],
            procedure: [
                "Bước 1: Vệ sinh mi thật loại bỏ bụi bẩn dầu thừa.",
                "Bước 2: Tư vấn dáng mi (Tự nhiên, Búp bẩy, Mắt mèo).",
                "Bước 3: Cách mi 0.5mm nối tỉ mỉ từng sợi mi lụa.",
                "Bước 4: Phủ gel khóa keo bền mi.",
                "Bước 5: Chải mi hoàn thiện & dặn dò bảo quản."
            ]
        },
        {
            id: 10,
            name: "Combo Gentlemen VIP All-In-One (Cắt + Gội DS + Cạo Mặt)",
            category: "COMBO TIẾT KIỆM",
            price: "220.000đ",
            originalPrice: "320.000đ",
            duration: "60 phút",
            tag: "SIÊU TIẾT KIỆM",
            tagColor: "red",
            rating: 5.0,
            reviewsCount: 890,
            image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800",
            shortDesc: "Gói làm đẹp toàn diện quý ông: Cắt tóc + Gội dưỡng sinh 9 bước + Cạo mặt sấy sáp.",
            benefits: ["Tiết kiệm 30% so với làm lẻ từng dịch vụ", "Trải nghiệm thư giãn trọn gói 60 phút", "Sử dụng dòng sáp tạo kiểu cao cấp", "Tặng kèm 1 ly nước uống tự chọn"],
            procedure: [
                "Bước 1: Cắt tạo kiểu tóc nam thời thượng.",
                "Bước 2: Cạo mặt êm ái xịt khoáng dịu da.",
                "Bước 3: Gội dưỡng sinh thảo dược ấn huyệt 9 bước.",
                "Bước 4: Rửa mặt massage da đầu sảng khoái.",
                "Bước 5: Sấy sáp tạo kiểu lịch lãm chuẩn nam thần."
            ]
        },
        {
            id: 11,
            name: "Combo Lady Glamour (Cắt + Nhuộm Tóc + Phục Hồi Keratin)",
            category: "COMBO TIẾT KIỆM",
            price: "890.000đ",
            originalPrice: "1.250.000đ",
            duration: "180 phút",
            tag: "COMBO LADY",
            tagColor: "magenta",
            rating: 5.0,
            reviewsCount: 420,
            image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800",
            shortDesc: "Thay đổi diện mạo hoàn hảo: Cắt Layer + Nhuộm màu xu hướng + Hấp Keratin bóng tóc.",
            benefits: ["Tiết kiệm 360.000đ khi đăng ký theo gói", "Tặng serum khóa màu tóc L'Oréal", "Bảo hành màu nhuộm 14 ngày", "Tạo kiểu xoăn lơi sấy phồng miễn phí"],
            procedure: [
                "Bước 1: Tư vấn dáng cắt Layer & bảng màu nhuộm tôn da.",
                "Bước 2: Thực hiện cắt tạo dáng tóc gọn gàng.",
                "Bước 3: Thoa thuốc nhuộm L'Oréal chuẩn tông.",
                "Bước 4: Phủ serum Keratin hấp phục hồi bóng tóc.",
                "Bước 5: Sấy xoăn lơi bồng bềnh thần thái."
            ]
        },
        {
            id: 12,
            name: "Combo Spa Thư Giãn (Gội Dưỡng Sinh + Massage Vai Gáy + Skincare)",
            category: "COMBO TIẾT KIỆM",
            price: "380.000đ",
            originalPrice: "550.000đ",
            duration: "90 phút",
            tag: "VIP SPA",
            tagColor: "green",
            rating: 4.9,
            reviewsCount: 310,
            image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800",
            shortDesc: "Gói spa xua tan mệt mỏi: Gội thảo mộc + Massage đá nóng vai gáy + Điện di C căng bóng da.",
            benefits: ["90 phút phục hồi năng lượng thể chất", "Đá nóng muối hồng Himalaya chườm vai", "Skincare 7 bước chuyên sâu", "Tặng trà thảo mộc dưỡng nhan"],
            procedure: [
                "Bước 1: Ngâm chân thảo mộc & chườm ấm vai.",
                "Bước 2: Gội đầu thảo mộc rửa mặt tẩy đòn.",
                "Bước 3: Massage đá nóng muối hồng vùng cổ vai gáy.",
                "Bước 4: Điện di Vitamin C tươi & đắp nạ bùn khoáng.",
                "Bước 5: Sấy tóc và thưởng thức trà dưỡng nhan."
            ]
        }
    ];

    // Lọc dịch vụ theo danh mục và từ khóa tìm kiếm
    const filteredServices = servicesCatalog.filter(service => {
        const matchesCategory = selectedCategory === "ALL" || service.category === selectedCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              service.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categoryTabs = [
        { key: "ALL", label: "✨ Tất Cả Dịch Vụ" },
        { key: "CẮT & TẠO KIỂU", label: "✂️ Cắt & Tạo Kiểu" },
        { key: "UỐN & NHUỘM", label: "🎨 Uốn & Nhuộm Hàn Quốc" },
        { key: "GỘI DƯỠNG SINH & SPA", label: "💆‍♀️ Gội Dưỡng Sinh & Spa" },
        { key: "NAIL & MI", label: "💅 Nail Art & Mi" },
        { key: "COMBO TIẾT KIỆM", label: "🎁 Combo Siêu Tiết Kiệm" }
    ];

    return (
        <div style={{ maxWidth: 1240, margin: "20px auto 60px", padding: "0 20px" }}>
            {/* 🌟 HERO BANNER GIỚI THIỆU BẢNG GIÁ & DỊCH VỤ */}
            <Card
                style={{
                    borderRadius: 28,
                    border: "none",
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1677ff 100%)",
                    color: "#fff",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                    marginBottom: 40,
                    padding: "30px 24px"
                }}
            >
                <Row align="middle" gutter={[32, 32]}>
                    <Col xs={24} md={15}>
                        <Tag color="cyan" style={{ borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14, border: "none" }}>
                            💎 BẢNG GIÁ DỊCH VỤ & COMBO LÀM ĐẸP CHÍNH THỨC
                        </Tag>
                        <Title level={1} style={{ color: "#fff", margin: 0, fontSize: 36, fontWeight: 800 }}>
                            Dịch Vụ Làm Đẹp Đa Dạng Tại SalonFlow
                        </Title>
                        <Paragraph style={{ color: "rgba(255, 255, 255, 0.88)", fontSize: 16, marginTop: 12, marginBottom: 24, lineHeight: 1.7 }}>
                            Khám phá menu làm đẹp phong phú từ Cắt tạo kiểu, Uốn nhuộm cao cấp L'Oréal, Gội đầu dưỡng sinh 14 bước đến chăm sóc Nail Art. **Đặt lịch vãng lai giữ chỗ trong 30 giây**!
                        </Paragraph>

                        <Space size="middle" wrap>
                            <Button
                                type="primary"
                                size="large"
                                icon={<ScissorOutlined />}
                                onClick={() => navigate("/guest-booking")}
                                style={{
                                    height: 50,
                                    padding: "0 30px",
                                    borderRadius: 25,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    backgroundColor: "#ff4d4f",
                                    borderColor: "#ff4d4f",
                                    boxShadow: "0 8px 20px rgba(255, 77, 79, 0.4)"
                                }}
                            >
                                Đặt lịch vãng lai giữ chỗ
                            </Button>
                        </Space>
                    </Col>

                    <Col xs={24} md={9} style={{ textAlign: "center" }}>
                        <div style={{
                            background: "rgba(255, 255, 255, 0.12)",
                            backdropFilter: "blur(12px)",
                            padding: 24,
                            borderRadius: 24,
                            border: "1px solid rgba(255, 255, 255, 0.25)"
                        }}>
                            <SafetyCertificateOutlined style={{ fontSize: 44, color: "#52c41a", marginBottom: 10 }} />
                            <Title level={4} style={{ color: "#fff", margin: "0 0 6px 0" }}>
                                Cam Kết Chất Lượng 100%
                            </Title>
                            <Text style={{ color: "rgba(255, 255, 255, 0.85)", display: "block", fontSize: 13 }}>
                                ✔️ 100% Mỹ phẩm nhập khẩu (L'Oréal, Olaplex, OPI)<br />
                                ✔️ Bảo hành kiểu tóc 7 ngày miễn phí<br />
                                ✔️ 100% Stylist hơn 5 năm kinh nghiệm
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* 🔍 TÌM KIẾM & BỘ LỌC DANH MỤC */}
            <Card
                style={{
                    borderRadius: 24,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.03)",
                    marginBottom: 36,
                    border: "1px solid #f1f5f9"
                }}
            >
                <Row gutter={[20, 20]} align="middle" justify="space-between">
                    <Col xs={24} md={14}>
                        <Tabs
                            activeKey={selectedCategory}
                            onChange={(key) => setSelectedCategory(key)}
                            items={categoryTabs}
                            tabBarStyle={{ marginBottom: 0 }}
                        />
                    </Col>
                    <Col xs={24} md={10}>
                        <Input
                            placeholder="Tìm kiếm dịch vụ, uốn nhuộm, spa, nail..."
                            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                            allowClear
                            size="large"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ borderRadius: 14 }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* ✂️ DANH SÁCH THẺ DỊCH VỤ SẮC NÉT & CHI TIẾT */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                        Danh Sách Dịch Vụ ({filteredServices.length})
                    </Title>
                </Col>
            </Row>

            {filteredServices.length === 0 ? (
                <Card style={{ borderRadius: 20, textAlign: "center", padding: "40px 0" }}>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Không tìm thấy dịch vụ nào phù hợp với từ khóa "{searchTerm}".
                    </Text>
                </Card>
            ) : (
                <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
                    {filteredServices.map((service) => (
                        <Col xs={24} sm={12} lg={8} key={service.id}>
                            <Card
                                hoverable
                                cover={
                                    <div style={{ height: 210, overflow: "hidden", position: "relative" }}>
                                        <img
                                            alt={service.name}
                                            src={service.image}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                transition: "transform 0.4s ease"
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = "scale(1.08)"}
                                            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                        />
                                        <Tag
                                            color={service.tagColor}
                                            style={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                borderRadius: 10,
                                                fontWeight: 700,
                                                padding: "3px 10px",
                                                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                                            }}
                                        >
                                            {service.tag}
                                        </Tag>
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: 12,
                                                left: 12,
                                                background: "rgba(15, 23, 42, 0.75)",
                                                backdropFilter: "blur(6px)",
                                                padding: "3px 10px",
                                                borderRadius: 10,
                                                color: "#fff",
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}
                                        >
                                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                                            {service.duration}
                                        </div>
                                    </div>
                                }
                                style={{
                                    borderRadius: 20,
                                    overflow: "hidden",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column"
                                }}
                                bodyStyle={{ padding: 22, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                            >
                                <div>
                                    <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 600 }}>
                                            {service.category}
                                        </Tag>
                                        <Space size={4}>
                                            <StarOutlined style={{ color: "#faad14" }} />
                                            <Text strong style={{ fontSize: 13 }}>{service.rating}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>({service.reviewsCount})</Text>
                                        </Space>
                                    </div>

                                    <Title level={4} style={{ margin: "6px 0 8px 0", fontSize: 18, color: "#0f172a" }}>
                                        {service.name}
                                    </Title>

                                    <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                                        {service.shortDesc}
                                    </Paragraph>

                                    {/* Danh sách lợi ích nổi bật */}
                                    <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 12, marginBottom: 16 }}>
                                        {service.benefits.slice(0, 2).map((benefit, bIdx) => (
                                            <div key={bIdx} style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                                                <span>{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Divider style={{ margin: "12px 0" }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <div>
                                            <Text strong style={{ color: "#ff4d4f", fontSize: 20, fontWeight: 800 }}>
                                                {service.price}
                                            </Text>
                                            {service.originalPrice && (
                                                <Text delete type="secondary" style={{ fontSize: 13, marginLeft: 8 }}>
                                                    {service.originalPrice}
                                                </Text>
                                            )}
                                        </div>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<InfoCircleOutlined />}
                                            onClick={() => setDetailModalService(service)}
                                            style={{ color: "#1677ff" }}
                                        >
                                            Quy trình
                                        </Button>
                                    </div>

                                    <Button
                                        type="primary"
                                        block
                                        shape="round"
                                        size="large"
                                        icon={<ScissorOutlined />}
                                        onClick={() => navigate("/guest-booking")}
                                        style={{
                                            fontWeight: 700,
                                            height: 44,
                                            backgroundColor: "#1677ff",
                                            boxShadow: "0 4px 14px rgba(22, 119, 255, 0.25)"
                                        }}
                                    >
                                        Đặt lịch giữ chỗ ngay
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* 🛡️ KHỐI CAM KẾT CHẤT LƯỢNG VƯỢT TRỘI */}
            <Card
                style={{
                    borderRadius: 24,
                    background: "linear-gradient(135deg, #f8fafc 0%, #e6f7ff 100%)",
                    border: "1px solid #bae7ff",
                    marginBottom: 40,
                    padding: "16px 8px"
                }}
            >
                <Title level={3} style={{ textAlign: "center", marginBottom: 24, fontWeight: 700 }}>
                    💎 4 Cam Kết Vàng Từ Hệ Thống SalonFlow
                </Title>
                <Row gutter={[20, 20]}>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ textAlign: "center", padding: 12 }}>
                            <SafetyCertificateOutlined style={{ fontSize: 38, color: "#1677ff", marginBottom: 12 }} />
                            <Title level={5} style={{ margin: "0 0 6px 0" }}>100% Thuốc Chính Hãng</Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Nhập khẩu trực tiếp từ L'Oréal Paris, Olaplex, Kérastase & OPI.
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ textAlign: "center", padding: 12 }}>
                            <CheckCircleOutlined style={{ fontSize: 38, color: "#52c41a", marginBottom: 12 }} />
                            <Title level={5} style={{ margin: "0 0 6px 0" }}>Bảo Hành Kiểu 7 Ngày</Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Miễn phí dặm màu hoặc chỉnh nếp uốn nếu khách hàng chưa hài lòng.
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ textAlign: "center", padding: 12 }}>
                            <ThunderboltOutlined style={{ fontSize: 38, color: "#fa8c16", marginBottom: 12 }} />
                            <Title level={5} style={{ margin: "0 0 6px 0" }}>Giữ Chỗ Đúng Giờ</Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Phục vụ ngay khi khách tới đúng giờ đặt, không xếp hàng chờ đợi.
                            </Text>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ textAlign: "center", padding: 12 }}>
                            <SmileOutlined style={{ fontSize: 38, color: "#722ed1", marginBottom: 12 }} />
                            <Title level={5} style={{ margin: "0 0 6px 0" }}>Stylist Chuyên Nghiệp</Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Đội ngũ thợ hơn 5 năm kinh nghiệm, liên tục cập nhật xu hướng mới.
                            </Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* 📌 MODAL XEM CHI TIẾT QUY TRÌNH DỊCH VỤ */}
            {detailModalService && (
                <Modal
                    open={!!detailModalService}
                    onCancel={() => setDetailModalService(null)}
                    footer={[
                        <Button key="close" onClick={() => setDetailModalService(null)}>
                            Đóng
                        </Button>,
                        <Button
                            key="book"
                            type="primary"
                            icon={<ScissorOutlined />}
                            onClick={() => {
                                setDetailModalService(null);
                                navigate("/guest-booking");
                            }}
                            style={{ backgroundColor: "#1677ff", fontWeight: 700 }}
                        >
                            Đặt dịch vụ này ngay
                        </Button>
                    ]}
                    width={640}
                    style={{ borderRadius: 24, overflow: "hidden" }}
                >
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <Tag color={detailModalService.tagColor} style={{ borderRadius: 10, fontWeight: 700, marginBottom: 8 }}>
                            {detailModalService.category}
                        </Tag>
                        <Title level={3} style={{ margin: "4px 0 8px 0" }}>
                            {detailModalService.name}
                        </Title>
                        <Text strong style={{ color: "#ff4d4f", fontSize: 22, fontWeight: 800 }}>
                            {detailModalService.price}
                        </Text>
                        <Text type="secondary" style={{ marginLeft: 12 }}>
                            ⏱️ Thời gian thực hiện: {detailModalService.duration}
                        </Text>
                    </div>

                    <Divider style={{ margin: "16px 0" }} />

                    <Title level={5} style={{ marginBottom: 12, color: "#1677ff" }}>
                        ✨ Lợi ích & Ưu điểm vượt trội:
                    </Title>
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 14, marginBottom: 20 }}>
                        {detailModalService.benefits.map((b, idx) => (
                            <div key={idx} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                <CheckOutlined style={{ color: "#52c41a", fontWeight: "bold" }} />
                                <Text style={{ fontSize: 14 }}>{b}</Text>
                            </div>
                        ))}
                    </div>

                    <Title level={5} style={{ marginBottom: 12, color: "#722ed1" }}>
                        📋 Quy trình thực hiện chi tiết từng bước:
                    </Title>
                    <div style={{ background: "#faf5ff", padding: 16, borderRadius: 14 }}>
                        {detailModalService.procedure.map((step, sIdx) => (
                            <Paragraph key={sIdx} style={{ marginBottom: 10, fontSize: 14, color: "#3b0764" }}>
                                {step}
                            </Paragraph>
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
}