import { Modal, Form, Input, Select, message } from "antd";
import { useEffect, useState } from "react";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid";

export default function ShiftTemplateFormModal({
    open,
    onCancel,
    onSuccess,
    initialValues,
    users = [],
    branches = [],
}) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState([]); // [{ dayOfWeek, startTime, endTime }]

    const isEditing = !!(initialValues && initialValues.id);

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    userId: initialValues.userId,
                    branchId: initialValues.branchId,
                    name: initialValues.name,
                    description: initialValues.description,
                });
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setDetails(
                    (initialValues.details || []).map((d) => ({
                        dayOfWeek: d.dayOfWeek,
                        startTime: d.startTime,
                        endTime: d.endTime,
                    }))
                );
            } else {
                form.resetFields();
                setDetails([]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialValues]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            // Validate phải có ít nhất 1 ngày
            if (details.length === 0) {
                message.error("Vui lòng chọn ít nhất 1 ngày làm việc");
                return;
            }

            // Validate giờ hợp lệ
            for (const d of details) {
                if (!d.startTime || !d.endTime) {
                    message.error("Vui lòng điền đầy đủ giờ bắt đầu và kết thúc");
                    return;
                }
                if (d.startTime >= d.endTime) {
                    message.error("Giờ kết thúc phải sau giờ bắt đầu");
                    return;
                }
            }

            setLoading(true);
            await onSuccess({ ...values, details });
        } catch {
            // validation error
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEditing ? "Cập nhật template ca làm việc" : "Tạo template ca làm việc"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText={isEditing ? "Cập nhật" : "Tạo mới"}
            cancelText="Hủy"
            width={640}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="userId"
                    label="Nhân viên"
                    rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                >
                    <Select
                        placeholder="Chọn nhân viên"
                        options={users.map((u) => ({
                            value: u.id,
                            label: u.fullName || u.username,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="branchId"
                    label="Chi nhánh"
                    rules={[{ required: true, message: "Vui lòng chọn chi nhánh" }]}
                >
                    <Select
                        placeholder="Chọn chi nhánh"
                        disabled={true}
                        options={branches.map((b) => ({
                            value: b.id,
                            label: b.name,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Tên template"
                    rules={[{ required: true, message: "Vui lòng nhập tên template" }]}
                >
                    <Input placeholder="VD: Ca sáng tuần chẵn, Lịch cố định..." />
                </Form.Item>

                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={2} placeholder="Ghi chú thêm (không bắt buộc)" />
                </Form.Item>

                <Form.Item label="Lịch làm việc theo tuần" required>
                    <WeeklyScheduleGrid
                        value={details}
                        onChange={setDetails}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}