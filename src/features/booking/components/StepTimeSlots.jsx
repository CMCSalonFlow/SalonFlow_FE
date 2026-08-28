import { useState } from "react";
import { ClockCircleOutlined, RobotOutlined, ThunderboltOutlined, CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Spin, Button, Radio, Space, Input, Card, Tag, Tooltip, message, Grid } from "antd";
import { recommendSmartSlotsApi } from "@/features/ai/api/smartSchedulingApi";
import dayjs from "dayjs";

const { TextArea } = Input;

const RANK_BADGES = [
    { label: "Top 1 Tối Ưu", color: "gold", icon: "🥇" },
    { label: "Top 2 Phù Hợp", color: "blue", icon: "🥈" },
    { label: "Top 3 Đề Xuất", color: "purple", icon: "🥉" }
];

export default function StepTimeSlots({
    loadingSlots,
    generateAllTimeSlots,
    availableTimes = [],
    selectedTime,
    setSelectedTime,
    notes,
    setNotes,
    paymentMethod,
    setPaymentMethod,
    customerPhone,
    setCustomerPhone,
    showCustomerInputs = true,
    // Props cho AI Smart Scheduling
    selectedBranchId,
    selectedDate,
    selectedServices = [],
    selectedBundle = null,
    bookingType = "service",
    selectedStaff = null
}) {
    const screens = Grid.useBreakpoint();
    const [aiLoading, setAiLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [aiFetched, setAiFetched] = useState(false);

    // Xử lý gọi AI Smart Scheduling recommend slots
    const handleFetchAiRecommendations = async () => {
        if (!selectedBranchId || !selectedDate) {
            message.warning("Vui lòng chọn chi nhánh và ngày hẹn trước!");
            return;
        }

        try {
            setAiLoading(true);
            const dateStr = typeof selectedDate.format === "function" 
                ? selectedDate.format("YYYY-MM-DD") 
                : String(selectedDate);

            const userId = localStorage.getItem("userId");
            const payload = {
                branchId: selectedBranchId,
                date: dateStr,
                preferredStaffId: selectedStaff?.id || null,
                customerId: userId ? Number(userId) : null
            };

            if (bookingType === "service" && selectedServices.length > 0) {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else if (bookingType === "bundle" && selectedBundle) {
                payload.bundleId = selectedBundle.id;
            }

            const res = await recommendSmartSlotsApi(payload);
            const recs = Array.isArray(res) ? res : (res?.recommendations || []);
            setAiRecommendations(recs);
            setAiFetched(true);

            if (recs.length === 0) {
                message.info("Không có gợi ý AI nào khả dụng cho tiêu chí đã chọn.");
            } else {
                message.success(`AI đã phân tích và tìm thấy ${recs.length} khung giờ tối ưu nhất!`);
            }
        } catch (error) {
            console.error("Lỗi AI Smart Scheduling:", error);
            message.error(error.response?.data?.message || "Không thể tải gợi ý từ AI lúc này.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div>
            {/* 🤖 KHU VỰC AI SMART SCHEDULING RECOMMENDATION */}
            <Card
                style={{
                    marginBottom: 24,
                    borderRadius: 16,
                    background: "linear-gradient(135deg, #f6f8ff 0%, #eef2fe 100%)",
                    border: "1px solid #d0d9ff",
                    boxShadow: "0 4px 14px rgba(24, 144, 255, 0.08)"
                }}
                bodyStyle={{ padding: 20 }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#1d39c4", display: "flex", alignItems: "center", gap: 8 }}>
                            <RobotOutlined style={{ fontSize: 20, color: "#2f54eb" }} />
                            <span>AI Smart Scheduling — Đề xuất Slot Tối ưu</span>
                        </div>
                    </div>

                    <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        loading={aiLoading}
                        onClick={handleFetchAiRecommendations}
                        style={{
                            borderRadius: 10,
                            background: "linear-gradient(90deg, #2f54eb 0%, #722ed1 100%)",
                            borderColor: "transparent",
                            fontWeight: 600,
                            boxShadow: "0 2px 8px rgba(114, 46, 209, 0.3)"
                        }}
                        size="large"
                    >
                        {aiFetched ? "Tải lại Đề xuất AI" : "Đề xuất Slot bằng AI"}
                    </Button>
                </div>

                {/* Danh sách gợi ý từ AI */}
                {aiLoading ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <Spin tip="AI đang phân tích thuật toán Scoring..." />
                    </div>
                ) : aiFetched && aiRecommendations.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                        {aiRecommendations.map((rec, index) => {
                            const badge = RANK_BADGES[index] || RANK_BADGES[2];
                            const timeStr = rec.startTime ? rec.startTime.substring(0, 5) : "";
                            const isSelected = selectedTime === rec.startTime || selectedTime === (rec.startTime + ":00");

                            return (
                                <div
                                    key={index}
                                    onClick={() => setSelectedTime(rec.startTime)}
                                    style={{
                                        padding: "12px 16px",
                                        borderRadius: 12,
                                        backgroundColor: isSelected ? "#f6ffed" : "#ffffff",
                                        border: isSelected ? "2px solid #52c41a" : "1px solid #d9d9d9",
                                        cursor: "pointer",
                                        transition: "all 0.25s ease",
                                        boxShadow: isSelected ? "0 4px 12px rgba(82, 196, 26, 0.2)" : "0 2px 6px rgba(0, 0, 0, 0.03)"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <Tag color={badge.color} style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, padding: "2px 8px" }}>
                                            {badge.icon} {badge.label}
                                        </Tag>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#722ed1" }}>
                                            Score: {Number(rec.totalScore || 0).toFixed(1)}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 20, fontWeight: 800, color: isSelected ? "#389e0d" : "#262626", marginBottom: 4 }}>
                                        {timeStr} {isSelected && <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
                                    </div>

                                    {rec.assignedStaffName && (
                                        <div style={{ fontSize: 12, color: "#595959", marginBottom: 4 }}>
                                            👤 Thợ: <strong>{rec.assignedStaffName}</strong>
                                        </div>
                                    )}

                                    {rec.explanation && (
                                        <Tooltip title={rec.explanation}>
                                            <div style={{
                                                fontSize: 11,
                                                color: "#8c8c8c",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                <InfoCircleOutlined style={{ color: "#1890ff" }} /> {rec.explanation}
                                            </div>
                                        </Tooltip>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : aiFetched && aiRecommendations.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#8c8c8c", textAlign: "center", padding: "12px 0" }}>
                        Không tìm thấy gợi ý phù hợp từ AI cho tiêu chí này. Hãy chọn trực tiếp từ danh sách bên dưới.
                    </div>
                ) : null}
            </Card>

            {/* DANH SÁCH GIỜ HẸN TRỐNG TIÊU CHUẨN */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                <label style={{ fontWeight: 600, display: "flex", alignItems: "center" }}>
                    <ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Tất cả khung giờ khả dụng
                </label>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#595959" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: "#f6ffed", border: "1px solid #b7eb8f" }}></div>
                        <span>Có sẵn</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: "#fff1f0", border: "1px solid #ffa39e" }}></div>
                        <span>Đã đầy</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 4, background: "#f5f5f5", border: "1px solid #d9d9d9" }}></div>
                        <span>Đã qua</span>
                    </div>
                </div>
            </div>

            {loadingSlots ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin tip="Đang quét giờ khả dụng..." />
                </div>
            ) : (
                <div>
                    {(() => {
                        const allSlots = generateAllTimeSlots();
                        if (allSlots.length > 0) {
                            const minSlotWidth = screens.xs ? "72px" : "86px";
                            const slotGap = screens.xs ? 8 : 10;
                            const isToday = selectedDate && (
                                typeof selectedDate.isSame === "function"
                                    ? selectedDate.isSame(dayjs(), "day")
                                    : String(selectedDate) === dayjs().format("YYYY-MM-DD")
                            );
                            const nowTimeString = dayjs().format("HH:mm:ss");

                            return (
                                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${minSlotWidth}, 1fr))`, gap: slotGap, marginBottom: 24 }}>
                                    {allSlots.map(time => {
                                        const displayTime = time.substring(0, 5);
                                        const isPast = isToday && time < nowTimeString;
                                        const isAvailable = availableTimes.includes(time) && !isPast;
                                        const isSelected = selectedTime === time;
                                        
                                        return (
                                            <Button
                                                key={time}
                                                size={screens.xs ? "middle" : "large"}
                                                disabled={!isAvailable}
                                                style={{
                                                    borderRadius: 8,
                                                    padding: screens.xs ? "0 4px" : "0 8px",
                                                    fontSize: screens.xs ? 13 : 14,
                                                    fontWeight: isSelected ? "600" : "500",
                                                    backgroundColor: isSelected 
                                                        ? "#52c41a" // Selected green
                                                        : isPast
                                                            ? "#f5f5f5" // Past grey
                                                            : isAvailable 
                                                                ? "#f6ffed" // Available green
                                                                : "#fff1f0", // Busy red
                                                    borderColor: isSelected 
                                                        ? "#52c41a" 
                                                        : isPast
                                                            ? "#d9d9d9" // Past grey border
                                                            : isAvailable 
                                                                ? "#b7eb8f" 
                                                                : "#ffa39e",
                                                    color: isSelected 
                                                        ? "#fff" 
                                                        : isPast
                                                            ? "#bfbfbf" // Past grey text
                                                            : isAvailable 
                                                                ? "#389e0d" 
                                                                : "#cf1322",
                                                    transition: "all 0.3s",
                                                    opacity: isAvailable ? 1 : 0.6,
                                                    cursor: isAvailable ? "pointer" : "not-allowed"
                                                }}
                                                onClick={() => isAvailable && setSelectedTime(time)}
                                            >
                                                {displayTime}
                                            </Button>
                                        );
                                    })}
                                </div>
                            );
                        } else {
                            return (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "#8c8c8c" }}>
                                    Chi nhánh hiện tại chưa mở cửa hoặc chưa có ca làm việc nào.
                                </div>
                            );
                        }
                    })()}

                    {showCustomerInputs && (
                        <>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                                    Số điện thoại liên hệ <span style={{ color: "#ff4d4f" }}>*</span>
                                </label>
                                <Input
                                    placeholder="Nhập số điện thoại để nhận thông báo lịch hẹn..."
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    style={{ borderRadius: 8 }}
                                    size="large"
                                />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ghi chú gửi cho Salon (Tùy chọn)</label>
                                <TextArea
                                    rows={3}
                                    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt của bạn..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{ borderRadius: 8 }}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
