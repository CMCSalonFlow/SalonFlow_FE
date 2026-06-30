import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Upload, Button, message, Space, Avatar } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { uploadMediaApi } from "@/features/media/api/mediaApi";

/**
 * Modal Form dùng chung cho việc Thêm mới và Chỉnh sửa thông tin nhân viên.
 */
export default function StaffFormModal({ visible, onCancel, onSubmit, initialValues, services }) {
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState("");

    // Đồng bộ dữ liệu khi mở Modal
    useEffect(() => {
        if (visible) {
            if (initialValues) {
                // Chuyển đổi chuỗi specialties (dạng "Cắt, Uốn, Gội") thành mảng để hiển thị dạng Tag Select
                const specialtiesArray = initialValues.specialties 
                    ? initialValues.specialties.split(",").map(s => s.trim()).filter(Boolean)
                    : [];

                // Chuyển đổi danh sách thực thể dịch vụ thành mảng ID
                const serviceIds = initialValues.services 
                    ? initialValues.services.map(s => s.id)
                    : [];

                form.setFieldsValue({
                    name: initialValues.name,
                    avatarUrl: initialValues.avatarUrl,
                    bio: initialValues.bio,
                    specialties: specialtiesArray,
                    serviceIds: serviceIds
                });
                setAvatarPreview(initialValues.avatarUrl || "");
            } else {
                form.resetFields();
                setAvatarPreview("");
            }
        }
    }, [visible, initialValues, form]);

    // Xử lý upload file lên server thông qua API
    const handleUpload = async ({ file, onSuccess, onError }) => {
        try {
            setUploading(true);
            const response = await uploadMediaApi(file);
            if (response && response.url) {
                form.setFieldsValue({ avatarUrl: response.url });
                setAvatarPreview(response.url);
                message.success("Tải ảnh đại diện lên thành công!");
                onSuccess(null, file);
            } else {
                throw new Error("Không nhận được URL ảnh từ máy chủ");
            }
        } catch (error) {
            message.error("Lỗi khi tải ảnh lên: " + (error.message || error));
            onError(error);
        } finally {
            setUploading(false);
        }
    };

    // Khi người dùng thay đổi thủ công ô nhập URL ảnh
    const handleAvatarUrlChange = (e) => {
        setAvatarPreview(e.target.value);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            
            // Định dạng lại các trường gửi lên Backend:
            // Chuyển mảng Specialties thành chuỗi phân tách bằng dấu phẩy
            const specialtiesString = values.specialties && values.specialties.length > 0
                ? values.specialties.join(", ")
                : "";

            const payload = {
                ...values,
                specialties: specialtiesString,
                serviceIds: values.serviceIds || []
            };

            onSubmit(payload);
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    return (
        <Modal
            title={initialValues ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={650}
            confirmLoading={uploading}
            destroyOnClose
            okText="Lưu lại"
            cancelText="Hủy bỏ"
        >
            <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ textAlign: "center" }}>
                        <Avatar
                            size={100}
                            src={avatarPreview}
                            icon={<UserOutlined />}
                            style={{ border: "2px solid #f0f0f0", marginBottom: 12 }}
                        />
                        <Upload
                            customRequest={handleUpload}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <Button icon={<UploadOutlined />} loading={uploading} size="small">
                                Chọn ảnh
                            </Button>
                        </Upload>
                    </div>

                    <div style={{ flex: 1 }}>
                        <Form.Item
                            name="name"
                            label="Tên nhân viên"
                            rules={[{ required: true, message: "Vui lòng nhập tên nhân viên!" }]}
                        >
                            <Input placeholder="Ví dụ: Nguyễn Văn A" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="avatarUrl"
                            label="Đường dẫn ảnh đại diện (URL)"
                        >
                            <Input 
                                placeholder="https://example.com/avatar.jpg" 
                                onChange={handleAvatarUrlChange}
                            />
                        </Form.Item>
                    </div>
                </div>

                <Form.Item
                    name="specialties"
                    label="Chuyên môn / Tag kỹ năng"
                    tooltip="Nhập kỹ năng nổi bật rồi nhấn Enter để tạo tag (Ví dụ: Cắt tóc nam, Uốn phồng, Gội đầu)"
                >
                    <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Thêm kỹ năng nổi bật của nhân viên..."
                        tokenSeparators={[","]}
                    />
                </Form.Item>

                <Form.Item
                    name="serviceIds"
                    label="Các dịch vụ được phép thực hiện"
                    rules={[{ required: true, message: "Chọn ít nhất một dịch vụ!" }]}
                >
                    <Select
                        mode="multiple"
                        allowClear
                        style={{ width: "100%" }}
                        placeholder="Chọn danh sách dịch vụ..."
                        optionFilterProp="label"
                        options={services.map(s => ({
                            label: `${s.name} (${parseFloat(s.price).toLocaleString()} đ - ${s.durationMinutes} phút)`,
                            value: s.id
                        }))}
                        size="large"
                    />
                </Form.Item>

                <Form.Item name="bio" label="Tiểu sử / Mô tả thêm">
                    <Input.TextArea 
                        placeholder="Mô tả kinh nghiệm, phong cách làm việc của nhân viên..." 
                        rows={3} 
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
