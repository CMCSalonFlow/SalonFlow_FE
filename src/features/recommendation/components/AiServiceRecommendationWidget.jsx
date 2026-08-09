import { useEffect, useState } from "react";
import { Card, Tag, Button, Row, Col, Typography, Spin, Space, Tooltip } from "antd";
import { ThunderboltOutlined, FireOutlined, ClockCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getRecommendationsApi } from "../api/recommendationApi";

const { Title, Text, Paragraph } = Typography;

export default function AiServiceRecommendationWidget({ userId, branchId, limit = 5, onSelectService }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const params = { limit };
      if (userId) params.user_id = userId;
      if (branchId) params.branch_id = branchId;
      const res = await getRecommendationsApi(params);
      setData(res);
    } catch (err) {
      console.error("Lỗi khi lấy AI recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [userId, branchId, limit]);

  if (loading) {
    return (
      <Card style={{ borderRadius: 16, textAlign: "center", padding: "30px 0", marginBottom: 24 }}>
        <Spin size="large" tip="AI đang phân tích sở thích và gợi ý dịch vụ..." />
      </Card>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  const isAiRecommendation = data.algorithmUsed && data.algorithmUsed.includes("COLLABORATIVE_FILTERING");

  return (
    <Card
      style={{
        borderRadius: 16,
        background: isAiRecommendation
          ? "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)"
          : "#ffffff",
        borderColor: isAiRecommendation ? "#ddd6fe" : "#f0f0f0",
        boxShadow: isAiRecommendation
          ? "0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 8px 10px -6px rgba(124, 58, 237, 0.05)"
          : "0 4px 12px rgba(0,0,0,0.05)",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAiRecommendation ? (
            <div
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
                padding: "8px 10px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 20 }} />
            </div>
          ) : (
            <div
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#fff",
                padding: "8px 10px",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FireOutlined style={{ fontSize: 20 }} />
            </div>
          )}
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e1b4b" }}>
              {isAiRecommendation
                ? "🤖 Gợi Ý Dịch Vụ AI Dành Riêng Cho Bạn"
                : "🔥 Dịch Vụ Nổi Bật Được Yêu Thích Nhất"}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {isAiRecommendation
                ? "Dựa trên thuật toán Collaborative Filtering phân tích xu hướng của khách hàng tương tự"
                : "Danh sách dịch vụ phổ biến nhất hệ thống được nhiều khách hàng tin chọn"}
            </Text>
          </div>
        </div>

        <Space wrap>
          {data.abGroup && (
            <Tooltip title={`Nhóm A/B Test: ${data.abGroup} | Thuật toán: ${data.algorithmUsed}`}>
              <Tag color={data.abGroup === "TREATMENT" ? "purple" : "orange"} style={{ borderRadius: 6, fontWeight: 600 }}>
                {data.abGroup === "TREATMENT" ? "⚡ AI Collaborative Filter" : "🔥 Control Group (Popularity)"}
              </Tag>
            </Tooltip>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {data.recommendations.map((service) => (
          <Col xs={24} sm={12} md={8} lg={4} key={service.serviceId} style={{ display: "flex" }}>
            <Card
              hoverable
              size="small"
              style={{
                borderRadius: 12,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderColor: "#e2e8f0",
                overflow: "hidden",
              }}
              bodyStyle={{ padding: 12, display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}
            >
              <div>
                {service.imageUrl && (
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                  />
                )}
                <Text strong style={{ fontSize: 14, display: "block", marginBottom: 4, lineHeight: "1.3" }} ellipsis={{ tooltip: service.name }}>
                  {service.name}
                </Text>

                {service.categoryName && (
                  <Tag color="blue" style={{ fontSize: 11, padding: "0 6px", marginBottom: 6 }}>
                    {service.categoryName}
                  </Tag>
                )}

                <Paragraph
                  type="secondary"
                  style={{ fontSize: 12, marginBottom: 8, height: 36, overflow: "hidden" }}
                  ellipsis={{ rows: 2 }}
                >
                  {service.description || service.reason || "Dịch vụ chất lượng hàng đầu"}
                </Paragraph>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ fontWeight: 700, color: "#4f46e5", fontSize: 15 }}>
                    {Number(service.price || 0).toLocaleString("vi-VN")} đ
                  </Text>
                  {service.durationMinutes && (
                    <Text type="secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                      <ClockCircleOutlined style={{ fontSize: 12 }} /> {service.durationMinutes} ph
                    </Text>
                  )}
                </div>

                <Button
                  type="primary"
                  block
                  size="small"
                  icon={<ArrowRightOutlined />}
                  style={{
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                    borderColor: "transparent",
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    if (onSelectService) {
                      onSelectService(service);
                    } else {
                      navigate(`/booking?serviceId=${service.serviceId}`);
                    }
                  }}
                >
                  Đặt Ngay
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
