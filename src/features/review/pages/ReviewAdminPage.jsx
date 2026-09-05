import { useEffect, useMemo, useState } from "react";

import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
    Modal,
    Rate,
    Tooltip,
    message
} from "antd";
import { EyeOutlined, FlagOutlined, RobotOutlined, ReloadOutlined, MessageOutlined, SmileOutlined, MehOutlined, FrownOutlined } from "@ant-design/icons";

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

const SENTIMENT_LABELS = {
    positive: "TÍCH CỰC",
    negative: "TIÊU CỰC",
    neutral: "TRUNG TÍNH",
    mixed: "HỖN HỢP",
    pending: "CHỜ XỬ LÝ"
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

    const candidateKeys = [
        {
            key: "totalReviews",
            altKey: "total",
            label: "Tổng review",
            color: "#1d4ed8",
            bgColor: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            borderColor: "#bfdbfe",
            icon: <MessageOutlined style={{ fontSize: 20, color: "#2563eb" }} />
        },
        {
            key: "positiveCount",
            altKey: "positive",
            label: "Tích cực",
            color: "#15803d",
            bgColor: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            borderColor: "#bbf7d0",
            icon: <SmileOutlined style={{ fontSize: 20, color: "#16a34a" }} />
        },
        {
            key: "neutralCount",
            altKey: "neutral",
            label: "Trung tính",
            color: "#b45309",
            bgColor: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            borderColor: "#fde68a",
            icon: <MehOutlined style={{ fontSize: 20, color: "#d97706" }} />
        },
        {
            key: "negativeCount",
            altKey: "negative",
            label: "Tiêu cực",
            color: "#b91c1c",
            bgColor: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            borderColor: "#fecaca",
            icon: <FrownOutlined style={{ fontSize: 20, color: "#dc2626" }} />
        }
    ];

    const cards = [];
    candidateKeys.forEach((item) => {
        const val = summary[item.key] !== undefined ? summary[item.key] : summary[item.altKey];
        if (val !== undefined && val !== null) {
            cards.push({
                label: item.label,
                value: val,
                color: item.color,
                bgColor: item.bgColor,
                borderColor: item.borderColor,
                icon: item.icon
            });
        }
    });

    return cards;
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
            title: "Nhận xét",
            dataIndex: "content",
            width: 250,
            render: (_, record) => {
                const textContent = record.content || record.comment || record.title || "Chưa có nội dung nhận xét";
                return (
                    <div style={{ maxWidth: 230 }}>
                        {record.title && (
                            <Text strong ellipsis style={{ display: "block", color: "#0f172a", marginBottom: 2 }}>
                                {record.title}
                            </Text>
                        )}
                        <Text type="secondary" ellipsis style={{ fontSize: 13, display: "block" }}>
                            {textContent}
                        </Text>
                    </div>
                );
            }
        },
        {
            title: "Khách hàng & Chi nhánh",
            dataIndex: "userName",
            width: 170,
            render: (_, record) => (
                <div style={{ whiteSpace: "nowrap" }}>
                    <Text strong style={{ display: "block", color: "#334155" }}>
                        {record.userName ? record.userName : record.userId ? `Khách #${record.userId}` : "Khách ẩn danh"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.branchName ? `📍 ${record.branchName}` : "---"}
                    </Text>
                </div>
            )
        },
        {
            title: "Đánh giá",
            dataIndex: "rating",
            width: 125,
            render: (value) => (
                <Rate disabled value={value || 0} style={{ fontSize: 12, color: "#f59e0b", whiteSpace: "nowrap" }} />
            )
        },
        {
            title: "Phân tích AI",
            dataIndex: "sentiment",
            width: 140,
            render: (_, record) => {
                const rawVal = String(record.sentiment || "PENDING").toLowerCase();
                const label = SENTIMENT_LABELS[rawVal] || String(record.sentiment || "CHỜ PHÂN TÍCH").toUpperCase();
                const color = record.sentimentBadgeColor || SENTIMENT_COLORS[rawVal] || "default";
                const confidenceText = formatConfidence(record.sentimentConfidence);
                return (
                    <div style={{ whiteSpace: "nowrap" }}>
                        <Tag color={color} style={{ fontWeight: 600, borderRadius: 6, margin: 0 }}>
                            {label}
                        </Tag>
                        {confidenceText !== "-" && (
                            <div style={{ marginTop: 2 }}>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    Độ tin cậy: <span style={{ fontWeight: 600, color: "#475569" }}>{confidenceText}</span>
                                </Text>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: "Phản hồi Salon",
            dataIndex: "ownerReply",
            width: 130,
            render: (value) => {
                if (value) {
                    return (
                        <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
                            ✓ Đã phản hồi
                        </Tag>
                    );
                }
                return (
                    <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>
                        Chưa phản hồi
                    </Tag>
                );
            }
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            width: 100,
            render: (value) => (
                <Text style={{ fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>
                    {value ? dayjs(value).format("DD/MM/YYYY") : "---"}
                </Text>
            )
        },
        {
            title: "Thao tác",
            key: "action",
            width: 160,
            align: "center",
            render: (_, record) => (
                <Space size={2} style={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined style={{ color: "#2563eb" }} />}
                            onClick={() => {
                                setSelectedReviewId(record.id);
                                setDrawerOpen(true);
                            }}
                        >
                            Xem
                        </Button>
                    </Tooltip>
                    <Tooltip title={record.ownerReply ? "Đã phản hồi" : "Trả lời review"}>
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
                            Phản hồi
                        </Button>
                    </Tooltip>
                    <Tooltip title="Báo cáo vi phạm">
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<FlagOutlined />}
                            onClick={() => {
                                setTargetReview(record);
                                setReportReason("");
                                setReportModalOpen(true);
                            }}
                        />
                    </Tooltip>
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

            <Spin spinning={summaryLoading}>
                <Row gutter={[16, 16]}>
                    {summaryCards.length > 0 ? (
                        summaryCards.map((item) => (
                            <Col xs={12} sm={12} md={6} lg={6} key={item.label}>
                                <Card
                                    size="small"
                                    bordered
                                    style={{
                                        background: item.bgColor,
                                        borderColor: item.borderColor,
                                        borderRadius: 16,
                                        boxShadow: "0 4px 14px rgba(0,0,0,0.03)"
                                    }}
                                    bodyStyle={{ padding: "16px 20px" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <Text style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>
                                            {item.label}
                                        </Text>
                                        {item.icon}
                                    </div>
                                    <Title level={2} style={{ margin: 0, color: item.color, fontWeight: 800 }}>
                                        {item.value}
                                    </Title>
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
            </Spin>

            <Card bodyStyle={{ padding: "16px 20px" }}>
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
                            style={{ width: 220 }}
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

                        <Select
                            allowClear
                            placeholder="Cảm xúc (Sentiment)"
                            style={{ width: 180 }}
                            value={sentiment || undefined}
                            onChange={(value) => {
                                setSentiment(value || "");
                                loadReviews({ page: 1, sentiment: value || "" });
                            }}
                            options={[
                                { value: "positive", label: "Tích cực" },
                                { value: "negative", label: "Tiêu cực" },
                                { value: "neutral", label: "Trung tính" }
                            ]}
                        />

                        <Input.Search
                            allowClear
                            placeholder="Tìm theo tiêu đề, nội dung, khách hàng..."
                            style={{ width: 320 }}
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
                                icon={<RobotOutlined />}
                                onClick={handleTriggerAiReview}
                                loading={triggerAiLoading}
                            >
                                Trigger AI review
                            </Button>
                        )}
                        <Button icon={<ReloadOutlined />} onClick={handleReset}>Đặt lại</Button>
                    </Space>
                </Space>
            </Card>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={reviews}
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                />
            </Card>

            <ReviewDetailDrawer
                open={drawerOpen}
                reviewId={selectedReviewId}
                onClose={() => setDrawerOpen(false)}
                afterOpenChange={(isOpen) => {
                    if (!isOpen) setSelectedReviewId(null);
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