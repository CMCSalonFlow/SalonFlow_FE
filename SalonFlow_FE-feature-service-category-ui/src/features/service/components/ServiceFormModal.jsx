import {
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Upload,
    Button,
    message,
    Space,
    Image,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { uploadServiceImage } from "../api/serviceApi";

const { TextArea } = Input;

/**
 * Các mốc thời gian hợp lệ (bội số 15 phút).
 * Tương ứng với validate @DurationMultipleOf15 ở backend.
 */
const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240].map(
    (m) => ({
        value: m,
        label: m < 60
            ? `${m} phút`
            : `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ""}`,
    })
);

export default function ServiceFormModal({
    open,
    onCancel,
    onSuccess,
    initialValues,
    categories = [],
}) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]); // [{ url: string }]
    const [uploading, setUploading] = useState(false);

    const isEditing = !!initialValues;

    // Reset form khi mở modal
    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name,
                    categoryId: initialValues.categoryId,
                    price: initialValues.price,
                    durationMinutes: initialValues.durationMinutes,
                    description: initialValues.description,
                    isActive: initialValues.isActive,
                });
                setImages(
                    (initialValues.images || []).map((url) => ({ url }))
                );
            } else {
                form.resetFields();
                setImages([]);
            }
        }
    }, [open, initialValues]);

    const handleUpload = async (file) => {
        setUploading(true);
        try {
            const res = await uploadServiceImage(file);
            setImages((prev) => [...prev, { url: res.url }]);
            message.success("Upload ảnh thành công");
        } catch {
            message.error("Upload ảnh thất bại");
        } finally {
            setUploading(false);
        }
        return false; // Ngăn antd tự upload
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const payload = {
                ...values,
                images: images.map((img) => img.url),
            };

            await onSuccess(payload);
            setOpen(false);
        } catch {
            // validation error — không làm gì
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={isEditing ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText={isEditing ? "Cập nhật" : "Tạo mới"}
            cancelText="Hủy"
            width={600}
        >
            <Form form={form} layout="vertical">

                <Form.Item
                    name="name"
                    label="Tên dịch vụ"
                    rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
                >
                    <Input placeholder="VD: Cắt tóc nam, Gội đầu dưỡng sinh..." />
                </Form.Item>

                <Form.Item name="categoryId" label="Danh mục">
                    <Select
                        placeholder="Chọn danh mục (không bắt buộc)"
                        allowClear
                        options={categories.map((c) => ({
                            value: c.id,
                            label: c.name,
                        }))}
                    />
                </Form.Item>

                <Space style={{ width: "100%" }} size="large">
                    <Form.Item
                        name="price"
                        label="Giá (VNĐ)"
                        rules={[
                            { required: true, message: "Vui lòng nhập giá" },
                            { type: "number", min: 0, message: "Giá không được âm" },
                        ]}
                    >
                        <InputNumber
                            placeholder="50000"
                            formatter={(v) =>
                                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(v) => v?.replace(/,/g, "")}
                            style={{ width: 200 }}
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        name="durationMinutes"
                        label="Thời gian thực hiện"
                        rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
                        extra="Phải là bội số của 15 phút"
                    >
                        <Select
                            placeholder="Chọn thời gian"
                            options={DURATION_OPTIONS}
                            style={{ width: 180 }}
                        />
                    </Form.Item>
                </Space>

                <Form.Item name="description" label="Mô tả">
                    <TextArea
                        placeholder="Mô tả chi tiết về dịch vụ..."
                        rows={4}
                        showCount
                        maxLength={2000}
                    />
                </Form.Item>

                {isEditing && (
                    <Form.Item name="isActive" label="Trạng thái">
                        <Select
                            options={[
                                { value: true, label: "Đang hoạt động" },
                                { value: false, label: "Ngừng hoạt động" },
                            ]}
                        />
                    </Form.Item>
                )}

                {/* Upload ảnh */}
                <Form.Item label="Hình ảnh dịch vụ">
                    <Upload
                        beforeUpload={handleUpload}
                        showUploadList={false}
                        accept="image/*"
                        multiple
                    >
                        <Button
                            icon={<PlusOutlined />}
                            loading={uploading}
                        >
                            Thêm ảnh
                        </Button>
                    </Upload>

                    {images.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                marginTop: 12,
                            }}
                        >
                            {images.map((img, index) => (
                                <div
                                    key={index}
                                    style={{ position: "relative" }}
                                >
                                    <Image
                                        src={img.url}
                                        width={80}
                                        height={80}
                                        style={{
                                            objectFit: "cover",
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        style={{
                                            position: "absolute",
                                            top: -8,
                                            right: -8,
                                            borderRadius: "50%",
                                            padding: "0 4px",
                                        }}
                                        onClick={() => removeImage(index)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </Form.Item>
            </Form>
        </Modal>
    );
}
