import { Card, Tag, Button, Typography, Space, Rate } from "antd";
import { ShopOutlined, EnvironmentOutlined, ArrowRightOutlined, StarOutlined, PhoneOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

export default function SalonCard({ salon, onSelectSalon }) {
  const navigate = useNavigate();

  if (!salon) return null;

  const primaryPhoto = salon.photos?.find(p => p.isPrimary || p.primary)?.url
    || salon.photos?.find(p => p.isPrimary || p.primary)?.photoUrl
    || salon.photos?.[0]?.url
    || salon.photos?.[0]?.photoUrl;

  const rawUrl = primaryPhoto || (typeof salon.logoUrl === "string" ? salon.logoUrl : null) || (typeof salon.logo === "string" ? salon.logo : salon.logo?.url);

  const isValidUrl = (url) => typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:"));
  const photoUrl = isValidUrl(rawUrl) ? rawUrl : null;

  return (
    <Card
      hoverable
      style={{
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid #f1f5f9"
      }}
      styles={{ body: { padding: 20, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" } }}
      cover={
        <div style={{ height: 180, overflow: "hidden", position: "relative", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {photoUrl ? (
            <img
              alt={salon.name}
              src={photoUrl}
              loading="eager"
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.06)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <ShopOutlined style={{ fontSize: 48, marginBottom: 8 }} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Chưa có hình ảnh</span>
            </div>
          )}
          <Tag
            color="gold"
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              borderRadius: 12,
              fontWeight: 700,
              padding: "2px 10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 2
            }}
          >
            <StarOutlined style={{ marginRight: 4 }} /> {salon.rating ? Number(salon.rating).toFixed(1) : "5.0"}/5★
          </Tag>
        </div>
      }
    >
      <div>
        <Title level={4} style={{ margin: "0 0 6px 0", color: "#1e1b4b", fontSize: 18, fontWeight: 700 }}>
          {salon.name}
        </Title>

        <Paragraph
          type="secondary"
          style={{ fontSize: 13, marginBottom: 12, height: 38, overflow: "hidden" }}
          ellipsis={{ rows: 2 }}
        >
          {salon.description || ""}
        </Paragraph>

        {salon.phone && (
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
            <PhoneOutlined style={{ marginRight: 6, color: "#10b981" }} />
            Hotline: {salon.phone}
          </Text>
        )}
      </div>

      <div>
        <Button
          type="primary"
          block
          shape="round"
          icon={<ArrowRightOutlined />}
          style={{
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            borderColor: "transparent",
            fontWeight: 700,
            height: 40,
            boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)"
          }}
          onClick={() => {
            if (onSelectSalon) {
              onSelectSalon(salon);
            } else {
              navigate(`/salons/${salon.id}`);
            }
          }}
        >
          Xem Chi Tiết Salon
        </Button>
      </div>
    </Card>
  );
}
