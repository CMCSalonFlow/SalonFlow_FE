import {
    Form,
    Input,
    Modal,
    Switch,
    Tabs,
    TimePicker,
    Space,
    Row,
    Col,
    List,
    Typography
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const { Text } = Typography;

const DAYS_OF_WEEK = [
    { key: 1, name: "Thứ Hai" },
    { key: 2, name: "Thứ Ba" },
    { key: 3, name: "Thứ Tư" },
    { key: 4, name: "Thứ Năm" },
    { key: 5, name: "Thứ Sáu" },
    { key: 6, name: "Thứ Bảy" },
    { key: 0, name: "Chủ Nhật" }
];

const defaultHours = () =>
    DAYS_OF_WEEK.map(d => ({
        dayOfWeek: d.key,
        dayName: d.name,
        isClosed: false,
        openTime: dayjs("09:00:00", "HH:mm:ss"),
        closeTime: dayjs("21:00:00", "HH:mm:ss")
    }));

export default function BranchModal({
    open,
    onCancel,
    onSubmit,
    editing
}) {
    const [form] = Form.useForm();
    const [hours, setHours] = useState(defaultHours());
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        if (open) {
            setActiveTab("general");
            if (editing) {
                form.setFieldsValue(editing);
                if (editing.hours && editing.hours.length > 0) {
                    const mappedHours = DAYS_OF_WEEK.map(day => {
                        const match = editing.hours.find(h => h.dayOfWeek === day.key);
                        return {
                            dayOfWeek: day.key,
                            dayName: day.name,
                            isClosed: match ? match.isClosed : false,
                            openTime: match?.openTime
                                ? dayjs(match.openTime, "HH:mm:ss")
                                : dayjs("09:00:00", "HH:mm:ss"),
                            closeTime: match?.closeTime
                                ? dayjs(match.closeTime, "HH:mm:ss")
                                : dayjs("21:00:00", "HH:mm:ss")
                        };
                    });
                    setHours(mappedHours);
                } else {
                    setHours(defaultHours());
                }
            } else {
                form.resetFields();
                setHours(defaultHours());
            }
        }
    }, [editing, open]);

    const handleHoursChange = (dayKey, field, value) => {
        setHours(prev =>
            prev.map(item =>
                item.dayOfWeek === dayKey ? { ...item, [field]: value } : item
            )
        );
    };

    const handleOk = async () => {
        const values = await form.validateFields();
        const hoursPayload = hours.map(h => ({
            dayOfWeek: h.dayOfWeek,
            isClosed: h.isClosed,
            openTime: h.isClosed ? null : h.openTime.format("HH:mm:ss"),
            closeTime: h.isClosed ? null : h.closeTime.format("HH:mm:ss")
        }));

        onSubmit({
            ...values,
            hours: hoursPayload
        });
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            title={editing ? "Cập nhật chi nhánh" : "Thêm chi nhánh"}
            destroyOnClose
            width={600}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 10 }}>
                <Tabs.TabPane tab="Thông tin chung" key="general">
                    <Form
                        layout="vertical"
                        form={form}
                        style={{ marginTop: 10 }}
                    >
                        <Form.Item
                            label="Tên chi nhánh"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập tên chi nhánh"
                                }
                            ]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="phone"
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    type: "email",
                                    message: "Email không hợp lệ"
                                }
                            ]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Địa chỉ"
                            name="address"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập địa chỉ"
                                }
                            ]}
                        >
                            <Input.TextArea
                                rows={3}
                            />
                        </Form.Item>

                        {editing && (
                            <Form.Item
                                label="Hoạt động"
                                name="isActive"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                        )}
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Giờ hoạt động" key="hours">
                    <div style={{ marginTop: 15 }}>
                        <List
                            size="small"
                            bordered
                            dataSource={hours}
                            renderItem={item => (
                                <List.Item style={{ padding: "12px 16px" }}>
                                    <Row style={{ width: "100%", alignItems: "center" }} gutter={16}>
                                        <Col span={7}>
                                            <Text strong>{item.dayName}</Text>
                                        </Col>
                                        <Col span={5}>
                                            <Switch
                                                checked={!item.isClosed}
                                                onChange={(checked) => handleHoursChange(item.dayOfWeek, "isClosed", !checked)}
                                                checkedChildren="Mở"
                                                unCheckedChildren="Nghỉ"
                                            />
                                        </Col>
                                        <Col span={12}>
                                            {!item.isClosed ? (
                                                <Space>
                                                    <TimePicker
                                                        value={item.openTime}
                                                        format="HH:mm"
                                                        onChange={(time) => handleHoursChange(item.dayOfWeek, "openTime", time)}
                                                        allowClear={false}
                                                        size="small"
                                                        placeholder="Giờ mở"
                                                    />
                                                    <Text>-</Text>
                                                    <TimePicker
                                                        value={item.closeTime}
                                                        format="HH:mm"
                                                        onChange={(time) => handleHoursChange(item.dayOfWeek, "closeTime", time)}
                                                        allowClear={false}
                                                        size="small"
                                                        placeholder="Giờ đóng"
                                                    />
                                                </Space>
                                            ) : (
                                                <Text type="secondary" style={{ fontSize: 13 }}>Nghỉ cả ngày</Text>
                                            )}
                                        </Col>
                                    </Row>
                                </List.Item>
                            )}
                        />
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    );
}