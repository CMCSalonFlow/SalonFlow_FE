import { Typography, Divider, Space, Tag, Card, Grid } from "antd";
import { ShopOutlined, AppstoreOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function BookingSummary({
    currentStep,
    branches = [],
    selectedBranchId,
    bookingType,
    selectedServices = [],
    selectedBundle,
    selectedStaff,
    selectedDate,
    selectedTime,
    totalDuration,
    payableAmount
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
                            <Text strong>{selectedStaff ? selectedStaff.name : "Bất kỳ nhân viên (Auto)"}</Text>
                        </div>

                        <div>
                            <Text type="secondary"><CalendarOutlined /> Ngày hẹn:</Text>
                            <br />
                            <Text strong>
                                {selectedDate ? selectedDate.format("YYYY-MM-DD") : "-"}
                            </Text>
                        </div>
                    </>
                )}

                {currentStep >= 2 && selectedTime && (
                    <div>
                        <Text type="secondary"><ClockCircleOutlined /> Giờ hẹn:</Text>
                        <br />
                        <Tag color="gold" style={{ fontSize: 14, padding: "2px 8px" }}>
                            {selectedTime.substring(0, 5)}
                        </Tag>
                    </div>
                )}
            </Space>

            <Divider style={{ margin: "20px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">Tổng thời gian:</Text>
                <Text strong>
                    {totalDuration + " phút"}
                </Text>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                    Tổng số tiền:
                </Text>
                <Text strong style={{ color: "#1890ff", fontSize: 22 }}>
                    {payableAmount.toLocaleString()} đ
                </Text>
            </div>
        </Card>
    );
}
