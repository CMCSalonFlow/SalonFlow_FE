import { useEffect, useState } from "react";
import { Modal, Form, Input, InputNumber, Switch, Table, Typography, Space, Tag, Alert } from "antd";

const { Text } = Typography;

export default function BundleFormModal({ visible, onCancel, onSubmit, initialValues, services }) {
    const [form] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [itemsConfig, setItemsConfig] = useState({}); // Maps serviceId -> { displayOrder }

    useEffect(() => {
        if (visible) {
            if (initialValues) {
                form.setFieldsValue({
                    name: initialValues.name,
                    price: initialValues.price,
                    description: initialValues.description,
                    isActive: initialValues.isActive !== false
                });
                
                // Initialize selected services and their display order
                const initialSelectedKeys = initialValues.items?.map(item => item.serviceId) || [];
                setSelectedRowKeys(initialSelectedKeys);

                const config = {};
                initialValues.items?.forEach(item => {
                    config[item.serviceId] = { displayOrder: item.displayOrder || 0 };
                });
                setItemsConfig(config);
            } else {
                form.resetFields();
                form.setFieldsValue({ isActive: true });
                setSelectedRowKeys([]);
                setItemsConfig({});
            }
        }
    }, [visible, initialValues, form]);

    // Calculate auto stats
    const selectedServices = services.filter(s => selectedRowKeys.includes(s.id));
    const totalDuration = selectedServices.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const originalPrice = selectedServices.reduce((acc, curr) => acc + parseFloat(curr.price || 0), 0);

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
        // Initialize display order for new selections
        setItemsConfig(prev => {
            const next = { ...prev };
            newSelectedRowKeys.forEach((key, index) => {
                if (!next[key]) {
                    next[key] = { displayOrder: index + 1 };
                }
            });
            return next;
        });
    };

    const handleOrderChange = (serviceId, orderValue) => {
        setItemsConfig(prev => ({
            ...prev,
            [serviceId]: { ...prev[serviceId], displayOrder: orderValue || 0 }
        }));
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (selectedRowKeys.length < 2) {
                return; // Ant Design rules/alerts will prevent or we display a message
            }

            const itemsPayload = selectedRowKeys.map(serviceId => ({
                serviceId,
                displayOrder: itemsConfig[serviceId]?.displayOrder || 0
            }));

            const payload = {
                ...values,
                items: itemsPayload
            };
            onSubmit(payload);
        } catch (error) {
            console.error("Form validation failed:", error);
        }
    };

    const columns = [
        {
            title: "Tên dịch vụ",
            dataIndex: "name",
            key: "name",
            width: "40%"
        },
        {
            title: "Thời gian",
            dataIndex: "durationMinutes",
            key: "durationMinutes",
            width: "20%",
            render: (minutes) => <Tag color="blue">{minutes} phút</Tag>
        },
        {
            title: "Giá gốc",
            dataIndex: "price",
            key: "price",
            width: "20%",
            render: (price) => `${parseFloat(price).toLocaleString()} đ`
        },
        {
            title: "Thứ tự hiển thị",
            key: "displayOrder",
            width: "20%",
            render: (_, record) => {
                const isSelected = selectedRowKeys.includes(record.id);
                if (!isSelected) return null;
                return (
                    <InputNumber
                        min={0}
                        size="small"
                        style={{ width: "80px" }}
                        value={itemsConfig[record.id]?.displayOrder || 0}
                        onChange={(val) => handleOrderChange(record.id, val)}
                    />
                );
            }
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange
    };

    return (
        <Modal
            title={initialValues ? "Chỉnh sửa Combo/Gói dịch vụ" : "Tạo Combo/Gói dịch vụ mới"}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okButtonProps={{ disabled: selectedRowKeys.length < 2 }}
            width={700}
            destroyOnClose
        >
            <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <Form.Item
                    name="name"
                    label="Tên Combo"
                    rules={[{ required: true, message: "Vui lòng nhập tên combo!" }]}
                >
                    <Input placeholder="Ví dụ: Combo Cắt Tóc & Gội Đầu Thư Giãn" />
                </Form.Item>

                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea placeholder="Mô tả ưu điểm và các dịch vụ đi kèm trong gói combo..." rows={3} />
                </Form.Item>

                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <Form.Item
                        name="price"
                        label="Giá Combo ưu đãi (đ)"
                        rules={[{ required: true, message: "Vui lòng nhập giá ưu đãi!" }]}
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: "100%" }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={value => value.replace(/\$\s?|(,*)/g, "")}
                            placeholder="Ví dụ: 120,000"
                        />
                    </Form.Item>

                    <Form.Item
                        name="isActive"
                        label="Trạng thái"
                        valuePropName="checked"
                        style={{ flex: 1, marginBottom: 0 }}
                    >
                        <Switch checkedChildren="Kích hoạt" unCheckedChildren="Tạm ngưng" />
                    </Form.Item>
                </div>

                <div style={{ marginTop: 24, marginBottom: 12 }}>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                        Chọn dịch vụ đi kèm (Chọn ít nhất 2 dịch vụ)
                    </Text>

                    {selectedRowKeys.length < 2 && (
                        <Alert
                            message="Vui lòng chọn ít nhất 2 dịch vụ để tạo gói combo dịch vụ ưu đãi."
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    {/* Auto calculations presentation */}
                    <div style={{ display: "flex", justifyContent: "space-between", background: "#f5f5f5", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>
                        <div>
                            <Text type="secondary">Tổng giá gốc (gạch ngang): </Text>
                            <Text delete strong style={{ fontSize: 15, color: "#8c8c8c" }}>
                                {originalPrice.toLocaleString()} đ
                            </Text>
                        </div>
                        <div>
                            <Text type="secondary">Tổng thời gian (tự động): </Text>
                            <Tag color="cyan" style={{ fontSize: 14, padding: "2px 8px" }}>
                                {totalDuration} phút
                            </Tag>
                        </div>
                    </div>

                    <Table
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={services.map(s => ({ ...s, key: s.id }))}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        bordered
                    />
                </div>
            </Form>
        </Modal>
    );
}
