import React, { useState, useEffect } from "react";
import {
    Card,
    Row,
    Col,
    Rate,
    Progress,
    Avatar,
    Typography,
    Space,
    Tag,
    Image,
    Spin,
    Empty,
    Pagination,
    Button,
    Skeleton
} from "antd";
import {
    StarFilled,
    MessageOutlined,
    UserOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { getSalonReviewsApi, getSalonReviewSummaryApi } from "../api/reviewApi";

const { Title, Text, Paragraph } = Typography;

const ReviewItemImage = ({ src }) => {
    if (!src || typeof src !== "string") {
        return null;
    }

    return (
        <Image
            width={72}
            height={72}
            src={src}
            fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'><rect width='72' height='72' fill='%23e6f7ff' rx='10' stroke='%2391caff'/><text x='50%' y='42%' dominant-baseline='middle' text-anchor='middle' fill='%231677ff' font-size='20'>📷</text><text x='50%' y='70%' dominant-baseline='middle' text-anchor='middle' fill='%23595959' font-size='9' font-weight='bold'>Ảnh đính kèm</text></svg>"
            style={{ borderRadius: 10, objectFit: "cover" }}
        />
    );
};

const SalonReviewList = ({ salonId }) => {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedRating, setSelectedRating] = useState(null); // null = Tất cả, 5 = 5 sao, ...

    const pageSize = 5;

    useEffect(() => {
        if (!salonId) return;
        fetchSummary();
        fetchReviews(0, selectedRating);
    }, [salonId]);

    const fetchSummary = async () => {
        try {
            const data = await getSalonReviewSummaryApi(salonId);
            setSummary(data);
        } catch (err) {
            console.error("Lỗi khi tải thống kê review:", err);
        }
    };

    const fetchReviews = async (pageIndex, ratingParam = selectedRating) => {
        setLoading(true);
        try {
            const params = {
                page: pageIndex,
                size: pageSize,
                sort: "createdAt,desc"
            };
            if (ratingParam != null) {
                params.rating = ratingParam;
            }
            const res = await getSalonReviewsApi(salonId, params);
            setReviews(res.content || []);
            setTotalElements(res.totalElements || res.total || (res.content || []).length);
            setTotalPages(res.totalPages || 0);
            setPage(res.number || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách review:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingFilterChange = (star) => {
        setSelectedRating(star);
        fetchReviews(0, star);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            fetchReviews(newPage - 1, selectedRating);
        }
    };

    const avgRating = summary?.averageRating != null ? summary.averageRating : 0;
    const totalCount = summary?.totalReviews || 0;

    return (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* RATING SUMMARY HEADER CARD */}
            <Card
                style={{
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #fffbe6 0%, #fff1f0 50%, #f9f0ff 100%)",
                    border: "1px solid #ffe58f",
                    boxShadow: "0 4px 16px rgba(250, 173, 20, 0.08)"
                }}
                styles={{ body: { padding: "24px 32px" } }}
            >
                <Row align="middle" gutter={[32, 24]}>
                    {/* LEFT SCORE SUMMARY */}
                    <Col xs={24} md={8} style={{ textAlign: "center", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: 52, fontWeight: 800, color: "#fa8c16", lineHeight: 1.1 }}>
                            {avgRating ? avgRating.toFixed(1) : "0.0"}
                        </div>
                        <div style={{ margin: "8px 0" }}>
                            <Rate disabled allowHalf value={avgRating} style={{ fontSize: 20, color: "#faad14" }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                            Dựa trên {totalCount} lượt đánh giá thực tế
                        </Text>
                    </Col>

                    {/* RIGHT RATING BARS */}
                    <Col xs={24} md={16}>
                        <Space direction="vertical" style={{ width: "100%" }} size="xs">
                            {(() => {
                                const distValues = Object.values(summary?.ratingDistribution || {});
                                const totalDistCount = distValues.reduce((sum, val) => sum + Number(val), 0);

                                return [5, 4, 3, 2, 1].map((star) => {
                                    const count = summary?.ratingDistribution?.[star] || 0;
                                    const percent = totalDistCount > 0 ? Math.round((count / totalDistCount) * 100) : 0;

                                    return (
                                        <Row
                                            key={star}
                                            align="middle"
                                            gutter={12}
                                            style={{
                                                fontSize: 13,
                                                padding: "2px 0"
                                            }}
                                        >
                                            <Col style={{ width: 45, textAlign: "right" }}>
                                                <Text strong>
                                                    {star} <StarFilled style={{ color: "#faad14", fontSize: 12 }} />
                                                </Text>
                                            </Col>
                                            <Col flex="1">
                                                <Progress
                                                    percent={percent}
                                                    strokeColor={{ "0%": "#ffc53d", "100%": "#fa8c16" }}
                                                    railColor="#f5f5f5"
                                                    showInfo={false}
                                                    size="small"
                                                />
                                            </Col>
                                            <Col style={{ width: 40, textAlign: "left" }}>
                                                <Text type="secondary">{count}</Text>
                                            </Col>
                                        </Row>
                                    );
                                });
                            })()}
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* REVIEW LIST HEADER & RATING FILTER TABS */}
            <div>
                <Row justify="space-between" align="middle" style={{ marginBottom: 18 }}>
                    <Col>
                        <Space align="center">
                            <MessageOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
                            <Title level={4} style={{ margin: 0 }}>Đánh giá từ khách hàng</Title>
                            <Tag color="blue" style={{ borderRadius: 12 }}>{totalElements} nhận xét</Tag>
                        </Space>
                    </Col>

                    {/* STAR FILTER BUTTONS RESTYLED */}
                    <Col>
                        <Space wrap size="small">
                            <Button
                                shape="round"
                                style={{
                                    height: 34,
                                    padding: "0 18px",
                                    fontSize: 13,
                                    fontWeight: selectedRating === null ? 700 : 500,
                                    background: selectedRating === null ? "linear-gradient(135deg, #faad14 0%, #fa8c16 100%)" : "#fafafa",
                                    color: selectedRating === null ? "#fff" : "#595959",
                                    border: selectedRating === null ? "none" : "1px solid #d9d9d9",
                                    boxShadow: selectedRating === null ? "0 4px 14px rgba(250, 140, 22, 0.35)" : "none",
                                    transition: "all 0.3s ease"
                                }}
                                onClick={() => handleRatingFilterChange(null)}
                            >
                                Tất cả ({summary?.totalReviews || 0})
                            </Button>
                            {[5, 4, 3, 2, 1].map((star) => {
                                const cnt = summary?.ratingDistribution?.[star] || 0;
                                const isSelected = selectedRating === star;
                                return (
                                    <Button
                                        key={star}
                                        shape="round"
                                        style={{
                                            height: 34,
                                            padding: "0 16px",
                                            fontSize: 13,
                                            fontWeight: isSelected ? 700 : 500,
                                            background: isSelected ? "linear-gradient(135deg, #faad14 0%, #fa8c16 100%)" : "#fafafa",
                                            color: isSelected ? "#fff" : "#595959",
                                            border: isSelected ? "none" : "1px solid #d9d9d9",
                                            boxShadow: isSelected ? "0 4px 14px rgba(250, 140, 22, 0.35)" : "none",
                                            transition: "all 0.3s ease"
                                        }}
                                        onClick={() => handleRatingFilterChange(isSelected ? null : star)}
                                    >
                                        {star} <StarFilled style={{ color: isSelected ? "#fff" : "#faad14", fontSize: 12, marginRight: 4 }} /> ({cnt})
                                    </Button>
                                );
                            })}
                        </Space>
                    </Col>
                </Row>

                {loading ? (
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        {[1, 2, 3].map((key) => (
                            <Card
                                key={key}
                                style={{
                                    borderRadius: 16,
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                    border: "1px solid #f0f0f0"
                                }}
                                styles={{ body: { padding: 20 } }}
                            >
                                <Skeleton avatar paragraph={{ rows: 2 }} active />
                            </Card>
                        ))}
                    </Space>
                ) : reviews.length === 0 ? (
                    <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0", background: "#fafafa" }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Text type="secondary">
                                    {selectedRating != null
                                        ? `Chưa có đánh giá ${selectedRating} sao nào cho Salon này.`
                                        : "Chưa có đánh giá nào cho Salon này."}
                                </Text>
                            }
                        >
                            {selectedRating != null && (
                                <Button type="link" onClick={() => handleRatingFilterChange(null)}>
                                    Xem tất cả đánh giá
                                </Button>
                            )}
                        </Empty>
                    </Card>
                ) : (
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        <Image.PreviewGroup>
                            {reviews.map((rev) => (
                                <Card
                                    key={rev.id}
                                    style={{
                                        borderRadius: 16,
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                        border: "1px solid #f0f0f0"
                                    }}
                                    styles={{ body: { padding: 20 } }}
                                >
                                    <Row justify="space-between" align="top" style={{ marginBottom: 12 }}>
                                        <Col>
                                            <Space size="middle" align="center">
                                                <Avatar
                                                    size={44}
                                                    src={rev.customerAvatar}
                                                    icon={<UserOutlined />}
                                                    style={{ backgroundColor: "#1890ff" }}
                                                />
                                                <div>
                                                    <Space align="center">
                                                        <Text strong style={{ fontSize: 15 }}>
                                                            {rev.customerName || "Khách hàng"}
                                                        </Text>
                                                        <Tag color="green" style={{ borderRadius: 10, fontSize: 11 }}>
                                                            <CheckCircleOutlined /> Đã trải nghiệm
                                                        </Tag>
                                                    </Space>
                                                    <div style={{ marginTop: 2 }}>
                                                        <Space size="small">
                                                            <Rate disabled value={rev.rating} style={{ fontSize: 13, color: "#faad14" }} />
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                • {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("vi-VN") : "Gần đây"}
                                                            </Text>
                                                        </Space>
                                                    </div>
                                                </div>
                                            </Space>
                                        </Col>

                                        <Col>
                                            <Space size="small">
                                                {rev.staffName && (
                                                    <Tag color="purple" style={{ borderRadius: 12 }}>
                                                        Stylist: {rev.staffName}
                                                    </Tag>
                                                )}
                                                {rev.branchName && (
                                                    <Tag color="cyan" style={{ borderRadius: 12 }}>
                                                        {rev.branchName}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </Col>
                                    </Row>

                                    {rev.title && (
                                        <Text strong style={{ display: "block", fontSize: 15, color: "#1f1f1f", marginBottom: 4 }}>
                                            {rev.title}
                                        </Text>
                                    )}

                                    {rev.comment && (
                                        <Paragraph style={{ margin: "4px 0 8px 0", color: "#434343", fontSize: 14, lineHeight: 1.6 }}>
                                            {rev.comment}
                                        </Paragraph>
                                    )}

                                    {/* REVIEW PHOTOS */}
                                    {rev.photos && rev.photos.length > 0 && (
                                        <Space size="small" wrap style={{ marginTop: 12 }}>
                                            {rev.photos.map((item, pIdx) => {
                                                const url = typeof item === "string" ? item : item?.url || item?.photoUrl;
                                                return <ReviewItemImage key={pIdx} src={url} />;
                                            })}
                                        </Space>
                                    )}
                                </Card>
                            ))}
                        </Image.PreviewGroup>

                        {/* PAGINATION */}
                        {totalElements > pageSize && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Hiển thị {reviews.length} / tổng số {totalElements} đánh giá
                                </Text>
                                <Pagination
                                    current={page + 1}
                                    total={totalElements}
                                    pageSize={pageSize}
                                    onChange={handlePageChange}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </Space>
                )}
            </div>
        </Space>
    );
};

export default SalonReviewList;
