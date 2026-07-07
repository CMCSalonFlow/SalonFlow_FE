import { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    Space,
    Button,
    List,
    message
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined
} from "@ant-design/icons";

import { getCategoriesApi } from "../api/serviceApi";

export default function ServiceFormModal({
    visible,
    onCancel,
    onSubmit,
    initialValues
}) {

    const [form] = Form.useForm();

    const depositRequired = Form.useWatch("depositRequired", form);

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
        if (!visible) return;
        if (initialValues) {
            form.setFieldsValue({

                name: initialValues.name,
                price: initialValues.price,
                durationMinutes: initialValues.durationMinutes,
                categoryId: initialValues.categoryId,
                description: initialValues.description,
                isActive: initialValues.isActive !== false,

                depositRequired:
                    initialValues.depositRequired ?? false,

                depositPercentage:
                    initialValues.depositPercentage
            });
            setPhotoUrls(initialValues.images || []);
        } else {
            form.resetFields();
            form.setFieldsValue({
                isActive: true,
                depositRequired: false,
                depositPercentage: null
            });
            setPhotoUrls([]);
        }
    }, [visible, initialValues, form]);
    const handleAddPhoto = () => {
        if (!newPhotoUrl.trim()) return;

        if (
            !newPhotoUrl.startsWith("http://") &&
            !newPhotoUrl.startsWith("https://")
        ) {
            message.warning(
                "Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://"
            );
            return;
        }
        setPhotoUrls([
            ...photoUrls,
            newPhotoUrl.trim()
        ]);
        setNewPhotoUrl("");
    };
    const handleRemovePhoto = (index) => {
        setPhotoUrls(
            photoUrls.filter((_, i) => i !== index)
        );
    };
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                depositRequired:
                    values.depositRequired ?? false,
                depositPercentage:
                    values.depositRequired
                        ? values.depositPercentage
                        : null,
                images: photoUrls
            };
            onSubmit(payload);
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <Modal
            title={
                initialValues
                    ? "Chỉnh sửa dịch vụ"
                    : "Thêm dịch vụ mới"
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={650}
            destroyOnClose
        >

            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 20 }}
            >

                <Form.Item
                    name="name"
                    label="Tên dịch vụ"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên dịch vụ!"
                        }
                    ]}
                >
                    <Input placeholder="Ví dụ: Cắt tóc nam Standard" />
                </Form.Item>

                <Form.Item
                    name="categoryId"
                    label="Danh mục dịch vụ"
                >
                    <Select
                        placeholder="Chọn danh mục"
                        allowClear
                    >
                        {categories.map(cat => (
                            <Select.Option
                                key={cat.id}
                                value={cat.id}
                            >
                                {cat.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <div
                    style={{
                        display: "flex",
                        gap: 16
                    }}
                >

                    <Form.Item
                        name="price"
                        label="Giá dịch vụ"
                        style={{ flex: 1 }}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập giá!"
                            }
                        ]}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            formatter={(value) =>
                                `${value}`.replace(
                                    /\B(?=(\d{3})+(?!\d))/g,
                                    ","
                                )
                            }
                            parser={(value) =>
                                value.replace(/\$\s?|(,*)/g, "")
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        name="durationMinutes"
                        label="Thời gian (phút)"
                        style={{ flex: 1 }}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn thời gian!"
                            }
                        ]}
                    >
                        <Select>
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

                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <Input.TextArea
                        rows={3}
                        placeholder="Mô tả ngắn..."
                    />
                </Form.Item>

                <Form.Item
                    name="depositRequired"
                    label="Yêu cầu đặt cọc"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="Có"
                        unCheckedChildren="Không"
                        onChange={(checked) => {

                            if (!checked) {

                                form.setFieldValue(
                                    "depositPercentage",
                                    null
                                );

                            }

                        }}
                    />
                </Form.Item>

                {depositRequired && (

                    <Form.Item
                        name="depositPercentage"
                        label="Tỷ lệ đặt cọc (%)"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tỷ lệ đặt cọc!"
                            },
                            {
                                type: "number",
                                min: 1,
                                max: 100,
                                message: "Giá trị phải từ 1 đến 100%"
                            }
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={100}
                            style={{ width: "100%" }}
                            addonAfter="%"
                        />
                    </Form.Item>

                )}

                <Form.Item
                    name="isActive"
                    label="Trạng thái"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="Hoạt động"
                        unCheckedChildren="Tạm ngưng"
                    />
                </Form.Item>

                <div style={{ marginBottom: 20 }}>

                    <label
                        style={{
                            display: "block",
                            marginBottom: 8
                        }}
                    >
                        Album hình ảnh
                    </label>

                    <Space.Compact
                        style={{
                            width: "100%",
                            marginBottom: 12
                        }}
                    >

                        <Input
                            placeholder="https://..."
                            value={newPhotoUrl}
                            onChange={(e) =>
                                setNewPhotoUrl(e.target.value)
                            }
                            onPressEnter={handleAddPhoto}
                        />

                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddPhoto}
                        >
                            Thêm
                        </Button>

                    </Space.Compact>

                    <List
                        bordered
                        size="small"
                        dataSource={photoUrls}
                        locale={{
                            emptyText:
                                "Chưa có hình ảnh."
                        }}
                        renderItem={(url, index) => (

                            <List.Item
                                actions={[
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                            handleRemovePhoto(index)
                                        }
                                    />
                                ]}
                            >

                                <Space>

                                    <img
                                        src={url}
                                        alt=""
                                        style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: "cover",
                                            borderRadius: 4
                                        }}
                                    />

                                    <span
                                        style={{
                                            maxWidth: 420,
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis"
                                        }}
                                    >
                                        {url}
                                    </span>
                                </Space>
                            </List.Item>
                        )}
                    />
                </div>
            </Form>
        </Modal>
    );
}