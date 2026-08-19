import React, { useState } from "react";
import { Modal, Form, DatePicker, Input, Radio, Select } from "antd";

const { RangePicker } = DatePicker;

const OffDayFormModal = ({ open, onCancel, onSubmit, branches = [], submitting = false }) => {
    const [form] = Form.useForm();
    const [scope, setScope] = useState("ALL");

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const [dateFrom, dateTo] = values.dateRange;

            const data = {
                title: values.title.trim(),
                dateFrom: dateFrom.format("YYYY-MM-DD"),
                dateTo: dateTo.format("YYYY-MM-DD"),
                isAllBranches: scope === "ALL",
                branchId: scope === "BRANCH" ? values.branchId : null,
                reason: values.reason ? values.reason.trim() : "",
            };

            await onSubmit(data);
            form.resetFields();
            setScope("ALL");
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setScope("ALL");
        onCancel();
    };

    return (
        <Modal
            title="Thêm Ngày Nghỉ Lễ / Đóng Cửa Hệ Thống"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText="Thêm ngày nghỉ"
            cancelText="Hủy"
            destroyOnClose
            width={540}
            style={{ borderRadius: 12 }}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ scope: "ALL" }}
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="title"
                    label="Tên ngày lễ / Dịp nghỉ chung"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên ngày lễ (Ví dụ: Tết Nguyên Đán, Quốc Khánh...)",
                        },
                    ]}
                >
                    <Input placeholder="Ví dụ: Tết Nguyên Đán 2026, Nghỉ mát Salon, Bảo trì chi nhánh..." style={{ borderRadius: 8 }} />
                </Form.Item>

                <Form.Item
                    name="scope"
                    label="Phạm vi áp dụng"
                    rules={[{ required: true }]}
                >
                    <Radio.Group
                        onChange={(e) => setScope(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="ALL">🌐 Toàn bộ Salon</Radio.Button>
                        <Radio.Button value="BRANCH">🏢 Chi nhánh cụ thể</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                {scope === "BRANCH" && (
                    <Form.Item
                        name="branchId"
                        label="Chọn Chi nhánh áp dụng"
                        rules={[{ required: true, message: "Vui lòng chọn chi nhánh" }]}
                    >
                        <Select placeholder="Chọn chi nhánh" style={{ borderRadius: 8 }}>
                            {branches.map((b) => (
                                <Select.Option key={b.id} value={b.id}>
                                    {b.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item
                    name="dateRange"
                    label="Khoảng thời gian nghỉ (Từ ngày - Đến ngày)"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn thời gian bắt đầu và kết thúc",
                        },
                    ]}
                >
                    <RangePicker
                        format="DD/MM/YYYY"
                        style={{ width: "100%", borderRadius: 8 }}
                        placeholder={["Từ ngày", "Đến ngày"]}
                    />
                </Form.Item>

                <Form.Item name="reason" label="Ghi chú / Lý do (Không bắt buộc)">
                    <Input.TextArea
                        rows={3}
                        placeholder="Nhập thông báo gửi đến khách hàng hoặc ghi chú thêm..."
                        style={{ borderRadius: 8 }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default OffDayFormModal;