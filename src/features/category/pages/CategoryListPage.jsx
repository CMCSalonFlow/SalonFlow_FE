import { useEffect, useState, useMemo } from "react";
import {
    Button, Modal, Input, message,
    Typography, Card, Space, Tag, Spin, Form, Table, Popconfirm, Tooltip
} from "antd";
import { PlusOutlined, SearchOutlined, AppstoreOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "../api/categoryApi";

const { Title, Paragraph, Text } = Typography;

export default function CategoryListPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState("");

    const [form] = Form.useForm();

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(data || []);
        } catch (error) {
            message.error(error.response?.data?.message || "Tải danh sách danh mục thất bại");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const filteredCategories = useMemo(() => {
        if (!searchKeyword.trim()) return categories;
        const kw = searchKeyword.toLowerCase();
        return categories.filter(c =>
            c.name?.toLowerCase().includes(kw) ||
            c.description?.toLowerCase().includes(kw)
        );
    }, [categories, searchKeyword]);

    const handleOpenModal = (category = null) => {
        setEditingCategory(category);
        if (category) {
            form.setFieldsValue({
                name: category.name,
                color: category.color || "#1890ff",
                description: category.description || ""
            });
        } else {
            form.setFieldsValue({
                name: "",
                color: "#1890ff",
                description: ""
            });
        }
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const payload = {
                name: values.name.trim(),
                color: typeof values.color === "string" ? values.color : values.color?.toHexString(),
                description: values.description ? values.description.trim() : null
            };

            if (editingCategory) {
                await updateCategory(editingCategory.id, payload);
                message.success("Cập nhật danh mục thành công!");
            } else {
                await createCategory(payload);
                message.success("Thêm danh mục mới thành công!");
            }

            setModalVisible(false);
            loadCategories();
        } catch (err) {
            if (err?.errorFields) return;
            message.error(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCategory(id);
            message.success("Đã xóa danh mục!");
            loadCategories();
        } catch (error) {
            message.error(error.response?.data?.message || "Xóa danh mục thất bại!");
        }
    };

    // ── Table Columns Config ──────────────────────────────────────
    const columns = [
        {
            title: "STT",
            key: "stt",
            width: 70,
            align: "center",
            render: (_, __, index) => (
                <Tag style={{ borderRadius: 10, fontWeight: 700, padding: "0 8px" }} color="geekblue">
                    #{index + 1}
                </Tag>
            )
        },
        {
            title: "Tên danh mục",
            dataIndex: "name",
            key: "name",
            width: 260,
            render: (text) => (
                <Text strong style={{ fontSize: 14, color: "#1f1f1f" }}>
                    {text}
                </Text>
            )
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            render: (text) => (
                <Text type={text ? "default" : "secondary"} style={{ fontSize: 13, color: text ? "#434343" : "#bfbfbf" }}>
                    {text || "Chưa có mô tả"}
                </Text>
            )
        },
        {
            title: "Hành động",
            key: "actions",
            width: 130,
            align: "center",
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenModal(record)}
                            style={{ borderRadius: 6, color: "#1890ff" }}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Xóa danh mục này?"
                        description="Các dịch vụ thuộc danh mục này có thể bị ảnh hưởng."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa danh mục">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                style={{ borderRadius: 6 }}
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
            {/* Header & Actions Bar */}
            <Card
                style={{
                    borderRadius: 16,
                    marginBottom: 20,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                }}
            >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <Space size={12} align="center">
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: "#e6f7ff",
                                color: "#1890ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 22
                            }}
                        >
                            <AppstoreOutlined />
                        </div>
                        <div>
                            <Space align="center">
                                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                                    Danh Mục Dịch Vụ
                                </Title>
                                <Tag color="blue" style={{ borderRadius: 10, padding: "2px 10px", fontWeight: 600 }}>
                                    {categories.length} danh mục
                                </Tag>
                            </Space>
                            <Paragraph type="secondary" style={{ margin: "2px 0 0 0", fontSize: 13 }}>
                                Quản lý phân loại các nhóm dịch vụ chăm sóc tóc &amp; sắc đẹp của Salon
                            </Paragraph>
                        </div>
                    </Space>

                    <Space size={12} wrap>
                        <Input
                            placeholder="Tìm kiếm danh mục..."
                            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            style={{ width: 220, borderRadius: 8 }}
                            allowClear
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadCategories}
                            loading={loading}
                            style={{ borderRadius: 8 }}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal()}
                            size="middle"
                            style={{
                                borderRadius: 8,
                                fontWeight: 600,
                                padding: "0 20px"
                            }}
                        >
                            Thêm danh mục
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Table Content */}
            <Card
                style={{
                    borderRadius: 16,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    overflow: "hidden"
                }}
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    columns={columns}
                    dataSource={filteredCategories}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        showTotal: (total) => `Tổng cộng ${total} danh mục`,
                        style: { padding: "16px 24px", margin: 0 }
                    }}
                    locale={{
                        emptyText: searchKeyword
                            ? `Không tìm thấy danh mục nào khớp với "${searchKeyword}"`
                            : "Chưa có danh mục dịch vụ nào được tạo."
                    }}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={
                    <Space size={8}>
                        <AppstoreOutlined style={{ color: "#1890ff" }} />
                        <span>{editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</span>
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit}
                confirmLoading={submitting}
                okText={editingCategory ? "Lưu thay đổi" : "Tạo danh mục"}
                cancelText="Hủy"
                destroyOnClose
                centered
                width={500}
                styles={{ body: { paddingTop: 16 } }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên danh mục"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên danh mục!" },
                            { max: 100, message: "Tên danh mục tối đa 100 ký tự!" }
                        ]}
                    >
                        <Input
                            placeholder="Ví dụ: Cắt Tóc &amp; Tạo Kiểu, Uốn &amp; Nhuộm..."
                            size="large"
                            style={{ borderRadius: 8 }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả danh mục"
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Mô tả chi tiết về nhóm dịch vụ này (không bắt buộc)..."
                            style={{ borderRadius: 8 }}
                            maxLength={300}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
