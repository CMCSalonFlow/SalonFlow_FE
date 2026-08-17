import React from "react";
import { Card, Typography, Space, Button, Tag, Rate, Avatar } from "antd";
import {
    EnvironmentOutlined,
    PhoneOutlined,
    CalendarOutlined,
    CompassOutlined,
    StarFilled,
    CheckCircleFilled
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

export default function NearbySalonCard({
    salon,
    isSelected = false,
    onSelect,
    onHover
}) {
    const navigate = useNavigate();

    const distanceDisplay =
        salon.distanceKm != null
            ? `${salon.distanceKm} km`
            : salon.distanceMeters != null
            ? `${Math.round(salon.distanceMeters)} m`
            : null;

    const handleBookNow = (e) => {
        e.stopPropagation();
        navigate(`/booking?branchId=${salon.branchId}`);
    };

    return (
        <Card
            hoverable
            onClick={() => onSelect && onSelect(salon)}
            onMouseEnter={() => onHover && onHover(salon)}
            onMouseLeave={() => onHover && onHover(null)}
            style={{
                marginBottom: 16,
                borderRadius: 16,
                border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                background: isSelected ? "#f0f9ff" : "#ffffff",
                boxShadow: isSelected
                    ? "0 8px 24px rgba(2, 132, 199, 0.15)"
                    : "0 2px 10px rgba(0,0,0,0.03)",
                transition: "all 0.25s ease",
                cursor: "pointer"
            }}
            bodyStyle={{ padding: "18px 20px" }}
        >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* Logo / Thumbnail */}
                <Avatar
                    src={salon.logoUrl}
                    size={64}
                    shape="square"
                    style={{
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
                        flexShrink: 0,
                        fontSize: 24,
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}
                >
                    {salon.salonName?.charAt(0) || "S"}
                </Avatar>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                        <div>
                            <Title
                                level={5}
                                style={{
                                    margin: 0,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    fontSize: 16,
                                    lineHeight: 1.3
                                }}
                            >
                                {salon.salonName}
                            </Title>
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: "#64748b",
                                    fontWeight: 600,
                                    display: "block",
                                    marginTop: 2
                                }}
                            >
                                🏬 {salon.branchName}
                            </Text>
                        </div>

                        {/* Distance Badge */}
                        {distanceDisplay && (
                            <Tag
                                color="blue"
                                icon={<EnvironmentOutlined />}
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    padding: "3px 10px",
                                    margin: 0,
                                    border: "none",
                                    background: "#e0f2fe",
                                    color: "#0284c7"
                                }}
                            >
                                Cách {distanceDisplay}
                            </Tag>
                        )}
                    </div>

                    {/* Rating & Reviews */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                        {salon.ratingAverage > 0 ? (
                            <Space size={4}>
                                <Rate
                                    disabled
                                    allowHalf
                                    value={Number(salon.ratingAverage)}
                                    style={{ fontSize: 13, color: "#f59e0b" }}
                                />
                                <Text strong style={{ color: "#b45309", fontSize: 13 }}>
                                    {Number(salon.ratingAverage).toFixed(1)}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    ({salon.ratingCount || 0} đánh giá)
                                </Text>
                            </Space>
                        ) : (
                            <Tag color="default" style={{ fontSize: 11, borderRadius: 6 }}>
                                Chưa có đánh giá
                            </Tag>
                        )}
                    </div>

                    {/* Address */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8 }}>
                        <CompassOutlined style={{ color: "#94a3b8", marginTop: 3, flexShrink: 0 }} />
                        <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.4 }}
                        >
                            {salon.address || "Đang cập nhật địa chỉ"}
                        </Paragraph>
                    </div>

                    {/* Phone & Actions */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 14,
                            paddingTop: 12,
                            borderTop: "1px solid #f1f5f9",
                            flexWrap: "wrap",
                            gap: 8
                        }}
                    >
                        {salon.branchPhone ? (
                            <Text style={{ fontSize: 12, color: "#64748b" }}>
                                <PhoneOutlined style={{ marginRight: 4, color: "#10b981" }} />
                                {salon.branchPhone}
                            </Text>
                        ) : (
                            <div />
                        )}

                        <Space size={8}>
                            <Button
                                size="small"
                                type="text"
                                style={{ fontSize: 12, color: "#0284c7", fontWeight: 600 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect && onSelect(salon);
                                }}
                            >
                                Xem trên map
                            </Button>
                            <Button
                                type="primary"
                                size="small"
                                icon={<CalendarOutlined />}
                                style={{
                                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                                    borderColor: "#0284c7",
                                    fontWeight: 600,
                                    borderRadius: 6,
                                    paddingLeft: 12,
                                    paddingRight: 12
                                }}
                                onClick={handleBookNow}
                            >
                                Đặt lịch
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </Card>
    );
}
