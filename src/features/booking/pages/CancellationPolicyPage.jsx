import { useEffect, useState } from "react";
import {
    Card,
    Form,
    InputNumber,
    Switch,
    Button,
    message,
    Spin
} from "antd";

import {
    getCancellationPolicyApi,
    updateCancellationPolicyApi
} from "../api/bookingApi";

export default function CancellationPolicyPage() {

    // TODO: Sau này lấy salonId từ user đăng nhập
    const salonId = 1;

    const [form] = Form.useForm();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPolicy();
    }, []);

    const loadPolicy = async () => {
        try {
            setLoading(true);

            const data = await getCancellationPolicyApi(salonId);

            form.setFieldsValue({
                freeCancelHours: data.freeCancelHours,
                feePercentage: data.feePercentage,
                isActive: data.isActive
            });

        } catch (error) {
            message.error("Không tải được chính sách hủy");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSaving(true);

            await updateCancellationPolicyApi(salonId, values);

            // Load lại dữ liệu sau khi cập nhật
            await loadPolicy();

            message.success("Cập nhật thành công");

        } catch (error) {
            message.error("Cập nhật thất bại");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 40 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Card title="Chính sách hủy lịch">
            <Form
                layout="vertical"
                form={form}
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Số giờ được hủy miễn phí"
                    name="freeCancelHours"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập số giờ"
                        }
                    ]}
                >
                    <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item
                    label="Phí hủy (%)"
                    name="feePercentage"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập phí hủy"
                        }
                    ]}
                >
                    <InputNumber
                        min={0}
                        max={100}
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item
                    label="Đang áp dụng"
                    name="isActive"
                    valuePropName="checked"
                >
                    <Switch />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                >
                    Lưu
                </Button>
            </Form>
        </Card>
    );
}