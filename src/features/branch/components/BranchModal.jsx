import {
    Form,
    Input,
    Modal,
    Switch
} from "antd";
import { useEffect } from "react";

export default function BranchModal({
    open,
    onCancel,
    onSubmit,
    editing
}) {

    const [form] = Form.useForm();

    useEffect(() => {

        if (editing) {

            form.setFieldsValue(editing);

        } else {

            form.resetFields();

        }

    }, [editing]);

    const handleOk = async () => {

        const values =
            await form.validateFields();

        onSubmit(values);
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            title={
                editing
                    ? "Cập nhật chi nhánh"
                    : "Thêm chi nhánh"
            }
            destroyOnClose
        >

            <Form
                layout="vertical"
                form={form}
            >

                <Form.Item
                    label="Tên chi nhánh"
                    name="name"
                    rules={[
                        {
                            required: true
                        }
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Số điện thoại"
                    name="phone"
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[
                        {
                            required: true
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

        </Modal>
    );
}