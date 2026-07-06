import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Space, Button, List, Tag, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { getCategoriesApi } from "../api/serviceApi";

export default function ServiceFormModal({ visible, onCancel, onSubmit, initialValues }) {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [photoUrls, setPhotoUrls] = useState([]);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategoriesApi();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        if (visible) {
            fetchCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name,
                    price: initialValues.price,
                    durationMinutes: initialValues.durationMinutes,
                    categoryId: initialValues.categoryId,
                    description: initialValues.description,
                    isActive: initialValues.isActive !== false
                });
                setPhotoUrls(initialValues.images || []);
            } else {
                form.resetFields();
                form.setFieldsValue({ isActive: true });
                setPhotoUrls([]);
            }
        }
    }, [visible, initialValues, form]);

    const handleAddPhoto = () => {
        if (!newPhotoUrl.trim()) return;
        if (!newPhotoUrl.startsWith("http://") && !newPhotoUrl.startsWith("https://")) {
            message.warning("Vui lòng nhập URL ảnh hợp lệ bắt đầu bằng http:// hoặc https://");
            return;
        }
        setPhotoUrls([...photoUrls, newPhotoUrl.trim()]);
        setNewPhotoUrl("");
    };

    const handleRemovePhoto = (index) => {
        setPhotoUrls(photoUrls.filter((_, i) => i !== index));
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                images: photoUrls
            };
            onSubmit(payload);
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    return (
        <Modal
            title={initialValues ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={600}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <Form.Item
                    name="name"
                    label="Tên dịch vụ"
                    rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ!" }]}
                >
                    <Input placeholder="Ví dụ: Cắt tóc nam Standard" />
                </Form.Item>

                <Form.Item
                    name="categoryId"
                    label="Danh mục dịch vụ"
                >
                    <Select placeholder="Chọn danh mục" allowClear>
                        {categories.map(cat => (
                            <Select.Option key={cat.id} value={cat.id}>
                                {cat.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <div style={{ display: "flex", gap: 16 }}>
                    <Form.Item
                        name="price"
                        label="Giá dịch vụ (đ)"
                        rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
                        style={{ flex: 1 }}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={value => value.replace(/\$\s?|(,*)/g, "")}
                            placeholder="Ví dụ: 80,000"
                        />
                    </Form.Item>

                    <Form.Item
                        name="durationMinutes"
                        label="Thời gian thực hiện (phút)"
                        rules={[
                            { required: true, message: "Vui lòng nhập thời gian!" },
                            {
                                validator: (_, value) => {
                                    if (value && (value <= 0 || value % 15 !== 0)) {
                                        return Promise.reject("Thời gian phải là bội số của 15 phút!");
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                        style={{ flex: 1 }}
                    >
                        <Select placeholder="Chọn thời gian">
                            <Select.Option value={15}>15 phút</Select.Option>
                            <Select.Option value={30}>30 phút</Select.Option>
                            <Select.Option value={45}>45 phút</Select.Option>
                            <Select.Option value={60}>60 phút</Select.Option>
                            <Select.Option value={75}>75 phút</Select.Option>
                            <Select.Option value={90}>90 phút</Select.Option>
                            <Select.Option value={120}>120 phút</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea placeholder="Mô tả ngắn gọn về dịch vụ..." rows={3} />
                </Form.Item>

                <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
                    <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm ngưng" />
                </Form.Item>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8 }}>Album hình ảnh dịch vụ</label>
                    <Space.Compact style={{ width: "100%", marginBottom: 12 }}>
                        <Input
                            placeholder="Nhập URL hình ảnh dịch vụ (ví dụ: https://...)"
                            value={newPhotoUrl}
                            onChange={e => setNewPhotoUrl(e.target.value)}
                            onPressEnter={handleAddPhoto}
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPhoto}>
                            Thêm
                        </Button>
                    </Space.Compact>

                    <List
                        size="small"
                        bordered
                        dataSource={photoUrls}
                        renderItem={(url, idx) => (
                            <List.Item
                                actions={[
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemovePhoto(idx)} />
                                ]}
                            >
                                <Space>
                                    <img src={url} alt="Service Preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                                    <span style={{ fontSize: 12, color: "#8c8c8c", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", whiteSpace: "nowrap" }}>
                                        {url}
                                    </span>
                                </Space>
                            </List.Item>
                        )}
                        locale={{ emptyText: "Chưa có hình ảnh nào." }}
                    />
                </div>
            </Form>
        </Modal>
    );
}
