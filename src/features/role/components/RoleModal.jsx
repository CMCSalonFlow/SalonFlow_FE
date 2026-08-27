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
    const [form] = Form.useForm();

    return (
        <Modal
            open={open}
            title={initialValues ? "Cập nhật thông tin Vai trò" : "Thêm mới Vai trò Hệ thống"}
            onCancel={onCancel}
            onOk={() => form.submit()}
            okText={initialValues ? "Lưu thay đổi" : "Tạo vai trò"}
            cancelText="Hủy bỏ"
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={initialValues}
                style={{ marginTop: 16 }}
            >
                {!initialValues && (
                    <>
                        <Form.Item
                            name="code"
                            label="Mã vai trò (Code)"
                            rules={[{ required: true, message: "Vui lòng nhập mã vai trò!" }]}
                        >
                            <Input placeholder="Ví dụ: SALON_OWNER" />
                        </Form.Item>

                        <Form.Item
                            name="name"
                            label="Tên hiển thị"
                            rules={[{ required: true, message: "Vui lòng nhập tên hiển thị!" }]}
                        >
                            <Input placeholder="Ví dụ: Chủ Salon" />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name="description"
                    label="Mô tả vai trò"
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Mô tả quyền hạn và phạm vi sử dụng của vai trò..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}