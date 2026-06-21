import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CategoryCard({ category, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        border: "1px solid #ddd",
        borderRadius: "16px",
        padding: "24px",
        backgroundColor: "#fff",
        minHeight: "200px",
        cursor: "grab",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)"}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.08)"}
        >
            {/* Icon */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "16px"
            }}>
                <div style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "20px",
                    backgroundColor: category.color + "20",
                    color: category.color,
                    fontSize: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                    {category.icon}
                </div>
            </div>

            {/* Tên danh mục */}
            <h3 style={{
                textAlign: "center",
                fontSize: "18px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#1f2937"
            }}>
                {category.name}
            </h3>

            {/* Mô tả */}
            {category.description && (
                <p style={{
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    marginBottom: "16px",
                    minHeight: "42px"
                }}>
                    {category.description}
                </p>
            )}

            {/* Số thứ tự */}
            <div style={{
                textAlign: "center",
                marginBottom: "16px"
            }}>
                <span style={{
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280",
                    padding: "2px 10px",
                    borderRadius: "9999px",
                    fontSize: "12px"
                }}>
                    #{(category.displayOrder || 0) + 1}
                </span>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                    style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "500"
                    }}
                >
                    Sửa
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
                    style={{
                        flex: 1,
                        padding: "10px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "500"
                    }}
                >
                    Xóa
                </button>
            </div>
        </div>
    );
}