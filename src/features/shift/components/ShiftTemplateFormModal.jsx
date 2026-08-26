import { Modal, Form, Input, Select, message } from "antd";
import { useEffect, useState } from "react";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid";
import { getBranchApi } from "@/features/branch/api/branchApi";

export default function ShiftTemplateFormModal({
    open,
    onCancel,
    onSuccess,
    initialValues,
    users = [],
}) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState([]); // [{ dayOfWeek, startTime, endTime }]
    const [branchHours, setBranchHours] = useState([]);

    const isEditing = !!(initialValues && initialValues.id);

    useEffect(() => {
        if (!open) return;

        const bId = initialValues?.branchId;

        if (initialValues && initialValues.id) {
            form.setFieldsValue({
                userId: initialValues.userId,
                name: initialValues.name,
                description: initialValues.description,
            });
            setDetails(
                (initialValues.details || []).map((d) => ({
                    dayOfWeek: d.dayOfWeek,
                    startTime: d.startTime ? d.startTime.slice(0, 5) : "09:00",
                    endTime: d.endTime ? d.endTime.slice(0, 5) : "21:00",
                }))
            );
        } else {
            form.resetFields();
            setDetails([]);
        }

        if (bId) {
            getBranchApi(bId).then((bData) => {
                if (bData && bData.hours && bData.hours.length > 0) {
                    setBranchHours(bData.hours);
                    if (!initialValues || !initialValues.id) {
                        // Tự động bật và điền khung giờ mặc định theo giờ mở cửa của chi nhánh cho các ngày hoạt động
                        const defaultDetails = bData.hours
                            .filter((h) => !h.isClosed)
                            .map((h) => ({
                                dayOfWeek: h.dayOfWeek === 0 ? 7 : h.dayOfWeek,
                                startTime: h.openTime ? h.openTime.slice(0, 5) : "09:00",
                                endTime: h.closeTime ? h.closeTime.slice(0, 5) : "21:00",
                            }));
                        if (defaultDetails.length > 0) {
                            setDetails(defaultDetails);
                        }
                    }
                }
            }).catch((err) => {
                console.error("Error fetching branch hours:", err);
            });
        }
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
            await onSuccess({
                ...values,
                branchId: initialValues?.branchId,
                details
            });
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
            centered
            destroyOnClose
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
                        branchHours={branchHours}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}