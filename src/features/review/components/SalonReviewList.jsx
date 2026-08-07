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
    List,
    Image,
    Spin,
    Empty,
    Pagination
} from "antd";
import {
    StarFilled,
    MessageOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { getSalonReviewsApi, getSalonReviewSummaryApi } from "../api/reviewApi";

const { Title, Text, Paragraph } = Typography;

const SalonReviewList = ({ salonId }) => {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const pageSize = 5;

    useEffect(() => {
        if (!salonId) return;
        fetchSummary();
        fetchReviews(0);
    }, [salonId]);

    const fetchSummary = async () => {
        try {
            const data = await getSalonReviewSummaryApi(salonId);
            setSummary(data);
        } catch (err) {
            console.error("Lỗi khi tải thống kê review:", err);
        }
    };

    const fetchReviews = async (pageIndex) => {
        setLoading(true);
        try {
            const res = await getSalonReviewsApi(salonId, {
                page: pageIndex,
                size: pageSize,
                sort: "createdAt,desc"
            });
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

    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            fetchReviews(newPage - 1);
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
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = summary?.ratingDistribution?.[star] || 0;
                                const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                                return (
                                    <Row key={star} align="middle" gutter={12} style={{ fontSize: 13 }}>
                                        <Col style={{ width: 45, textAlign: "right" }}>
                                            <Text strong>{star} <StarFilled style={{ color: "#faad14", fontSize: 12 }} /></Text>
                                        </Col>
                                        <Col flex="1">
                                            <Progress
                                                percent={percent}
                                                strokeColor={{ "0%": "#ffc53d", "100%": "#fa8c16" }}
                                                trailColor="#f5f5f5"
                                                showInfo={false}
                                                size="small"
                                            />
                                        </Col>
                                        <Col style={{ width: 40, textAlign: "left" }}>
                                            <Text type="secondary">{count}</Text>
                                        </Col>
                                    </Row>
                                );
                            })}
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* REVIEW LIST HEADER */}
            <div>
                <Space style={{ marginBottom: 16 }}>
                    <MessageOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
                    <Title level={4} style={{ margin: 0 }}>Đánh giá từ khách hàng</Title>
                    <Tag color="blue" style={{ borderRadius: 12 }}>{totalElements} nhận xét</Tag>
                </Space>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Spin size="large" tip="Đang tải nhận xét..." />
                    </div>
                ) : reviews.length === 0 ? (
                    <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0", background: "#fafafa" }}>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">Chưa có đánh giá nào cho Salon này.</Text>}
                        />
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

                                        {rev.branchName && (
                                            <Col>
                                                <Tag color="cyan" style={{ borderRadius: 12 }}>
                                                    {rev.branchName}
                                                </Tag>
                                            </Col>
                                        )}
                                    </Row>

                                    {rev.comment && (
                                        <Paragraph style={{ margin: "8px 0", color: "#262626", fontSize: 14, lineHeight: 1.6 }}>
                                            {rev.comment}
                                        </Paragraph>
                                    )}

                                    {/* REVIEW PHOTOS */}
                                    {rev.photos && rev.photos.length > 0 && (
                                        <Space size="small" wrap style={{ marginTop: 12 }}>
                                            {rev.photos.map((photoUrl, pIdx) => (
                                                <Image
                                                    key={pIdx}
                                                    width={72}
                                                    height={72}
                                                    src={photoUrl}
                                                    style={{ borderRadius: 10, objectFit: "cover" }}
                                                />
                                            ))}
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
