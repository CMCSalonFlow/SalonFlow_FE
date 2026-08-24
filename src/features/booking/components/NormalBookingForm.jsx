import { useState, useEffect } from "react";
import { DatePicker, Divider, Spin, Card, Space, Avatar, Row, Col, Typography, Button, Tag, Tooltip, message } from "antd";
import { SmileOutlined, TeamOutlined, CalendarOutlined, InfoCircleOutlined, RobotOutlined, ThunderboltOutlined, UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { recommendSmartSlotsApi } from "@/features/ai/api/smartSchedulingApi";

const { Text } = Typography;

const RANK_BADGES = [
    { label: "Top 1 Tối Ưu", color: "#fff7e6", borderColor: "#ffe58f", textColor: "#d46b08" },
    { label: "Top 2 Phù Hợp", color: "#e6f7ff", borderColor: "#91d5ff", textColor: "#096dd9" },
    { label: "Top 3 Đề Xuất", color: "#f9f0ff", borderColor: "#d3ade6", textColor: "#531dab" }
];

export default function NormalBookingForm({
    selectedDate,
    setSelectedDate,
    setSelectedStaff,
    loadingStaff,
    getQualifiedStaff,
    selectedStaff,
    systemOffDays = [],
    selectedBranchId = null,
    selectedServices = [],
    selectedBundle = null,
    bookingType = "service",
    selectedTime = null,
    setSelectedTime = null
}) {
    const [aiLoading, setAiLoading] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [aiFetched, setAiFetched] = useState(false);

    const isDateDisabled = (current) => {
        if (!current) return false;
        if (current.valueOf() < Date.now() - 24 * 60 * 60 * 1000) return true;
        const dateStr = current.format("YYYY-MM-DD");
        return systemOffDays.some(off => dateStr >= off.dateFrom && dateStr <= off.dateTo);
    };

    const handleFetchAiRecommendations = async () => {
        if (!selectedBranchId || !selectedDate) return;
        try {
            setAiLoading(true);
            const dateStr = typeof selectedDate.format === "function"
                ? selectedDate.format("YYYY-MM-DD")
                : String(selectedDate);

            const payload = {
                branchId: selectedBranchId,
                date: dateStr
            };

            if (bookingType === "service" && selectedServices.length > 0) {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else if (bookingType === "bundle" && selectedBundle) {
                payload.bundleId = selectedBundle.id;
            }

            const res = await recommendSmartSlotsApi(payload);
            const recs = res?.recommendations || [];
            setAiRecommendations(recs);
            setAiFetched(true);
        } catch (err) {
            console.error("Lỗi AI Smart Scheduling:", err);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        setAiRecommendations([]);
        setAiFetched(false);
    }, [selectedDate, selectedBranchId]);

    // Lọc danh sách thợ gợi ý độc nhất từ AI kết hợp với getQualifiedStaff()
    const getAiStaffRecommendations = () => {
        const qualified = getQualifiedStaff();
        if (!aiRecommendations || aiRecommendations.length === 0) return [];

        const uniqueStaffList = [];
        const seenStaffIds = new Set();

        for (const rec of aiRecommendations) {
            const staffId = rec.staffId || rec.assignedStaffId;
            const staffName = rec.assignedStaffName || rec.staffName;

            const matched = qualified.find(s =>
                (staffId && String(s.id) === String(staffId)) ||
                (staffName && s.name.toLowerCase() === String(staffName).toLowerCase())
            );

            const key = matched ? matched.id : (staffId || staffName);

            if (key && !seenStaffIds.has(key)) {
                seenStaffIds.add(key);
                uniqueStaffList.push({
                    rec,
                    staff: matched || {
                        id: staffId,
                        name: staffName || "Thợ làm tóc",
                        avatarUrl: rec.staffAvatar,
                        specialties: rec.staffSpecialties || "Thợ làm tóc chuyên nghiệp"
                    },
                    score: rec.totalScore || 90.0,
                    explanation: rec.explanation
                });
            }
            if (uniqueStaffList.length >= 3) break;
        }

        return uniqueStaffList;
    };

    return (
        <div>
            {systemOffDays.length > 0 && (
                <div style={{ marginBottom: 20, padding: '12px 16px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 12 }}>
                    <Space size={8}>
                        <InfoCircleOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
                        <Text strong style={{ color: '#d46b08' }}>Thông báo Lịch nghỉ lễ / Đóng cửa của Chi nhánh:</Text>
                    </Space>
                    <div style={{ marginTop: 6, paddingLeft: 24 }}>
                        {systemOffDays.map(off => (
                            <div key={off.id} style={{ fontSize: 13, color: '#8c6b00', marginTop: 2 }}>
                                • <b>{off.title}</b> ({dayjs(off.dateFrom).format("DD/MM/YYYY")} ➔ {dayjs(off.dateTo).format("DD/MM/YYYY")}): <i>{off.reason || "Salon đóng cửa tạm thời"}</i>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Ngày hẹn</label>
                <DatePicker
                    style={{ width: "100%" }}
                    size="large"
                    format="YYYY-MM-DD"
                    disabledDate={isDateDisabled}
                    value={selectedDate}
                    onChange={(date) => {
                        setSelectedDate(date);
                        setSelectedStaff(null); // Reset nhân viên khi đổi ngày
                    }}
                    placeholder="Chọn ngày bạn muốn hẹn lịch..."
                />
            </div>

            <Divider style={{ margin: "24px 0" }} />

            {!selectedDate ? (
                <div style={{ 
                    padding: "40px 20px", 
                    background: "#fafafa", 
                    borderRadius: 16, 
                    textAlign: "center",
                    border: "1px dashed #d9d9d9"
                }}>
                    <CalendarOutlined style={{ fontSize: 32, color: "#bfbfbf", marginBottom: 12 }} />
                    <div>
                        <Text type="secondary" style={{ fontSize: 16, fontWeight: 500 }}>
                            Vui lòng chọn ngày hẹn trước để hiển thị danh sách nhân viên & gợi ý AI.
                        </Text>
                    </div>
                </div>
            ) : loadingStaff ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin tip="Đang kiểm tra lịch làm việc của nhân viên..." />
                </div>
            ) : (
                <div>
                    {/* 🤖 KHU VỰC AI SMART SCHEDULING RECOMMENDATION CHO BƯỚC 2 */}
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
                                    <span>AI Smart Scheduling — Đề xuất Thợ Tối ưu</span>
                                </div>
                                <div style={{ fontSize: 13, color: "#595959", marginTop: 4 }}>
                                    Hệ thống AI tự động phân tích tay nghề & ca làm để gợi ý Top Thợ phù hợp nhất.
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
                                size="middle"
                            >
                                {aiFetched ? "Tải lại Đề xuất AI" : "Gợi ý bằng AI"}
                            </Button>
                        </div>

                        {/* Danh sách gợi ý từ AI */}
                        {aiLoading ? (
                            <div style={{ textAlign: "center", padding: "24px 0" }}>
                                <Spin tip="AI đang phân tích thợ rảnh và tay nghề phù hợp nhất..." />
                            </div>
                        ) : !aiFetched ? (
                            <div style={{ textAlign: "center", padding: "16px 12px", color: "#595959", fontSize: 13, background: "#ffffff", borderRadius: 12, border: "1px dashed #adc6ff" }}>
                                ⚡ Bấm nút <b>"Gợi ý bằng AI"</b> ở góc phải trên để AI phân tích thợ rảnh và phù hợp nhất cho bạn.
                            </div>
                        ) : getAiStaffRecommendations().length > 0 ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
                                {getAiStaffRecommendations().map((item, index) => {
                                    const badge = RANK_BADGES[index] || RANK_BADGES[2];
                                    const isSelected = selectedStaff && String(selectedStaff.id) === String(item.staff.id);

                                    return (
                                        <Card
                                            key={index}
                                            hoverable
                                            onClick={() => {
                                                setSelectedStaff(item.staff);
                                                message.success(`Đã chọn thợ ${item.staff.name} (AI Đề xuất)!`);
                                            }}
                                            style={{
                                                borderRadius: 14,
                                                backgroundColor: isSelected ? "#f0f7ff" : "#ffffff",
                                                border: isSelected ? "2px solid #1890ff" : "1px solid #e2e8f0",
                                                boxShadow: isSelected ? "0 6px 16px rgba(24, 144, 255, 0.16)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
                                                transition: "all 0.25s ease"
                                            }}
                                            bodyStyle={{ padding: "14px 16px" }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                <Tag color={badge.color} style={{ borderRadius: 20, fontWeight: 700, fontSize: 11, padding: "2px 8px", color: badge.textColor, borderColor: badge.borderColor, margin: 0 }}>
                                                    {badge.label}
                                                </Tag>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "#722ed1", backgroundColor: "#f9f0ff", padding: "2px 8px", borderRadius: 10 }}>
                                                    {Number(item.score).toFixed(1)} điểm
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <Avatar size={46} src={item.staff.avatarUrl} icon={<UserOutlined />} style={{ backgroundColor: "#1890ff", flexShrink: 0 }} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", display: "flex", alignItems: "center", gap: 4 }}>
                                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {item.staff.name}
                                                        </span>
                                                        {isSelected && <CheckCircleOutlined style={{ color: "#1890ff", fontSize: 15, flexShrink: 0 }} />}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {item.staff.specialties || "Thợ làm tóc chuyên nghiệp"}
                                                    </div>
                                                </div>
                                            </div>

                                            {item.explanation && (
                                                <Tooltip title={item.explanation}>
                                                    <div style={{
                                                        fontSize: 11,
                                                        color: "#475569",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        marginTop: 10,
                                                        paddingTop: 8,
                                                        borderTop: "1px dashed #e2e8f0"
                                                    }}>
                                                        <InfoCircleOutlined style={{ color: "#2563eb", flexShrink: 0 }} />
                                                        <span>{item.explanation}</span>
                                                    </div>
                                                </Tooltip>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : null}
                    </Card>
                    <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Chọn Nhân viên thực hiện</label>
                    <Row gutter={[16, 16]}>
                        {/* Thẻ chọn "Bất kỳ ai" */}
                        <Col xs={24} sm={12}>
                            <Card
                                hoverable
                                style={{
                                    borderRadius: 12,
                                    border: selectedStaff === null ? "2px solid #1890ff" : "1px solid #f0f0f0",
                                    backgroundColor: selectedStaff === null ? "#e6f7ff" : "#fff"
                                }}
                                onClick={() => setSelectedStaff(null)}
                            >
                                <Space size="middle">
                                    <Avatar size={48} icon={<SmileOutlined />} style={{ backgroundColor: "#87d068" }} />
                                    <div>
                                        <Text strong style={{ fontSize: 16 }}>Bất kỳ ai</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>Tự động phân bổ thợ đang rảnh</Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>

                        {/* Danh sách thợ đủ điều kiện kỹ năng */}
                        {getQualifiedStaff().map(staff => {
                            const isSelected = selectedStaff?.id === staff.id;
                            return (
                                <Col xs={24} sm={12} key={staff.id}>
                                    <Card
                                        hoverable
                                        style={{
                                            borderRadius: 12,
                                            border: isSelected ? "2px solid #1890ff" : "1px solid #f0f0f0",
                                            backgroundColor: isSelected ? "#e6f7ff" : "#fff"
                                        }}
                                        onClick={() => setSelectedStaff(staff)}
                                    >
                                        <Space size="middle">
                                            <Avatar size={48} src={staff.avatarUrl} icon={<TeamOutlined />} style={{ backgroundColor: "#1890ff" }} />
                                            <div>
                                                <Text strong style={{ fontSize: 16 }}>{staff.name}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: 12, display: "inline-block", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {staff.specialties || "Thợ làm tóc chuyên nghiệp"}
                                                </Text>
                                            </div>
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                    {getQualifiedStaff().length === 0 && (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <Text type="secondary">Không có nhân viên nào hoạt động hoặc có ca làm việc vào ngày này.</Text>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
