import { Card, Tag, Button, Popconfirm, Image } from "antd";
import { EditOutlined, DeleteOutlined, ClockCircleOutlined } from "@ant-design/icons";

/**
 * Hiển thị thông tin 1 dịch vụ dạng card.
 * Dùng trong ServiceListPage (grid layout).
 */
export default function ServiceCard({ service, onEdit, onDelete }) {
    const firstImage = service.images?.[0];

    return (
        <Card
            hoverable
            style={{ borderRadius: 16 }}
            cover={
                firstImage ? (
                    <Image
                        src={firstImage}
                        alt={service.name}
                        style={{
                            height: 160,
                            objectFit: "cover",
                            borderRadius: "16px 16px 0 0",
                        }}
                        preview={false}
                    />
                ) : (
                    <div
                        style={{
                            height: 160,
                            background: "#f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 48,
                            borderRadius: "16px 16px 0 0",
                        }}
                    >
                        ✂️
                    </div>
                )
            }
            actions={[
                <EditOutlined key="edit" onClick={() => onEdit(service)} />,
                <Popconfirm
                    key="delete"
                    title="Xóa dịch vụ này?"
                    onConfirm={() => onDelete(service.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <DeleteOutlined style={{ color: "#ff4d4f" }} />
                </Popconfirm>,
            ]}
        >
            <Card.Meta
                title={service.name}
                description={
                    <div>
                        <div style={{ marginBottom: 8 }}>
                            <Tag color="green">
                                {Number(service.price).toLocaleString("vi-VN")} ₫
                            </Tag>
                            <Tag icon={<ClockCircleOutlined />} color="blue">
                                {service.durationMinutes} phút
                            </Tag>
                            {service.categoryName && (
                                <Tag color="purple">{service.categoryName}</Tag>
                            )}
                        </div>
                        {service.description && (
                            <div
                                style={{
                                    color: "#888",
                                    fontSize: 12,
                                    marginTop: 4,
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                }}
                                dangerouslySetInnerHTML={{ __html: service.description }}
                            />
                        )}
                        {!service.isActive && (
                            <Tag color="red" style={{ marginTop: 8 }}>
                                Ngừng hoạt động
                            </Tag>
                        )}
                    </div>
                }
            />
        </Card>
    );
}
