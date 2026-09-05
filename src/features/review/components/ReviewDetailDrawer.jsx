import { useEffect, useState } from "react";

import {
    Drawer,
    Spin,
    Typography,
    Descriptions,
    Tag,
    Rate,
    message,
    Space
} from "antd";

import dayjs from "dayjs";

import { getAdminReviewByIdApi } from "../api/reviewAdminApi";

const { Title, Text } = Typography;

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

const SENTIMENT_LABELS = {
    positive: "TÍCH CỰC",
    negative: "TIÊU CỰC",
    neutral: "TRUNG TÍNH",
    mixed: "HỖN HỢP",
    pending: "CHỜ XỬ LÝ"
};

const STATUS_LABELS = {
    completed: "HOÀN TẤT",
    pending: "CHỜ XỬ LÝ",
    processing: "ĐANG XỬ LÝ",
    failed: "THẤT BẠI"
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

    const sentimentLabel = SENTIMENT_LABELS[String(sentimentValue).toLowerCase()] || String(sentimentValue).toUpperCase();

    return (
        <Drawer
            title="Chi tiết review"
            width={560}
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
                    <div style={{ marginBottom: 16 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            {review.title || "Không có tiêu đề"}
                        </Title>
                    </div>

                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        labelStyle={{ width: 140, fontWeight: 500, color: "#475569" }}
                    >
                        <Descriptions.Item label="Người dùng">
                            {review.userName || review.userId || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chi nhánh">
                            {review.branchName || review.branchId || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Đánh giá">
                            <Rate disabled value={review.rating || 0} style={{ fontSize: 13, color: "#f59e0b" }} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Phân tích AI">
                            <Tag color={sentimentColor} style={{ fontWeight: 600, borderRadius: 6, margin: 0 }}>
                                {sentimentLabel}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Độ tin cậy">
                            {formatConfidence(review.sentimentConfidence)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tạo lúc">
                            {formatDateTime(review.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Nội dung review">
                            <span style={{ whiteSpace: "pre-wrap" }}>
                                {review.content || review.comment || "-"}
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Phản hồi Salon">
                            {review.ownerReply ? (
                                <Text style={{ color: "#16a34a", fontWeight: 500, whiteSpace: "pre-wrap" }}>{review.ownerReply}</Text>
                            ) : (
                                <Text type="secondary">Chưa phản hồi</Text>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            ) : (
                <Text type="secondary">
                    Chưa có dữ liệu review.
                </Text>
            )}
        </Drawer>
    );
}
