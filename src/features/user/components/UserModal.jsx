import { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";

export default function UserModal({
    open,
    onCancel,
    onSubmit,
    initialValues,
    roles
}) {

    const [form] = Form.useForm();

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }

        // wait form mount
        setTimeout(() => {
            form.setFieldsValue({
            username: initialValues?.username,
            email: initialValues?.email,
            fullName: initialValues?.fullName,
            phone: initialValues?.phone,
            roleIds: initialValues?.roleIds || []
        });
        }, 0);

    }, [open, initialValues]);

    return (
        <Modal
            open={open}
            title={initialValues ? "Update User" : "Create User"}
            onCancel={onCancel}
            onOk={() => form.submit()}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
            >
                {!initialValues && (
                    <>
                        <Form.Item name="username" label="Username">
                            <Input />
                        </Form.Item>

                        <Form.Item name="email" label="Email">
                            <Input />
                        </Form.Item>

                        <Form.Item name="password" label="Password">
                            <Input.Password />
                        </Form.Item>
                    </>
                )}

                <Form.Item name="fullName" label="Full Name">
                    <Input />
                </Form.Item>

                <Form.Item name="phone" label="Phone">
                    <Input />
                </Form.Item>

                <Form.Item name="roleIds" label="Roles">
                    <Select
                        mode="multiple"
                        options={roles?.map(r => ({
                            value: r.id,
                            label: r.name || r.code
                        }))}
                    />
                </Form.Item>

            </Form>
        </Modal>
    );
}