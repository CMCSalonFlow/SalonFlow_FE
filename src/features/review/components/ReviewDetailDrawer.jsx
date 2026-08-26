import { useEffect, useState } from "react";

import {
    Drawer,
    Spin,
    Typography,
    Descriptions,
    Tag,
    Divider,
    message,
    Space
} from "antd";

import dayjs from "dayjs";

import { getAdminReviewByIdApi } from "../api/reviewAdminApi";

const { Title, Paragraph, Text } = Typography;

const SENTIMENT_COLORS = {
    positive: "green",
    negative: "red",
    neutral: "gold",
    mixed: "blue",
    pending: "default",
    processing: "blue",
    completed: "green",
    failed: "volcano"
};

const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : String(value);
};

const formatConfidence = (value) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
        return String(value);
    }

    if (numeric <= 1) {
        return `${(numeric * 100).toFixed(1)}%`;
    }

    return numeric.toFixed(2).replace(/\.00$/, "");
};

export default function ReviewDetailDrawer({ open, reviewId, onClose }) {
    const [loading, setLoading] = useState(false);
    const [review, setReview] = useState(null);

    useEffect(() => {
        const loadReview = async () => {
            if (!open || !reviewId) return;

            setLoading(true);
            try {
                const data = await getAdminReviewByIdApi(reviewId);
                setReview(data);
            } catch (error) {
                console.error(error);
                message.error(
                    error.response?.data?.message || "Không thể tải chi tiết review."
                );
                onClose();
            } finally {
                setLoading(false);
            }
        };

        loadReview();
    }, [open, reviewId, onClose]);

    const sentimentValue = review?.sentiment || "-";
    const sentimentColor =
        review?.sentimentBadgeColor ||
        SENTIMENT_COLORS[String(sentimentValue).toLowerCase()] ||
        "default";

    return (
        <Drawer
            title="Chi tiết review"
            width={760}
            open={open}
            onClose={onClose}
            destroyOnClose
        >
            {loading ? (
                <div style={{ textAlign: "center", padding: "96px 0" }}>
                    <Spin size="large" tip="Đang tải review..." />
                </div>
            ) : review ? (
                <div>
                    <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%", marginBottom: 16 }}
                    >
                        <Title level={4} style={{ margin: 0 }}>
                            {review.title || "Không có tiêu đề"}
                        </Title>
                        <Space wrap>
                            <Tag color={sentimentColor}>
                                {sentimentValue}
                            </Tag>
                            {review.sentimentStatus && (
                                <Tag>
                                    {review.sentimentStatus}
                                </Tag>
                            )}
                        </Space>
                    </Space>

                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                    >
                        <Descriptions.Item label="ID">
                            {review.id ?? "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người dùng">
                            {review.userName || review.userId || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi nhánh">
                            {review.branchName || review.branchId || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Đánh giá">
                            {review.rating ?? "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Độ tin cậy">
                            {formatConfidence(review.sentimentConfidence)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tạo lúc">
                            {formatDateTime(review.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Bình luận">
                            {review.comment || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phản hồi Salon">
                            {review.ownerReply || "-"}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Title level={5}>Nội dung review</Title>
                    <Paragraph
                        style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: 0
                        }}
                    >
                        {review.content || "-"}
                    </Paragraph>

                    {review.sentiment && (
                        <>
                            <Divider />
                            <Title level={5}>Sentiment</Title>
                            <Paragraph
                                style={{
                                    whiteSpace: "pre-wrap",
                                    marginBottom: 0
                                }}
                            >
                                {review.sentiment}
                            </Paragraph>
                        </>
                    )}
                </div>
            ) : (
                <Text type="secondary">
                    Chưa có dữ liệu review.
                </Text>
            )}
        </Drawer>
    );
}
