import { Card, Button, Typography, Space, Popconfirm, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function CategoryCard({ category, onEdit, onDelete }) {
    const cardColor = category.color || "#1890ff";

    return (
        <Card
            hoverable
            style={{
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                border: "1px solid #f0f0f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                position: "relative"
            }}
            styles={{
                body: {
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1
                }
            }}
        >
            {/* Top Color Accent Line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    backgroundColor: cardColor
                }}
            />

            <div>
                {/* Header: Color Pill + Order */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Space size={6} align="center">
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                backgroundColor: cardColor,
                                boxShadow: `0 0 6px ${cardColor}80`
                            }}
                        />
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                            {cardColor.toUpperCase()}
                        </Text>
                    </Space>

                    <Tag
                        style={{
                            borderRadius: 12,
                            padding: "0 8px",
                            fontWeight: 700,
                            fontSize: 11,
                            backgroundColor: `${cardColor}15`,
                            color: cardColor,
                            borderColor: `${cardColor}40`
                        }}
                    >
                        #{category.displayOrder !== undefined ? category.displayOrder + 1 : category.id}
                    </Tag>
                </div>

                {/* Category Name */}
                <Title level={4} style={{ margin: "0 0 8px 0", fontWeight: 700, fontSize: 17, color: "#1f1f1f" }}>
                    {category.name}
                </Title>

                {/* Description */}
                <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ fontSize: 13, marginBottom: 16, minHeight: 38, color: "#666" }}
                >
                    {category.description || "Chưa có mô tả cho danh mục này."}
                </Paragraph>
            </div>

            {/* Bottom Actions */}
            <div
                style={{
                    paddingTop: 12,
                    borderTop: "1px solid #f5f5f5",
                    display: "flex",
                    justify: "flex-end",
                    gap: 8,
                    marginTop: "auto"
                }}
            >
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(category)}
                    style={{ borderRadius: 8, color: "#595959" }}
                >
                    Sửa
                </Button>

                <Popconfirm
                    title="Xóa danh mục này?"
                    description="Các dịch vụ thuộc danh mục này có thể bị ảnh hưởng."
                    onConfirm={() => onDelete(category.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        style={{ borderRadius: 8 }}
                    >
                        Xóa
                    </Button>
                </Popconfirm>
            </div>
        </Card>
    );
}