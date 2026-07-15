import { DatePicker, Divider, Spin, Card, Space, Avatar, Row, Col, Typography } from "antd";
import { SmileOutlined, TeamOutlined, CalendarOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function NormalBookingForm({
    selectedDate,
    setSelectedDate,
    setSelectedStaff,
    loadingStaff,
    getQualifiedStaff,
    selectedStaff
}) {
    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Ngày hẹn</label>
                <DatePicker
                    style={{ width: "100%" }}
                    size="large"
                    format="YYYY-MM-DD"
                    disabledDate={current => current && current.valueOf() < Date.now() - 24*60*60*1000}
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
                            Vui lòng chọn ngày hẹn trước để hiển thị danh sách nhân viên khả dụng.
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
