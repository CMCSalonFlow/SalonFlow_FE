import { useEffect, useState } from "react";
import {
    Drawer,
    Spin,
    Typography,
    Row,
    Col,
    Divider,
    Space,
    Tag,
    List,
    Image,
    message
} from "antd";
import {
    MailOutlined,
    PhoneOutlined,
    GlobalOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    PictureOutlined
} from "@ant-design/icons";
import { getSalonByIdApi } from "../api/salonApi";

const { Title, Paragraph, Text } = Typography;

const DAYS_OF_WEEK = [
    { key: 1, name: "Thứ Hai (Monday)" },
    { key: 2, name: "Thứ Ba (Tuesday)" },
    { key: 3, name: "Thứ Tư (Wednesday)" },
    { key: 4, name: "Thứ Năm (Thursday)" },
    { key: 5, name: "Thứ Sáu (Friday)" },
    { key: 6, name: "Thứ Bảy (Saturday)" },
    { key: 0, name: "Chủ Nhật (Sunday)" }
];

export default function SalonDetailDrawer({ open, salonId, onClose }) {
    const [loading, setLoading] = useState(false);
    const [salon, setSalon] = useState(null);

    useEffect(() => {
        const loadSalonDetails = async () => {
            if (!salonId || !open) return;
            setLoading(true);
            try {
                const data = await getSalonByIdApi(salonId);
                setSalon(data);
            } catch {
                message.error("Không thể tải thông tin chi tiết salon.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        loadSalonDetails();
    }, [salonId, open, onClose]);

    const primaryPhoto = salon?.photos?.find(p => p.isPrimary)?.url || (salon?.photos && salon?.photos[0]?.url);

    return (
        <Drawer
            title="Chi tiết Salon"
            width={700}
            onClose={onClose}
            open={open}
            destroyOnClose
        >
            {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
            ) : salon ? (
                <div>
                    {/* Header Image / Cover */}
                    <div
                        style={{
                            position: "relative",
                            height: 200,
                            backgroundColor: "#001529",
                            borderRadius: 12,
                            overflow: "hidden",
                            marginBottom: 20
                        }}
                    >
                        {primaryPhoto ? (
                            <img
                                src={primaryPhoto}
                                alt={salon.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                            />
                        ) : (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#fff" }}>
                                <PictureOutlined style={{ fontSize: 40, opacity: 0.5 }} />
                            </div>
                        )}
                        <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, color: "#fff" }}>
                            <Title level={3} style={{ color: "#fff", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
                                {salon.name}
                            </Title>
                            {salon.description && (
                                <Paragraph ellipsis={{ rows: 2 }} style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: "4px 0 0 0" }}>
                                    {salon.description}
                                </Paragraph>
                            )}
                        </div>
                    </div>

                    {/* Basic Info Details */}
                    <Title level={5} style={{ marginBottom: 15 }}>Thông tin cơ bản</Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={12} sm={8}>
                            <Space>
                                <PhoneOutlined style={{ color: "#1890ff" }} />
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Điện thoại</Text>
                                    <Text strong>{salon.phone || "Chưa cập nhật"}</Text>
                                </div>
                            </Space>
                        </Col>
                        <Col xs={12} sm={8}>
                            <Space>
                                <MailOutlined style={{ color: "#1890ff" }} />
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Email</Text>
                                    <Text strong style={{ wordBreak: "break-all" }}>{salon.email || "Chưa cập nhật"}</Text>
                                </div>
                            </Space>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Space>
                                <GlobalOutlined style={{ color: "#1890ff" }} />
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Website</Text>
                                    <div>
                                        {salon.website ? (
                                            <a href={salon.website} target="_blank" rel="noreferrer" style={{ fontWeight: "bold" }}>
                                                {salon.website.replace(/(^\w+:|^)\/\//, "")}
                                            </a>
                                        ) : (
                                            <Text strong>Chưa cập nhật</Text>
                                        )}
                                    </div>
                                </div>
                            </Space>
                        </Col>
                    </Row>

                    <Divider />



                    {/* Photo Gallery */}
                    <Title level={5} style={{ marginBottom: 15 }}>
                        <PictureOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Album hình ảnh
                    </Title>
                    <Row gutter={[8, 8]}>
                        {salon.photos?.map((photo, index) => (
                            <Col span={6} key={index}>
                                <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 100 }}>
                                    <Image
                                        src={photo.url}
                                        alt={`Salon Photo ${index}`}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        wrapperStyle={{ width: "100%", height: "100%" }}
                                    />
                                    {photo.isPrimary && (
                                        <Tag color="gold" style={{ position: "absolute", top: 4, left: 4, margin: 0, fontSize: 10, padding: "0 4px" }}>
                                            Chính
                                        </Tag>
                                    )}
                                </div>
                            </Col>
                        ))}
                        {(!salon.photos || salon.photos.length === 0) && (
                            <Col span={24}>
                                <div style={{ textAlign: "center", padding: "20px 0", color: "#bfbfbf", border: "1px dashed #d9d9d9", borderRadius: 8 }}>
                                    Chưa có hình ảnh nào cho salon này.
                                </div>
                            </Col>
                        )}
                    </Row>
                </div>
            ) : null}
        </Drawer>
    );
}
