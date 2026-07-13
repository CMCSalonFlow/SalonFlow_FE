import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Upload, Button, message, Space, Avatar } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { uploadMediaApi } from "@/features/media/api/mediaApi";
import { getUsersApi } from "@/features/user/api/userApi";
import { getCategoriesApi } from "@/features/service/api/serviceApi";

/**
 * Modal Form dùng chung cho việc Thêm mới và Chỉnh sửa thông tin nhân viên.
 */
export default function StaffFormModal({ visible, onCancel, onSubmit, initialValues, services }) {
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [categories, setCategories] = useState([]);

    const selectedSpecialties = Form.useWatch("specialties", form) || [];
    const currentServiceIds = Form.useWatch("serviceIds", form) || [];

    // Lọc danh sách dịch vụ dựa trên chuyên môn/tag kỹ năng đã chọn
    const filteredServices = (services || []).filter(s => {
        if (selectedSpecialties.length === 0) return false;
        return selectedSpecialties.some(spec => spec && spec.trim().toLowerCase() === (s.categoryName || "").trim().toLowerCase());
    });

    // Tự động bỏ chọn các dịch vụ không còn thuộc nhóm chuyên môn đã chọn
    useEffect(() => {
        if (visible && selectedSpecialties.length > 0) {
            const matchedServiceIds = currentServiceIds.filter(id => {
                const s = services.find(item => item.id === id);
                if (!s) return false;
                return selectedSpecialties.some(spec => spec && spec.trim().toLowerCase() === (s.categoryName || "").trim().toLowerCase());
            });
            if (matchedServiceIds.length !== currentServiceIds.length) {
                form.setFieldsValue({ serviceIds: matchedServiceIds });
            }
        } else if (visible && selectedSpecialties.length === 0 && currentServiceIds.length > 0) {
            form.setFieldsValue({ serviceIds: [] });
        }
    }, [selectedSpecialties, services, form, visible]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategoriesApi();
                setCategories(data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        if (visible) {
            fetchCategories();
        }
    }, [visible]);

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
                    serviceIds: serviceIds,
                    email: initialValues.email || "",
                    phone: initialValues.phone || "",
                    password: ""
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



    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            
            // Định dạng lại các trường gửi lên Backend:
            // Chuyển mảng Specialties thành chuỗi phân tách bằng dấu phẩy
            const specialtiesString = values.specialties && values.specialties.length > 0
                ? values.specialties.join(", ")
                : "";

            const payload = {
                name: values.name,
                avatarUrl: values.avatarUrl,
                bio: values.bio,
                specialties: specialtiesString,
                serviceIds: values.serviceIds || [],
                email: values.email,
                phone: values.phone
            };

            if (values.password && values.password.trim() !== "") {
                payload.password = values.password;
            }

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

                        <Form.Item name="avatarUrl" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                    </div>
                </div>

                <Form.Item
                    name="specialties"
                    label="Chuyên môn / Tag kỹ năng"
                    tooltip="Chọn chuyên môn tương ứng với các danh mục dịch vụ"
                >
                    <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Chọn hoặc thêm chuyên môn..."
                        tokenSeparators={[","]}
                        options={categories.map(cat => ({
                            label: cat.name,
                            value: cat.name
                        }))}
                        size="large"
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
                        placeholder={selectedSpecialties.length === 0 ? "Vui lòng chọn chuyên môn / tag kỹ năng trước..." : "Chọn danh sách dịch vụ..."}
                        disabled={selectedSpecialties.length === 0}
                        optionFilterProp="label"
                        options={filteredServices.map(s => ({
                            label: `${s.name} (Danh mục: ${s.categoryName || "Chưa phân loại"} - ${parseFloat(s.price).toLocaleString()} đ - ${s.durationMinutes} phút)`,
                            value: s.id
                        }))}
                        size="large"
                    />
                </Form.Item>

                {!initialValues ? (
                    <div style={{ border: "1px solid #e6f7ff", padding: "16px", borderRadius: "8px", marginBottom: "20px", backgroundColor: "#f0f5ff" }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, color: "#1890ff" }}>Tài khoản đăng nhập</div>
                        <Form.Item
                            name="email"
                            label="Email đăng nhập"
                            rules={[
                                { required: true, message: "Vui lòng nhập Email!" },
                                { type: "email", message: "Email không đúng định dạng!" }
                            ]}
                            extra={<div style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}>Tài khoản đăng nhập của nhân viên sẽ được tạo với mật khẩu mặc định là <strong>Staff@123</strong></div>}
                        >
                            <Input placeholder="vi-du@email.com" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                        >
                            <Input placeholder="Ví dụ: 0987654321" size="large" />
                        </Form.Item>
                    </div>
                ) : (
                    initialValues.email && (
                        <div style={{ border: "1px solid #f5f5f5", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", backgroundColor: "#fafafa" }}>
                            <span style={{ color: "#8c8c8c" }}>Tài khoản liên kết: </span>
                            <strong style={{ color: "#595959" }}>{initialValues.email}</strong>
                            {initialValues.phone && (
                                <span style={{ marginLeft: 24 }}>
                                    <span style={{ color: "#8c8c8c" }}>SĐT: </span>
                                    <strong style={{ color: "#595959" }}>{initialValues.phone}</strong>
                                </span>
                            )}
                        </div>
                    )
                )}

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
