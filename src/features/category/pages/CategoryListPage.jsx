import { useEffect, useState } from "react";
import { Button, Modal, Input, ColorPicker, Upload, Row, Col, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
    uploadMedia
} from "../api/categoryApi";

import CategoryCard from "../components/CategoryCard";

export default function CategoryListPage() {

    const [categories, setCategories] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        color: "#1677ff",
        description: "",
        iconMediaId: null,
        iconUrl: null
    });

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    const openModal = (cat = null) => {
        if (cat) {
            setForm({
                name: cat.name,
                color: cat.color,
                description: cat.description,
                iconMediaId: cat.iconMediaId,
                iconUrl: cat.iconUrl
            });
            setEditing(cat);
        } else {
            setForm({
                name: "",
                color: "#1677ff",
                description: "",
                iconMediaId: null,
                iconUrl: null
            });
            setEditing(null);
        }
        setOpen(true);
    };

    const handleUpload = async (file) => {
        const res = await uploadMedia(file);
        setForm({
            ...form,
            iconMediaId: res.id,
            iconUrl: res.url
        });
        message.success("Upload thành công");
        return false;
    };

    const handleSubmit = async () => {
        setLoading(true);

        const payload = {
            name: form.name,
            color: form.color,
            description: form.description,
            iconMediaId: form.iconMediaId
        };

        try {
            if (editing) {
                await updateCategory(editing.id, payload);
                message.success("Cập nhật thành công");
            } else {
                await createCategory(payload);
                message.success("Tạo mới thành công");
            }

            setOpen(false);
            load();
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        await deleteCategory(id);
        message.success("Đã xóa");
        load();
    };

    return (
        <div style={{ padding: 24 }}>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                style={{ marginBottom: 20 }}
            >
                Thêm danh mục
            </Button>

            <Row gutter={[16, 16]}>
                {categories.map(cat => (
                    <Col span={6} key={cat.id}>
                        <CategoryCard
                            category={cat}
                            onEdit={openModal}
                            onDelete={handleDelete}
                        />
                    </Col>
                ))}
            </Row>

            <Modal
                title={editing ? "Cập nhật danh mục" : "Thêm danh mục"}
                open={open}
                onCancel={() => setOpen(false)}
                onOk={handleSubmit}
                confirmLoading={loading}
            >

                <Input
                    placeholder="Tên danh mục"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={{ marginBottom: 12 }}
                />

                <ColorPicker
                    value={form.color}
                    onChange={(c) =>
                        setForm({ ...form, color: c.toHexString() })
                    }
                    style={{ marginBottom: 12 }}
                />

                <Input.TextArea
                    placeholder="Mô tả"
                    value={form.description}
                    onChange={e =>
                        setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    style={{ marginBottom: 12 }}
                />

                <Upload
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    accept="image/*"
                >
                    <Button icon={<UploadOutlined />}>
                        Upload icon
                    </Button>
                </Upload>

                {form.iconUrl && (
                    <div style={{ marginTop: 12 }}>
                        <img
                            src={form.iconUrl}
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 12
                            }}
                        />
                    </div>
                )}

            </Modal>
        </div>
    );
}
