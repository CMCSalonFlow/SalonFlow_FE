import { Modal, Form, DatePicker, Select, Input, message } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import offdayApi from "../api/offdayApi";

const { Option } = Select;
const { TextArea } = Input;

export default function StaffLeaveFormModal({ open, onClose, onSuccess }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);
            const [dateFromObj, dateToObj] = values.dateRange;
            const payload = {
                dateFrom: dateFromObj.format("YYYY-MM-DD"),
                dateTo: dateToObj.format("YYYY-MM-DD"),
                leaveType: values.leaveType || "PERSONAL",
                reason: values.reason?.trim()
            };

            await offdayApi.createLeaveRequest(payload);
            message.success("Tạo đơn xin nghỉ phép thành công! Đơn đã được gửi đến Quản lý/Owner.");
            form.resetFields();
            onSuccess && onSuccess();
            onClose();
        } catch (error) {
            message.error(error.response?.data?.message || "Lỗi khi tạo đơn xin nghỉ phép.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            title="Nộp Đơn Xin Nghỉ Phép Cá Nhân"
            okText="Gửi đơn xin nghỉ"
            cancelText="Hủy bỏ"
            confirmLoading={submitting}
            onCancel={onClose}
            onOk={() => form.submit()}
            destroyOnClose
            style={{ top: 40 }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ leaveType: "PERSONAL" }}
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="dateRange"
                    label="Thời gian xin nghỉ"
                    rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian nghỉ phép!" }]}
                >
                    <DatePicker.RangePicker
                        style={{ width: "100%" }}
                        size="large"
                        format="DD/MM/YYYY"
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                        placeholder={["Từ ngày", "Đến ngày"]}
                    />
                </Form.Item>

                <Form.Item
                    name="leaveType"
                    label="Loại hình nghỉ phép"
                    rules={[{ required: true, message: "Vui lòng chọn loại nghỉ phép!" }]}
                >
                    <Select size="large">
                        <Option value="PERSONAL">Nghỉ việc riêng</Option>
                        <Option value="SICK">Nghỉ ốm / Bệnh</Option>
                        <Option value="ANNUAL">Nghỉ phép năm</Option>
                        <Option value="OTHER">Khác</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Lý do xin nghỉ phép"
                    rules={[{ required: true, message: "Vui lòng nhập chi tiết lý do xin nghỉ!" }]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Mô tả ngắn gọn lý do xin nghỉ phép để Quản lý/Owner xem xét..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
