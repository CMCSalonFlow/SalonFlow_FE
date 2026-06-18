import {
    Modal,
    Form,
    Input
} from "antd";

export default function RoleModal({
    open,
    onCancel,
    onSubmit,
    initialValues
}) {

    const [form] =
        Form.useForm();

    return (

        <Modal
            open={open}
            title={
                initialValues
                    ? "Update Role"
                    : "Create Role"
            }
            onCancel={onCancel}
            onOk={() =>
                form.submit()
            }
        >

            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={
                    initialValues
                }
            >

                {!initialValues && (
                    <>
                        <Form.Item
                            name="code"
                            label="Code"
                            rules={[
                                {
                                    required: true
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="Name"
                            rules={[
                                {
                                    required: true
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name="description"
                    label="Description"
                >
                    <Input.TextArea
                        rows={3}
                    />
                </Form.Item>

            </Form>

        </Modal>
    );
}