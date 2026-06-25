import { Card, Button, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function CategoryCard({ category, onEdit, onDelete }) {
    return (
        <Card
            hoverable
            style={{ borderRadius: 16 }}
            actions={[
                <EditOutlined key="edit" onClick={() => onEdit(category)} />,
                <DeleteOutlined key="delete" onClick={() => onDelete(category.id)} />
            ]}
        >
            <div style={{ textAlign: "center" }}>
                {category.iconUrl ? (
                    <img
                        src={category.iconUrl}
                        alt={category.name}
                        style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 12,
                            marginBottom: 12
                        }}
                    />
                ) : (
                    <div style={{ fontSize: 40 }}>📁</div>
                )}

                <h3>{category.name}</h3>

                {category.description && (
                    <p style={{ color: "#888" }}>{category.description}</p>
                )}

                <Tag color={category.color || "blue"}>
                    #{category.displayOrder + 1}
                </Tag>
            </div>
        </Card>
    );
}