import { useState, useEffect } from "react";
import EmojiPicker from 'emoji-picker-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

import { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    updateCategoryOrder 
} from "../api/categoryApi";

import CategoryCard from "../components/CategoryCard";

export function CategoryListPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        icon: "",
        color: "#3b82f6",
        description: "",
    });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories([...data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openForm = (category = null) => {
        if (category) {
            setFormData({
                name: category.name || "",
                icon: category.icon || "",
                color: category.color || "#3b82f6",
                description: category.description || "",
            });
            setEditingCategory(category);
        } else {
            setFormData({ name: "", icon: "", color: "#3b82f6", description: "" });
            setEditingCategory(null);
        }
        setShowForm(true);
        setShowEmojiPicker(false);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingCategory(null);
        setShowEmojiPicker(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onEmojiClick = (emojiObject) => {
        setFormData({ ...formData, icon: emojiObject.emoji });
        setShowEmojiPicker(false);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert("Tên danh mục không được để trống!");
            return;
        }

        try {
            if (editingCategory?.id) {
                await updateCategory(editingCategory.id, formData);
                alert("✅ Cập nhật thành công!");
            } else {
                await createCategory(formData);
                alert("✅ Thêm danh mục thành công!");
            }
            fetchCategories();
            closeForm();
        } catch (error) {
            console.error(error);
            alert("❌ Thất bại: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa?")) return;
        try {
            await deleteCategory(id);
            fetchCategories();
        } catch (error) {
            alert("Không thể xóa!");
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex(cat => cat.id === active.id);
        const newIndex = categories.findIndex(cat => cat.id === over.id);

        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);

        try {
            await updateCategoryOrder(newCategories.map(cat => cat.id));
        } catch (error) {
            console.error("Lỗi order:", error);
            fetchCategories();
        }
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Đang tải...</div>;

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Danh mục dịch vụ</h1>
                <button 
                    onClick={() => openForm()}
                    style={{ padding: "12px 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" }}
                >
                    + Thêm danh mục
                </button>
            </div>

            {/* FORM */}
            {showForm && (
                <div style={{ 
                    backgroundColor: "white", 
                    padding: "32px", 
                    borderRadius: "16px", 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    marginBottom: "40px",
                    maxWidth: "600px",
                    marginLeft: "auto",
                    marginRight: "auto"
                }}>
                    <h3 style={{ fontSize: "24px", marginBottom: "24px" }}>
                        {editingCategory?.id ? "Sửa danh mục" : "Thêm danh mục mới"}
                    </h3>

                    <input
                        name="name"
                        placeholder="Tên danh mục"
                        value={formData.name}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px", marginBottom: "16px" }}
                    />

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Icon</label>
                        <div 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            style={{ 
                                padding: "20px", 
                                border: "2px dashed #ccc", 
                                borderRadius: "12px", 
                                textAlign: "center", 
                                fontSize: "50px", 
                                cursor: "pointer",
                                minHeight: "80px"
                            }}
                        >
                            {formData.icon || "Click để chọn emoji"}
                        </div>
                        {showEmojiPicker && (
                            <div style={{ marginTop: "10px" }}>
                                <EmojiPicker onEmojiClick={onEmojiClick} width={350} height={400} />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Màu sắc</label>
                        <input 
                            name="color" 
                            type="color" 
                            value={formData.color} 
                            onChange={handleChange} 
                            style={{ width: "80px", height: "50px", border: "1px solid #ddd", borderRadius: "8px" }}
                        />
                    </div>

                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        value={formData.description}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "14px", border: "1px solid #ddd", borderRadius: "8px", height: "100px", marginBottom: "20px" }}
                    />

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={handleSubmit} style={{ flex: 1, padding: "14px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "8px", fontSize: "16px" }}>
                            {editingCategory?.id ? "Cập nhật" : "Tạo mới"}
                        </button>
                        <button onClick={closeForm} style={{ flex: 1, padding: "14px", backgroundColor: "#6b7280", color: "white", border: "none", borderRadius: "8px", fontSize: "16px" }}>
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
                        {categories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                onEdit={openForm}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}