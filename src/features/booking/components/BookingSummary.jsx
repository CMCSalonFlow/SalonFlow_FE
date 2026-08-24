import { Typography, Divider, Space, Tag, Alert, Card, Grid } from "antd";
import { ShopOutlined, AppstoreOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function BookingSummary({
    isRecurringMode,
    currentStep,
    branches = [],
    selectedBranchId,
    bookingType,
    selectedServices = [],
    selectedBundle,
    selectedStaff,
    selectedDate,
    selectedTime,
    recurringStartDate,
    recurringEndDate,
    recurringPattern,
    recurringTime,
    services = [],
    recurringServiceId,
    totalDuration,
    payableAmount,
    depositAmount,
    paymentMethod,
    formatCurrency
}) {
    const screens = Grid.useBreakpoint();

    return (
        <Card
            style={{
                borderRadius: 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)",
                position: screens.lg ? "sticky" : "static",
                top: 24
            }}
        >
            <Title level={4} style={{ marginTop: 0 }}>Tóm tắt lịch hẹn</Title>
            <Divider style={{ margin: "16px 0" }} />

            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div>
                    <Text type="secondary"><ShopOutlined /> Chi nhánh:</Text>
                    <br />
                    <Text strong>{branches.find(b => b.id === selectedBranchId)?.name || "-"}</Text>
                </div>

                <div>
                    <Text type="secondary"><AppstoreOutlined /> Dịch vụ đặt:</Text>
                    <br />
                    {bookingType === "service" ? (
                        selectedServices.length > 0 ? (
                            <div style={{ marginTop: 4 }}>
                                {selectedServices.map(s => (
                                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <Text>- {s.name}</Text>
                                        <Text type="secondary">{parseFloat(s.price).toLocaleString()} đ</Text>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Text type="secondary" italic>Chưa chọn dịch vụ nào</Text>
                        )
                    ) : (
                        selectedBundle ? (
                            <div style={{ marginTop: 4 }}>
                                <Text strong color="green">{selectedBundle.name}</Text>
                                <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                                    Gói combo gồm nhiều dịch vụ kết hợp
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary" italic>Chưa chọn combo nào</Text>
                        )
                    )}
                </div>

                {currentStep >= 1 && (
                    <>
                        <div>
                            <Text type="secondary"><TeamOutlined /> Nhân viên phục vụ:</Text>
                            <br />
                            <Text strong>{selectedStaff ? selectedStaff.name : (isRecurringMode ? "-" : "Bất kỳ nhân viên (Auto)")}</Text>
                        </div>

                        <div>
                            <Text type="secondary"><CalendarOutlined /> Ngày hẹn:</Text>
                            <br />
                            <Text strong>
                                {isRecurringMode 
                                    ? (recurringStartDate && recurringEndDate 
                                        ? `${recurringStartDate.format("YYYY-MM-DD")} đến ${recurringEndDate.format("YYYY-MM-DD")} (${recurringPattern === "WEEKLY" ? "Hàng tuần" : "Mỗi 2 tuần"})` 
                                        : "-")
                                    : (selectedDate ? selectedDate.format("YYYY-MM-DD") : "-")}
                            </Text>
                        </div>
                    </>
                )}

                {(!isRecurringMode && currentStep >= 2 && selectedTime) && (
                    <div>
                        <Text type="secondary"><ClockCircleOutlined /> Giờ hẹn:</Text>
                        <br />
                        <Tag color="gold" style={{ fontSize: 14, padding: "2px 8px" }}>
                            {selectedTime.substring(0, 5)}
                        </Tag>
                    </div>
                )}

                {(isRecurringMode && recurringTime) && (
                    <div>
                        <Text type="secondary"><ClockCircleOutlined /> Giờ hẹn cố định:</Text>
                        <br />
                        <Tag color="gold" style={{ fontSize: 14, padding: "2px 8px" }}>
                            {recurringTime}
                        </Tag>
                    </div>
                )}
            </Space>

            <Divider style={{ margin: "20px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">Tổng thời gian (mỗi buổi):</Text>
                <Text strong>
                    {isRecurringMode 
                        ? ((services.find(s => s.id === recurringServiceId)?.durationMinutes || 30) + " phút") 
                        : (totalDuration + " phút")}
                </Text>
            </div>

            {!isRecurringMode ? (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Text type="secondary" style={{ fontSize: 16 }}>
                            Tổng số tiền (Thanh toán tại quầy):
                        </Text>
                        <Text strong style={{ color: "#1890ff", fontSize: 22 }}>
                            {payableAmount.toLocaleString()} đ
                        </Text>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            💡 Đặt lịch trực tuyến hoàn toàn miễn phí. Khách hàng sẽ thanh toán giá trị dịch vụ trực tiếp tại quầy sau khi thực hiện xong tại Salon.
                        </Text>
                    </div>
                </>
            ) : (
                <div>
                    <Alert
                        message={
                            <div style={{ fontSize: 13 }}>
                                <b>Chế độ đặt lịch định kỳ:</b> Không yêu cầu thanh toán cọc online. Khách hàng sẽ thanh toán trực tiếp tại salon sau khi hoàn thành mỗi buổi hẹn.
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                </div>
            )}
        </Card>
    );
}
