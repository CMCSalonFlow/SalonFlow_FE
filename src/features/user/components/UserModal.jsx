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

        setTimeout(() => {
            form.setFieldsValue({
                username: initialValues?.username || "",
                email: initialValues?.email || "",
                fullName: initialValues?.fullName || "",
                phone: initialValues?.phone || "",
                roleIds: initialValues?.roleIds || []
            });
        }, 0);
    }, [open, initialValues]);

    return (
        <Modal
            open={open}
            title={initialValues ? "Cập Nhật Thông Tin Người Dùng" : "Thêm Mới Người Dùng"}
            onCancel={onCancel}
            onOk={() => form.submit()}
            okText={initialValues ? "Cập nhật" : "Tạo người dùng"}
            cancelText="Hủy bỏ"
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
            >
                {!initialValues && (
                    <>
                        <Form.Item
                            name="username"
                            label="Tên đăng nhập"
                            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
                        >
                            <Input placeholder="Ví dụ: tduc4" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Địa chỉ Email"
                            rules={[
                                { required: true, message: "Vui lòng nhập địa chỉ email!" },
                                { type: "email", message: "Địa chỉ email không đúng định dạng!" }
                            ]}
                        >
                            <Input placeholder="Ví dụ: user@gmail.com" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[
                                { required: true, message: "Vui lòng nhập mật khẩu!" },
                                { min: 6, message: "Mật khẩu phải từ 6 ký tự trở lên!" }
                            ]}
                        >
                            <Input.Password placeholder="Mật khẩu khởi tạo" />
                        </Form.Item>
                    </>
                )}

                <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                >
                    <Input placeholder="Ví dụ: Nguyễn Văn A" />
                </Form.Item>

                <Form.Item
                    name="phone"
                    label="Số điện thoại"
                >
                    <Input placeholder="Ví dụ: 0912345678" />
                </Form.Item>

                <Form.Item
                    name="roleIds"
                    label="Phân quyền Vai trò"
                    rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 vai trò!" }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Chọn vai trò..."
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