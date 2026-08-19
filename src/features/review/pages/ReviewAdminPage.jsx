import { useEffect, useMemo, useState } from "react";

import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    Modal,
    message
} from "antd";

import dayjs from "dayjs";

import { getBranchesApi } from "@/features/branch/api/branchApi";
import { getRoles } from "@/core/utils/auth";
import ROLES from "@/core/constants/roles";
import {
    getAdminReviewSummaryApi,
    getAdminReviewsApi,
    triggerOwnerReviewAiApi
} from "../api/reviewAdminApi";
import { replyReviewApi, reportReviewApi } from "../api/reviewReportApi";
import ReviewDetailDrawer from "../components/ReviewDetailDrawer";
import { getMySalonApi } from "@/features/salon/api/salonApi";

const { Title, Text, Paragraph } = Typography;

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
    if (value === null || value === undefined || value === "") return "-";

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return String(value);

    if (numeric <= 1) {
        return `${(numeric * 100).toFixed(1)}%`;
    }

    return numeric.toFixed(2).replace(/\.00$/, "");
};

const normalizePageData = (data) => {
    if (Array.isArray(data)) {
        return {
            content: data,
            totalElements: data.length,
            size: data.length,
            number: 0,
            totalPages: 1
        };
    }

    return data || {
        content: [],
        totalElements: 0,
        size: 10,
        number: 0,
        totalPages: 0
    };
};

const pickSummaryCards = (summary) => {
    if (!summary || typeof summary !== "object") {
        return [];
    }

    const candidates = [
        { key: "totalReviews", label: "Tổng review", color: "blue" },
        { key: "total", label: "Tổng review", color: "blue" },
        { key: "positiveCount", label: "Tích cực", color: "green" },
        { key: "positive", label: "Tích cực", color: "green" },
        { key: "neutralCount", label: "Trung tính", color: "gold" },
        { key: "neutral", label: "Trung tính", color: "gold" },
        { key: "negativeCount", label: "Tiêu cực", color: "red" },
        { key: "negative", label: "Tiêu cực", color: "red" },
        { key: "pendingCount", label: "Chờ xử lý", color: "default" },
        { key: "pending", label: "Chờ xử lý", color: "default" },
        { key: "analyzedCount", label: "Đã phân tích", color: "cyan" },
        { key: "completedCount", label: "Hoàn tất", color: "green" },
        { key: "failedCount", label: "Lỗi", color: "volcano" },
        { key: "averageRating", label: "Điểm trung bình", color: "purple" }
    ];

    const cards = [];
    const seen = new Set();

    candidates.forEach((item) => {
        const value = summary[item.key];
        if (value === undefined || value === null || seen.has(item.key)) {
            return;
        }

        seen.add(item.key);
        cards.push({
            label: item.label,
            value,
            color: item.color
        });
    });

    if (cards.length > 0) {
        return cards;
    }

    return Object.entries(summary)
        .filter(([, value]) => typeof value === "number")
        .map(([key, value]) => ({
            label: key,
            value,
            color: "blue"
        }));
};

