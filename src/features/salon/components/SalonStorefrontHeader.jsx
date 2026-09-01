import { Card, Row, Col, Typography, Tag, Space, Button, Rate, Avatar } from "antd";
import {
  ShopOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  StarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

export default function SalonStorefrontHeader({ salon, branches = [] }) {
  const navigate = useNavigate();

  if (!salon) return null;

  const defaultCover = "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600";
  const defaultLogo = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=300";

  const primaryPhoto = salon.photos?.find(p => p.isPrimary || p.primary)?.url
    || salon.photos?.find(p => p.isPrimary || p.primary)?.photoUrl
    || salon.photos?.[0]?.url
    || salon.photos?.[0]?.photoUrl;

  const coverUrl = primaryPhoto || (typeof salon.logoUrl === "string" ? salon.logoUrl : null) || defaultCover;

  const displayRating = salon.rating ? Number(salon.rating).toFixed(1) : "5.0";

  return (
    <Card
      style={{
        borderRadius: 28,
        border: "none",
        overflow: "hidden",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.12)",
        marginBottom: 36,
        background: "#ffffff"
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* 🖼️ COVER BANNER SANG TRỌNG */}
      <div
        style={{
          height: 220,
          background: `linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%), url('${coverUrl}') center/cover no-repeat`,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "24px 32px"
        }}
      >
        <Tag
          color="gold"
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            borderRadius: 14,
            fontWeight: 700,
            padding: "4px 14px",
            fontSize: 14,
            boxShadow: "0 6px 16px rgba(0,0,0,0.2)"
          }}
        >
          <StarOutlined style={{ marginRight: 6 }} /> {displayRating}/5.0★ Thương Hiệu Uy Tín
        </Tag>
      </div>

      {/* 🏬 THÔNG TIN HỒ SƠ THƯƠNG HIỆU */}
      <div style={{ padding: "0 32px 28px", marginTop: -50, position: "relative" }}>
        <Row align="bottom" gutter={[24, 20]}>
          <Col>
            <Avatar
              size={100}
              src={salon.logoUrl || coverUrl || defaultLogo}
              style={{
                border: "4px solid #ffffff",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                backgroundColor: "#ffffff"
              }}
            />
          </Col>

          <Col flex="1">
            <div style={{ paddingTop: 10 }}>
              <Space size="small" align="center" wrap>
                <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
                  {salon.name}
                </Title>
                <Tag color="green" style={{ borderRadius: 10, fontWeight: 700, padding: "2px 10px" }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} /> Đang Hoạt Động
                </Tag>
              </Space>

              <Paragraph
                type="secondary"
                style={{ fontSize: 14, margin: "6px 0 12px 0", color: "#64748b", maxWidth: 750 }}
              >
                {salon.description || "Hệ thống Salon làm đẹp cao cấp chuyên tạo kiểu tóc, uốn nhuộm Hàn Quốc & chăm sóc sắc đẹp."}
              </Paragraph>

              <Space size="large" wrap style={{ fontSize: 13, color: "#475569" }}>
                {salon.phone && (
                  <span>
                    <PhoneOutlined style={{ color: "#10b981", marginRight: 6 }} />
                    Hotline: <strong>{salon.phone}</strong>
                  </span>
                )}
                {salon.email && (
                  <span>
                    <MailOutlined style={{ color: "#6366f1", marginRight: 6 }} />
                    {salon.email}
                  </span>
                )}
                {branches.length > 0 && (
                  <span>
                    <EnvironmentOutlined style={{ color: "#ef4444", marginRight: 6 }} />
                    <strong>{branches.length} Chi nhánh</strong> phục vụ
                  </span>
                )}
              </Space>
            </div>
          </Col>

          <Col xs={24} sm="auto">
            <Button
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              style={{
                borderRadius: 20,
                fontWeight: 700,
                height: 48,
                padding: "0 28px",
                background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                borderColor: "transparent",
                boxShadow: "0 8px 20px rgba(79, 70, 229, 0.35)"
              }}
              onClick={() => navigate(`/guest-booking?salonId=${salon.id}`)}
            >
              Đặt Lịch Ngay Tại Salon
            </Button>
          </Col>
        </Row>

        {/* 🏢 DANH SÁCH CHI NHÁNH DẠNG TAG */}
        {branches.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, marginRight: 12 }}>
              📍 Các Chi Nhánh:
            </Text>
            <Space wrap size={[8, 8]}>
              {branches.map((b) => (
                <Tag
                  key={b.id || b.branchId}
                  color="blue"
                  style={{ borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}
                >
                  <EnvironmentOutlined style={{ marginRight: 4 }} /> {b.name} ({b.address || "Chi nhánh chính"})
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </div>
    </Card>
  );
}
