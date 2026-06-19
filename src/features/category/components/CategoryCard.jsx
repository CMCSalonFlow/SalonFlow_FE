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
        opacity: isDragging ? 0.6 : 1,
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "#fff",
        minHeight: "160px",
        cursor: "grab",
        position: "relative",
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div
                style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "12px",
                    backgroundColor: category.color + "20",
                    color: category.color,
                    fontSize: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                }}
            >
                {category.icon}
            </div>

            <h2 style={{ margin: "8px 0", fontSize: "18px", fontWeight: "bold" }}>
                {category.name}
            </h2>

            {category.description && (
                <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
                    {category.description}
                </p>
            )}

            {/* Action buttons */}
            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    Sửa
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    Xóa
                </button>
            </div>
        </div>
    );
}