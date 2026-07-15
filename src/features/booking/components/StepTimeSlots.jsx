import { ClockCircleOutlined } from "@ant-design/icons";
import { Spin, Button, Radio, Space, Input } from "antd";

const { TextArea } = Input;

export default function StepTimeSlots({
    loadingSlots,
    generateAllTimeSlots,
    availableTimes = [],
    selectedTime,
    setSelectedTime,
    notes,
    setNotes,
    paymentMethod,
    setPaymentMethod
}) {
    return (
        <div>
            <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>
                <ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Chọn giờ hẹn khả dụng (Khung giờ trống)
            </label>

            {loadingSlots ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin tip="Đang quét giờ khả dụng..." />
                </div>
            ) : (
                <div>
                    {(() => {
                        const allSlots = generateAllTimeSlots();
                        if (allSlots.length > 0) {
                            return (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12, marginBottom: 24 }}>
                                    {allSlots.map(time => {
                                        const displayTime = time.substring(0, 5);
                                        const isAvailable = availableTimes.includes(time);
                                        const isSelected = selectedTime === time;
                                        
                                        return (
                                            <Button
                                                key={time}
                                                size="large"
                                                disabled={!isAvailable}
                                                style={{
                                                    borderRadius: 8,
                                                    fontWeight: isSelected ? "600" : "500",
                                                    backgroundColor: isSelected 
                                                        ? "#52c41a" // Selected
                                                        : isAvailable 
                                                            ? "#f6ffed" // Available green
                                                            : "#fff1f0", // Busy red
                                                    borderColor: isSelected 
                                                        ? "#52c41a" 
                                                        : isAvailable 
                                                            ? "#b7eb8f" 
                                                            : "#ffa39e",
                                                    color: isSelected 
                                                        ? "#fff" 
                                                        : isAvailable 
                                                            ? "#389e0d" 
                                                            : "#cf1322",
                                                    transition: "all 0.3s",
                                                    opacity: isAvailable ? 1 : 0.65,
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

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Phương thức thanh toán</label>
                        <Radio.Group
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ width: "100%" }}
                        >
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Radio value="PAY_AT_COUNTER" style={{ padding: "4px 0", fontSize: 15 }}>
                                    Thanh toán tại quầy
                                </Radio>
                                <Radio value="VNPAY" style={{ padding: "4px 0", fontSize: 15 }}>
                                    <strong>Thanh toán qua cổng VNPay</strong> (Thanh toán cọc online bằng thẻ nội địa/QR Code)
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                </div>
            )}
        </div>
    );
}
