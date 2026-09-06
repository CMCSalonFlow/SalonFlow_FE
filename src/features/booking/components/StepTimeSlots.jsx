import { useState } from "react";
import { ClockCircleOutlined, RobotOutlined, ThunderboltOutlined, CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Spin, Button, Radio, Space, Input, Card, Tag, Tooltip, message, Grid } from "antd";
import { recommendSmartSlotsApi } from "@/features/ai/api/smartSchedulingApi";
import dayjs from "dayjs";

const { TextArea } = Input;

const RANK_BADGES = [
    { label: "Top 1 - Đề xuất ưu tiên", color: "blue" },
    { label: "Top 2 - Đề xuất khả dụng", color: "purple" },
    { label: "Top 3 - Đề xuất bổ sung", color: "cyan" }
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
    selectedStaff = null,
    setSelectedStaff = null
}) {
    const screens = Grid.useBreakpoint();
    const [aiLoading, setAiLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [aiFetched, setAiFetched] = useState(false);

    // Xử lý chọn slot gợi ý từ AI -> gán cả giờ đặt lẫn thợ được gợi ý
    const handleSelectRecommendation = (rec) => {
        if (!rec || !rec.startTime) return;
        setSelectedTime(rec.startTime);
        
        if (typeof setSelectedStaff === "function" && rec.staffId) {
            setSelectedStaff({
                id: rec.staffId,
                name: rec.staffName || rec.assignedStaffName || "Thợ Salon",
                avatarUrl: rec.staffAvatar,
                specialties: rec.staffSpecialties
            });
            message.success(`Đã chọn khung giờ ${rec.startTime.substring(0, 5)} và gán Nhân viên phục vụ ${rec.staffName || ""}`);
        }
    };

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
                // Tự động phân công thợ & khung giờ Top 1 nếu chưa chọn
                if (recs[0]) {
                    handleSelectRecommendation(recs[0]);
                }
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
            {/* KHU VỰC AI SMART SCHEDULING RECOMMENDATION */}
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
                            <span>AI Smart Scheduling — Đề xuất Khung giờ Tối ưu</span>
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
                        <Spin tip="AI đang phân tích quy luật Occupancy & Cân bằng tải nhân sự..." />
                    </div>
                ) : aiFetched && aiRecommendations.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                        {aiRecommendations.map((rec, index) => {
                            const badge = RANK_BADGES[index] || RANK_BADGES[2];
                            const timeStr = rec.startTime ? rec.startTime.substring(0, 5) : "";
                            const endTimeStr = rec.endTime ? rec.endTime.substring(0, 5) : "";
                            
                            const isTimeMatched = selectedTime && (
                                selectedTime === rec.startTime ||
                                selectedTime === timeStr ||
                                (selectedTime + ":00") === rec.startTime ||
                                selectedTime === (rec.startTime + ":00")
                            );
                            const isStaffMatched = !selectedStaff || (rec.staffId && Number(selectedStaff.id) === Number(rec.staffId));
                            const isSelected = isTimeMatched && isStaffMatched;

                            const staffName = rec.staffName || rec.assignedStaffName;

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleSelectRecommendation(rec)}
                                    style={{
                                        padding: "14px 16px",
                                        borderRadius: 12,
                                        backgroundColor: isSelected ? "#f6ffed" : "#ffffff",
                                        border: isSelected ? "2px solid #52c41a" : "1px solid #d9d9d9",
                                        cursor: "pointer",
                                        transition: "all 0.25s ease",
                                        boxShadow: isSelected ? "0 4px 12px rgba(82, 196, 26, 0.2)" : "0 2px 6px rgba(0, 0, 0, 0.03)"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <Tag color={badge.color} style={{ borderRadius: 6, fontWeight: 600, fontSize: 12, padding: "2px 8px" }}>
                                            {badge.label}
                                        </Tag>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#722ed1" }}>
                                            Score: {Number(rec.totalScore || rec.score || 0).toFixed(1)}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 20, fontWeight: 800, color: isSelected ? "#389e0d" : "#262626", marginBottom: 6 }}>
                                        {timeStr} – {endTimeStr} {isSelected && <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
                                    </div>

                                    {staffName && (
                                        <div style={{ fontSize: 12, color: "#434343", marginBottom: 8, fontWeight: 500 }}>
                                            Nhân viên phục vụ: <strong>{staffName}</strong>
                                        </div>
                                    )}

                                    {/* Lý do đề xuất ngắn gọn chuẩn văn phong nghiệp vụ */}
                                    {Array.isArray(rec.reasonList) && rec.reasonList.length > 0 ? (
                                        <div style={{
                                            fontSize: 12,
                                            color: "#475569",
                                            background: "#f8fafc",
                                            padding: "8px 10px",
                                            borderRadius: 8,
                                            border: "1px solid #e2e8f0",
                                            fontWeight: 500,
                                            lineHeight: 1.4,
                                            marginTop: 6
                                        }}>
                                            {rec.reasonList.join(" • ")}
                                        </div>
                                    ) : null}
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
