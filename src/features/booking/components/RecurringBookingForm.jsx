import { Alert, Select, Radio, Row, Col, DatePicker, Card, Space, Avatar, Table, Button, Typography, Divider, Tag } from "antd";
import { TeamOutlined, CloseCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export default function RecurringBookingForm({
    services = [],
    selectedServices = [],
    selectedBundle,
    bookingType,
    recurringServiceId,
    setRecurringServiceId,
    recurringPattern,
    setRecurringPattern,
    recurringStartDate,
    setRecurringStartDate,
    recurringEndDate,
    setRecurringEndDate,
    recurringTime,
    setRecurringTime,
    getQualifiedStaff,
    selectedStaff,
    setSelectedStaff,
    recurringPreviewList = [],
    setRecurringPreviewList
}) {
    const activeServicesList = bookingType === "bundle"
        ? (selectedBundle?.items || []).map(item => ({ id: item.serviceId, name: item.name, price: item.price || 0 }))
        : selectedServices;

    return (
        <div>
            {activeServicesList.length > 1 && (
                <Alert
                    message="Đặt lịch định kỳ chỉ hỗ trợ cho một dịch vụ duy nhất. Vui lòng chọn dịch vụ bạn muốn thực hiện lặp lại bên dưới."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            {activeServicesList.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Dịch vụ áp dụng định kỳ</label>
                    <Select
                        style={{ width: "100%" }}
                        size="large"
                        value={recurringServiceId}
                        onChange={setRecurringServiceId}
                        options={activeServicesList.map(s => ({
                            label: `${s.name} - ${parseFloat(s.price).toLocaleString()} đ`,
                            value: s.id
                        }))}
                    />
                </div>
            ) : (
                <Alert
                    message="Vui lòng quay lại Bước 1 chọn dịch vụ trước khi tiếp tục."
                    type="error"
                    showIcon
                    style={{ marginBottom: 20 }}
                />
            )}

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Tần suất lặp</label>
                <Radio.Group
                    value={recurringPattern}
                    onChange={e => setRecurringPattern(e.target.value)}
                    size="large"
                    block
                >
                    <Radio.Button value="WEEKLY" style={{ width: "50%", textAlign: "center" }}>Hàng tuần</Radio.Button>
                    <Radio.Button value="BIWEEKLY" style={{ width: "50%", textAlign: "center" }}>Mỗi 2 tuần</Radio.Button>
                </Radio.Group>
            </div>

            <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col span={12}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ngày bắt đầu chuỗi</label>
                    <DatePicker
                        style={{ width: "100%" }}
                        size="large"
                        format="YYYY-MM-DD"
                        disabledDate={current => current && current.valueOf() < Date.now() - 24*60*60*1000}
                        value={recurringStartDate}
                        onChange={(date) => {
                            setRecurringStartDate(date);
                            setRecurringPreviewList([]); // reset preview
                        }}
                        placeholder="Từ ngày..."
                    />
                </Col>
                <Col span={12}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ngày kết thúc chuỗi</label>
                    <DatePicker
                        style={{ width: "100%" }}
                        size="large"
                        format="YYYY-MM-DD"
                        disabledDate={current => current && (current.valueOf() < Date.now() - 24*60*60*1000 || (recurringStartDate && current.valueOf() < recurringStartDate.valueOf()))}
                        value={recurringEndDate}
                        onChange={(date) => {
                            setRecurringEndDate(date);
                            setRecurringPreviewList([]); // reset preview
                        }}
                        placeholder="Đến ngày..."
                    />
                </Col>
            </Row>

            <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Giờ hẹn cố định</label>
                <Select
                    style={{ width: "100%" }}
                    size="large"
                    value={recurringTime}
                    onChange={(val) => {
                        setRecurringTime(val);
                        setRecurringPreviewList([]); // reset preview
                    }}
                    placeholder="Chọn khung giờ muốn hẹn..."
                    options={[
                        "08:00", "08:15", "08:30", "08:45",
                        "09:00", "09:15", "09:30", "09:45",
                        "10:00", "10:15", "10:30", "10:45",
                        "11:00", "11:15", "11:30", "11:45",
                        "12:00", "12:15", "12:30", "12:45",
                        "13:00", "13:15", "13:30", "13:45",
                        "14:00", "14:15", "14:30", "14:45",
                        "15:00", "15:15", "15:30", "15:45",
                        "16:00", "16:15", "16:30", "16:45",
                        "17:00", "17:15", "17:30", "17:45",
                        "18:00", "18:15", "18:30", "18:45",
                        "19:00", "19:15", "19:30", "19:45",
                        "20:00"
                    ].map(t => ({ label: t, value: t }))}
                />
            </div>

            <Divider style={{ margin: "24px 0" }} />

            {(!recurringStartDate || !recurringEndDate || !recurringTime) ? (
                <div style={{ 
                    padding: "40px 20px", 
                    background: "#fafafa", 
                    borderRadius: 16, 
                    textAlign: "center",
                    border: "1px dashed #d9d9d9"
                }}>
                    <TeamOutlined style={{ fontSize: 32, color: "#bfbfbf", marginBottom: 12 }} />
                    <div>
                        <Text type="secondary" style={{ fontSize: 16, fontWeight: 500 }}>
                            Vui lòng chọn ngày bắt đầu, ngày kết thúc và giờ hẹn cố định để hiển thị danh sách nhân viên khả dụng.
                        </Text>
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Chọn Nhân viên thực hiện</label>
                    <Row gutter={[16, 16]}>
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
                                        onClick={() => {
                                            setSelectedStaff(staff);
                                            setRecurringPreviewList([]); // reset preview
                                        }}
                                    >
                                        <Space size="middle">
                                            <Avatar size={48} src={staff.avatarUrl} icon={<TeamOutlined />} style={{ backgroundColor: "#1890ff" }} />
                                            <div>
                                                <Text strong style={{ fontSize: 16 }}>{staff.name}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: 12 }}>{staff.specialties || "Thợ làm tóc chuyên nghiệp"}</Text>
                                            </div>
                                        </Space>
                                    </Card>
                                </Col>
                            );
                        })}
                        {getQualifiedStaff().length === 0 && (
                            <Col span={24} style={{ textAlign: "center", padding: 20 }}>
                                <Text type="secondary">Không có nhân viên nào có lịch làm việc phù hợp với khung giờ này.</Text>
                            </Col>
                        )}
                    </Row>
                </div>
            )}

            {/* DANH SÁCH XEM TRƯỚC VÀ XỬ LÝ CONFLICT */}
            {recurringPreviewList.length > 0 && (
                <div style={{ marginTop: 32, background: "#fafafa", padding: 20, borderRadius: 16, border: "1px solid #e8e8e8" }}>
                    <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
                        📋 Preview Danh sách Ngày hẹn ({recurringPreviewList.length} ngày)
                    </Title>
                    <div style={{ maxHeight: 350, overflowY: "auto", marginBottom: 16 }}>
                        <Table
                            dataSource={recurringPreviewList}
                            rowKey="date"
                            pagination={false}
                            size="small"
                            columns={[
                                {
                                    title: "Ngày hẹn",
                                    dataIndex: "date",
                                    render: (text) => <Text strong>{text}</Text>
                                },
                                {
                                    title: "Khung giờ",
                                    key: "time",
                                    render: (_, record) => {
                                        const act = record.action || (record.hasConflict ? "SKIP" : "INCLUDE");
                                        if (act === "INCLUDE" && record.overrideStartTime) {
                                            return <Tag color="orange">{record.overrideStartTime.substring(0, 5)} - {record.overrideEndTime.substring(0, 5)} (Đổi giờ)</Tag>;
                                        }
                                        return <Text>{record.startTime.substring(0, 5)} - {record.endTime.substring(0, 5)}</Text>;
                                    }
                                },
                                {
                                    title: "Trạng thái",
                                    key: "status",
                                    render: (_, record) => {
                                        if (record.hasConflict) {
                                            return <Tag color="error" icon={<CloseCircleOutlined />}>Trùng lịch/Bận</Tag>;
                                        }
                                        return <Tag color="success" icon={<CheckCircleOutlined />}>Sẵn sàng</Tag>;
                                    }
                                },
                                {
                                    title: "Quyết định đặt",
                                    key: "action",
                                    render: (_, record, index) => {
                                        const act = record.action || (record.hasConflict ? "SKIP" : "INCLUDE");
                                        return (
                                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                                <Select
                                                    size="small"
                                                    style={{ width: 140 }}
                                                    value={act}
                                                    onChange={(newAct) => {
                                                        const newList = [...recurringPreviewList];
                                                        newList[index].action = newAct;
                                                        if (newAct !== "INCLUDE") {
                                                            newList[index].overrideStartTime = null;
                                                            newList[index].overrideEndTime = null;
                                                            newList[index].showOverridePicker = false;
                                                        }
                                                        setRecurringPreviewList(newList);
                                                    }}
                                                    options={[
                                                        { label: "Đồng ý đặt", value: "INCLUDE" },
                                                        { label: "Bỏ qua ngày này", value: "SKIP" }
                                                    ]}
                                                />
                                                {act === "INCLUDE" && (
                                                    <div style={{ marginTop: 4 }}>
                                                        {!record.showOverridePicker && !record.overrideStartTime ? (
                                                            <Button 
                                                                size="small" 
                                                                type="link" 
                                                                onClick={() => {
                                                                    const newList = [...recurringPreviewList];
                                                                    newList[index].showOverridePicker = true;
                                                                    setRecurringPreviewList(newList);
                                                                }}
                                                                style={{ padding: 0, fontSize: 12 }}
                                                            >
                                                                Đổi giờ khác
                                                            </Button>
                                                        ) : (
                                                            <Select
                                                                size="small"
                                                                placeholder="Chọn giờ mới..."
                                                                style={{ width: 140 }}
                                                                value={record.overrideStartTime}
                                                                onChange={(newTime) => {
                                                                    const activeService = services.find(s => s.id === recurringServiceId);
                                                                    const duration = activeService ? activeService.durationMinutes : 30;
                                                                    const newEnd = dayjs(`2020-01-01T${newTime}`).add(duration, "minute").format("HH:mm");
                                                                    
                                                                    const newList = [...recurringPreviewList];
                                                                    newList[index].overrideStartTime = newTime;
                                                                    newList[index].overrideEndTime = newEnd;
                                                                    newList[index].showOverridePicker = false;
                                                                    setRecurringPreviewList(newList);
                                                                }}
                                                                options={[
                                                                    "08:00", "08:15", "08:30", "08:45",
                                                                    "09:00", "09:15", "09:30", "09:45",
                                                                    "10:00", "10:15", "10:30", "10:45",
                                                                    "11:00", "11:15", "11:30", "11:45",
                                                                    "12:00", "12:15", "12:30", "12:45",
                                                                    "13:00", "13:15", "13:30", "13:45",
                                                                    "14:00", "14:15", "14:30", "14:45",
                                                                    "15:00", "15:15", "15:30", "15:45",
                                                                    "16:00", "16:15", "16:30", "16:45",
                                                                    "17:00", "17:15", "17:30", "17:45",
                                                                    "18:00", "18:15", "18:30", "18:45",
                                                                    "19:00", "19:15", "19:30", "19:45",
                                                                    "20:00"
                                                                ].map(t => ({ label: t, value: t }))}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </Space>
                                        );
                                    }
                                }
                            ]}
                        />
                    </div>
                    <Alert
                        message={
                            <div>
                                Mọi chỉnh sửa/chọn bỏ qua phía trên sẽ được hệ thống áp dụng khi bạn click nút <b>Xác nhận đặt lịch định kỳ</b> phía dưới.
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                </div>
            )}
        </div>
    );
}
