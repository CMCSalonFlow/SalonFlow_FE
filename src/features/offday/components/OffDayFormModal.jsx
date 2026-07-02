import React from "react";
import { Modal, Form, DatePicker, Input } from "antd";

const OffDayFormModal = ({ open, onCancel, onSubmit }) => {
    const [form] = Form.useForm();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            const data = {
                dateFrom: values.dateFrom.format("YYYY-MM-DD"),
                dateTo: values.dateTo.format("YYYY-MM-DD"),
                reason: values.reason,
            };

            await onSubmit(data);

            form.resetFields();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Thêm ngày nghỉ"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="Lưu"
            cancelText="Hủy"
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item
                    name="dateFrom"
                    label="Từ ngày"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn ngày bắt đầu",
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item
                    name="dateTo"
                    label="Đến ngày"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn ngày kết thúc",
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Lý do"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Nhập lý do nghỉ..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default OffDayFormModal;