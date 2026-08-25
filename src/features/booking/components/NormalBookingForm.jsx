import { DatePicker, Divider, Spin, Card, Space, Avatar, Row, Col, Typography } from "antd";
import { SmileOutlined, CalendarOutlined, InfoCircleOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

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
    const isDateDisabled = (current) => {
        if (!current) return false;
        // 1. Vô hiệu hóa tất cả các ngày trong quá khứ trước ngày hôm nay
        if (current.isBefore(dayjs().startOf("day"))) return true;

        // 2. Nếu là ngày hôm nay nhưng giờ hiện tại đã quá giờ hoạt động của chi nhánh (sau 19:30/20:00) -> vô hiệu hóa ngày hôm nay
        if (current.isSame(dayjs(), "day")) {
            const nowHour = dayjs().hour();
            const nowMinute = dayjs().minute();
            if (nowHour >= 20 || (nowHour === 19 && nowMinute > 30)) {
                return true;
            }
        }

        // 3. Vô hiệu hóa các ngày nghỉ lễ của chi nhánh
        const dateStr = current.format("YYYY-MM-DD");
        return systemOffDays.some(off => dateStr >= off.dateFrom && dateStr <= off.dateTo);
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
                            Vui lòng chọn ngày hẹn trước để hiển thị danh sách nhân viên.
                        </Text>
                    </div>
                </div>
            ) : loadingStaff ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Spin tip="Đang kiểm tra lịch làm việc của nhân viên..." />
                </div>
            ) : (
                <div>
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
                                            <Avatar size={48} src={staff.avatarUrl} icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                                            <div>
                                                <Text strong style={{ fontSize: 16 }}>{staff.name}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {staff.specialties || "Cắt Tóc & Tạo Kiểu"}
                                                </Text>
                                            </div>
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </div>
            )}
        </div>
    );
}
