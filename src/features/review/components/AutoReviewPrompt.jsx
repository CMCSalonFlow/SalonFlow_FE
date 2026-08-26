import React, { useEffect, useState } from "react";
import { Card, Button, Typography, Space, Tag } from "antd";
import { StarFilled, CloseOutlined, RightOutlined, SmileOutlined } from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getBookingsByBranchApi } from "@/features/booking/api/bookingApi";
import ReviewModal from "./ReviewModal";

const { Text, Title } = Typography;

const getStoredUserId = () => {
    const rawUserId = localStorage.getItem("userId");
    if (rawUserId) return String(rawUserId);
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
        try {
            const parsed = JSON.parse(rawUser);
            if (parsed?.id) return String(parsed.id);
        } catch (e) {}
    }
    return null;
};

export default function AutoReviewPrompt() {
    const [pendingBooking, setPendingBooking] = useState(null);
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const checkPendingReviewBookings = async () => {
        const currentUserId = getStoredUserId();
        if (!currentUserId) return;

        try {
            const branches = await getMyBranchesApi().catch(() => []);
            if (!branches || branches.length === 0) return;

            const bookingPromises = branches.map((branch) =>
                getBookingsByBranchApi(branch.id).catch(() => [])
            );

            const allResults = await Promise.all(bookingPromises);
            const allBookings = allResults.flat();

            // Lọc CHÍNH XÁC các lịch hẹn thuộc về duy nhất tài khoản khách hàng đang đăng nhập
            const unreviewedBooking = allBookings.find((b) => {
                const isMyBooking =
                    String(b.customerId) === currentUserId ||
                    String(b.userId) === currentUserId ||
                    String(b.customer?.id) === currentUserId ||
                    String(b.user?.id) === currentUserId;

                const isCompleted = b.status === "COMPLETED";
                const notReviewed = !b.reviewedAt;
                const notDismissed = !sessionStorage.getItem(`dismissed_review_${b.id}`);

                return isMyBooking && isCompleted && notReviewed && notDismissed;
            });

            if (unreviewedBooking) {
                setPendingBooking(unreviewedBooking);
                setIsPromptVisible(true);
            }
        } catch (err) {
            console.error("Lỗi kiểm tra lịch hẹn chưa đánh giá:", err);
        }
    };

    useEffect(() => {
        // Kiểm tra ngay sau 1.5s khi load trang
        const timer = setTimeout(() => {
            checkPendingReviewBookings();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleDismissPrompt = () => {
        if (pendingBooking) {
            sessionStorage.setItem(`dismissed_review_${pendingBooking.id}`, "true");
        }
        setIsPromptVisible(false);
    };

    const handleStartReview = () => {
        setIsPromptVisible(false);
        setIsReviewModalOpen(true);
    };

    const handleReviewSuccess = (reviewedId) => {
        setIsReviewModalOpen(false);
        const targetId = reviewedId || pendingBooking?.id;
        if (targetId) {
            sessionStorage.setItem(`dismissed_review_${targetId}`, "true");
            window.dispatchEvent(new CustomEvent("booking_reviewed", { detail: { bookingId: targetId } }));
        }
        setPendingBooking(null);
    };

    if (!pendingBooking) return null;

    return (
        <>
            {/* Popup Thông báo nhắc nhở tự động góc phải màn hình */}
            {isPromptVisible && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 28,
                        right: 28,
                        zIndex: 9999,
                        maxWidth: 420,
                        width: "calc(100vw - 56px)",
                        animation: "slideInUp 0.4s ease-out"
                    }}
                >
                    <Card
                        style={{
                            borderRadius: 18,
                            boxShadow: "0 12px 35px rgba(250, 140, 22, 0.22), 0 4px 15px rgba(0,0,0,0.08)",
                            border: "2px solid #ffe58f",
                            background: "linear-gradient(135deg, #ffffff 0%, #fffbe6 100%)",
                            overflow: "hidden"
                        }}
                        bodyStyle={{ padding: "18px 20px" }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#ffffff",
                                        fontSize: 20,
                                        boxShadow: "0 4px 10px rgba(250, 140, 22, 0.4)"
                                    }}
                                >
                                    <StarFilled />
                                </div>
                                <div>
                                    <Title level={5} style={{ margin: 0, color: "#262626", fontWeight: 700 }}>
                                        Bạn vừa hoàn thành dịch vụ!
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {pendingBooking.branchName || "Chi nhánh Salon"} • Mã #{pendingBooking.id}
                                    </Text>
                                </div>
                            </div>

                            <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined style={{ color: "#8c8c8c" }} />}
                                onClick={handleDismissPrompt}
                                style={{ marginTop: -4, marginRight: -8 }}
                            />
                        </div>

                        <div style={{ marginBottom: 14, background: "rgba(255, 255, 255, 0.7)", padding: "10px 12px", borderRadius: 10, border: "1px dashed #ffe58f" }}>
                            <Text style={{ fontSize: 13, color: "#595959", display: "block" }}>
                                <SmileOutlined style={{ color: "#fa8c16", marginRight: 6 }} />
                                Hãy dành 30 giây chia sẻ cảm nhận của bạn để giúp salon nâng cao chất lượng nhé.
                            </Text>
                        </div>

                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <Button
                                size="middle"
                                onClick={handleDismissPrompt}
                                style={{ borderRadius: 8, fontSize: 13, fontWeight: 500 }}
                            >
                                Để sau
                            </Button>

                            <Button
                                type="primary"
                                size="middle"
                                icon={<RightOutlined />}
                                onClick={handleStartReview}
                                style={{
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: "#fa8c16",
                                    borderColor: "#fa8c16",
                                    boxShadow: "0 4px 12px rgba(250, 140, 22, 0.35)"
                                }}
                            >
                                Bắt đầu đánh giá ngay
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal Form Đánh giá khi bấm chọn */}
            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                booking={pendingBooking}
                onSuccess={handleReviewSuccess}
            />
        </>
    );
}
