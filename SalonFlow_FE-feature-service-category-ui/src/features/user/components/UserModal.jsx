import {
    Modal,
    Form,
    Input
} from "antd";

export default function UserModal({
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
                    ? "Update User"
                    : "Create User"
            }
            onCancel={onCancel}
            onOk={() =>
                form.submit()
            }
        >

            <Form
                form={form}
                layout="vertical"
                initialValues={
                    initialValues
                }
                onFinish={
                    onSubmit
                }
            >

                {!initialValues && (
                    <>
                        <Form.Item
                            name="username"
                            label="Username"
                            rules={[
                                {
                                    required: true
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                {
                                    required: true
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                {
                                    required: true
                                }
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name="fullName"
                    label="Full Name"
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Phone"
                >
                    <Input />
                </Form.Item>

            </Form>

        </Modal>
    );
}