export default function ReviewAdminPage() {
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [triggerAiLoading, setTriggerAiLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [branches, setBranches] = useState([]);
    const [salonId, setSalonId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedReviewId, setSelectedReviewId] = useState(null);

    const [branchId, setBranchId] = useState(undefined);
    const [sentiment, setSentiment] = useState("");
    const [searchText, setSearchText] = useState("");
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Modals for Owner Reply & Report
    const [targetReview, setTargetReview] = useState(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const isSalonOwner = getRoles().includes(ROLES.SALON_OWNER);

    const handleReplySubmit = async () => {
        if (!replyContent || !replyContent.trim()) {
            message.warning("Vui lòng nhập nội dung phản hồi");
            return;
        }
        setSubmitting(true);
        try {
            await replyReviewApi(targetReview.id, replyContent.trim());
            message.success("Đã đăng phản hồi cho đánh giá thành công!");
            setReplyModalOpen(false);
            setReplyContent("");
            setTargetReview(null);
            loadReviews({ page: pagination.current });
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không thể phản hồi đánh giá.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTriggerAiReview = async () => {
        setTriggerAiLoading(true);
        try {
            await triggerOwnerReviewAiApi();
            message.success("Đã gửi yêu cầu trigger AI review.");
            await Promise.all([
                loadReviews({ page: pagination.current }),
                loadSummary(branchId)
            ]);
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không thể trigger AI review.");
        } finally {
            setTriggerAiLoading(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!reportReason || !reportReason.trim()) {
            message.warning("Vui lòng nhập lý do báo cáo vi phạm");
            return;
        }
        setSubmitting(true);
        try {
            await reportReviewApi(targetReview.id, reportReason.trim());
            message.success("Đã gửi báo cáo vi phạm tới Admin duyệt thành công!");
            setReportModalOpen(false);
            setReportReason("");
            setTargetReview(null);
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || "Không thể gửi báo cáo vi phạm.");
        } finally {
            setSubmitting(false);
        }
    };

    const loadBranches = async () => {
        try {
            const data = await getBranchesApi();
            setBranches(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách chi nhánh.");
        }
    };

    const loadSummary = async (selectedBranchId) => {
        setSummaryLoading(true);
        try {
            const data = await getAdminReviewSummaryApi(selectedBranchId);
            setSummary(data);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải thống kê review.");
        } finally {
            setSummaryLoading(false);
        }
    };

    const loadReviews = async (options = {}) => {
        const nextPage = options.page ?? pagination.current;
        const nextSize = options.pageSize ?? pagination.pageSize;
        const nextBranchId = options.branchId !== undefined ? options.branchId : branchId;
        const nextSentiment = options.sentiment !== undefined ? options.sentiment : sentiment;
        const nextQuery = options.query !== undefined ? options.query : searchText;

        setLoading(true);
        try {
            const params = {
                page: nextPage - 1,
                size: nextSize
            };

            if (nextBranchId) {
                params.branchId = nextBranchId;
            }

            if (nextSentiment && nextSentiment.trim()) {
                params.sentiment = nextSentiment.trim();
            }

            if (nextQuery && nextQuery.trim()) {
                params.q = nextQuery.trim();
            }

            const data = await getAdminReviewsApi(params);
            const pageData = normalizePageData(data);
            const content = pageData.content || pageData.items || [];
            const nextPageNumber =
                pageData.number ??
                pageData.pageNumber ??
                pageData.pageable?.pageNumber ??
                nextPage - 1;
            const nextPageSize =
                pageData.size ??
                pageData.pageable?.pageSize ??
                nextSize;
            const nextTotal =
                pageData.totalElements ??
                pageData.total ??
                content.length;

            setReviews(content);
            setPagination({
                current: nextPageNumber + 1,
                pageSize: nextPageSize,
                total: nextTotal
            });
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách review.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBranches();
        loadReviews({ page: 1, pageSize: 10 });
        getMySalonApi()
            .then((data) => setSalonId(data?.id || null))
            .catch((err) => console.error("Không lấy được thông tin salon:", err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadSummary(branchId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId]);

    const summaryCards = useMemo(() => pickSummaryCards(summary), [summary]);

    const handleSearch = () => {
        loadReviews({ page: 1, query: searchText });
    };

    const handleReset = () => {
        setBranchId(undefined);
        setSentiment("");
        setSearchText("");
        loadReviews({ page: 1, branchId: undefined, sentiment: "", query: "" });
    };

    const handleTableChange = (nextPagination) => {
        loadReviews({ page: nextPagination.current, pageSize: nextPagination.pageSize });
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            width: 90
        },
        {
            title: "Khách hàng",
            dataIndex: "userName",
            render: (_, record) =>
                record.userName
                    ? `${record.userName} (#${record.userId || "-"})`
                    : record.userId || "-"
        },
        {
            title: "Chi nhánh",
            dataIndex: "branchName",
            render: (_, record) =>
                record.branchName
                    ? `${record.branchName} (#${record.branchId || "-"})`
                    : record.branchId || "-"
        },
        {
            title: "Rating",
            dataIndex: "rating",
            width: 110,
            render: (value) =>
                value === undefined || value === null ? "-" : `${value}/5`
        },
        {
            title: "Sentiment",
            dataIndex: "sentiment",
            render: (value, record) => {
                const sentimentValue = value || "-";
                const color =
                    record.sentimentBadgeColor ||
                    SENTIMENT_COLORS[String(sentimentValue).toLowerCase()] ||
                    "default";

                return <Tag color={color}>{sentimentValue}</Tag>;
            }
        },
        {
            title: "Độ tin cậy",
            dataIndex: "sentimentConfidence",
            width: 130,
            render: (value) => formatConfidence(value)
        },
        {
            title: "Trạng thái",
            dataIndex: "sentimentStatus",
            render: (value) => (value ? <Tag>{value}</Tag> : "-")
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            ellipsis: true
        },
        {
            title: "Nội dung",
            dataIndex: "content",
            ellipsis: true,
            render: (value) => value || "-"
        },
        {
            title: "Bình luận",
            dataIndex: "comment",
            ellipsis: true,
            render: (value) => value || "-"
        },
        {
            title: "Phản hồi Salon",
            dataIndex: "ownerReply",
            ellipsis: true,
            render: (value) => {
                if (value) {
                    return <Tag color="blue">💬 {value}</Tag>;
                }
                return <Text type="secondary" style={{ fontSize: 12 }}>Chưa phản hồi</Text>;
            }
        },
        {
            title: "Tạo lúc",
            dataIndex: "createdAt",
            width: 150,
            render: (value) => formatDateTime(value)
        },
        {
            title: "Thao tác",
            key: "action",
            width: 220,
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            setSelectedReviewId(record.id);
                            setDrawerOpen(true);
                        }}
                    >
                        Xem
                    </Button>
                    <Button
                        type="primary"
                        ghost
                        size="small"
                        disabled={!!record.ownerReply}
                        onClick={() => {
                            setTargetReview(record);
                            setReplyContent("");
                            setReplyModalOpen(true);
                        }}
                    >
                        {record.ownerReply ? "Đã trả lời" : "Phản hồi"}
                    </Button>
                    <Button
                        danger
                        type="dashed"
                        size="small"
                        onClick={() => {
                            setTargetReview(record);
                            setReportReason("");
                            setReportModalOpen(true);
                        }}
                    >
                        Báo cáo
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Title level={3} style={{ marginBottom: 4 }}>
                    Quản lý & Phân tích Đánh giá
                </Title>
                <Text type="secondary">
                    Theo dõi, phản hồi review của khách hàng và xem báo cáo phân tích rating chi tiết.
                </Text>
            </div>

            <Card loading={summaryLoading}>
                <Row gutter={[16, 16]}>
                    {summaryCards.length > 0 ? (
                        summaryCards.map((item) => (
                            <Col xs={12} sm={8} lg={6} key={item.label}>
                                <Card
                                    size="small"
                                    bordered
                                    style={{
                                        borderColor: "#f0f0f0",
                                        borderRadius: 12
                                    }}
                                >
                                    <Statistic
                                        title={item.label}
                                        value={item.value}
                                        valueStyle={{
                                            color: item.color === "default" ? undefined : item.color
                                        }}
                                    />
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <Col span={24}>
                            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                Chưa có dữ liệu thống kê review.
                            </Paragraph>
                        </Col>
                    )}
                </Row>
            </Card>

            <Card>
                <Space
                    wrap
                    style={{
                        width: "100%",
                        justifyContent: "space-between"
                    }}
                >
                    <Space wrap>
                        <Select
                            allowClear
                            placeholder="Chọn chi nhánh"
                            style={{ width: 240 }}
                            value={branchId}
                            onChange={(value) => {
                                setBranchId(value);
                                loadReviews({ page: 1, branchId: value });
                            }}
                            options={branches.map((branch) => ({
                                value: branch.id,
                                label: branch.name
                            }))}
                        />

                        <Input
                            allowClear
                            placeholder="Nhập sentiment"
                            style={{ width: 220 }}
                            value={sentiment}
                            onChange={(e) => setSentiment(e.target.value)}
                        />

                        <Input.Search
                            allowClear
                            placeholder="Tìm theo tiêu đề, nội dung, khách hàng..."
                            style={{ width: 360 }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onSearch={handleSearch}
                        />
                    </Space>

                    <Space>
                        {isSalonOwner && (
                            <Button
                                type="primary"
                                ghost
                                onClick={handleTriggerAiReview}
                                loading={triggerAiLoading}
                            >
                                Trigger AI review
                            </Button>
                        )}
                        <Button onClick={handleReset}>Đặt lại</Button>
                        <Button type="primary" onClick={handleSearch}>
                            Tìm kiếm
                        </Button>
                    </Space>
                </Space>
            </Card>

            <Card>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={reviews}
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1500 }}
                />
            </Card>

            <ReviewDetailDrawer
                open={drawerOpen}
                reviewId={selectedReviewId}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedReviewId(null);
                }}
            />

            {/* Modal Phản hồi đánh giá (Salon Owner - 1 reply per review) */}
            <Modal
                title={`Phản hồi đánh giá #${targetReview?.id || ""}`}
                open={replyModalOpen}
                onOk={handleReplySubmit}
                confirmLoading={submitting}
                onCancel={() => setReplyModalOpen(false)}
                okText="Đăng phản hồi"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <Text type="secondary">Nội dung đánh giá của khách:</Text>
                        <div style={{ background: "#f5f5f5", padding: "8px 12px", borderRadius: 6, marginTop: 4 }}>
                            "{targetReview?.content || "Không có nội dung"}"
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Nội dung phản hồi của Salon (Chỉ được phản hồi 1 lần duy nhất):</label>
                        <Input.TextArea
                            rows={4}
                            placeholder="Cảm ơn quý khách đã ghé Salon..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal Báo cáo vi phạm (Salon Owner / User) */}
            <Modal
                title={`Báo cáo vi phạm đánh giá #${targetReview?.id || ""}`}
                open={reportModalOpen}
                onOk={handleReportSubmit}
                confirmLoading={submitting}
                onCancel={() => setReportModalOpen(false)}
                okText="Gửi báo cáo"
                okButtonProps={{ danger: true }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <Text type="secondary">Nội dung đánh giá bị báo cáo:</Text>
                        <div style={{ background: "#fff1f0", padding: "8px 12px", borderRadius: 6, marginTop: 4, border: "1px solid #ffccc7" }}>
                            "{targetReview?.content || "Không có nội dung"}"
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Lý do báo cáo vi phạm:</label>
                        <Input.TextArea
                            rows={4}
                            placeholder="Mô tả lý do vi phạm (Ví dụ: Chứa từ ngữ thô tục, xúc phạm nhân viên, sai sự thật...)"
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}