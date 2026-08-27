import {
    Table,
    Button,
    Space,
    Popconfirm,
    Tag
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function RoleTable({
    roles,
    onEdit,
    onDelete
}) {
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            width: 70,
            align: "center",
            render: (id) => <Tag style={{ margin: 0, fontWeight: "bold" }}>#{id}</Tag>
        },
        {
            title: "Mã vai trò (Code)",
            dataIndex: "code",
            width: 220,
            render: (code) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>{code}</span>
        },
        {
            title: "Tên vai trò",
            dataIndex: "name",
            width: 220,
            render: (name) => <span style={{ fontWeight: 600, color: "#0f172a" }}>{name}</span>
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            width: 380,
            render: (desc) => <span style={{ color: "#64748b" }}>{desc || "---"}</span>
        },
        {
            title: "Thao tác",
            width: 200,
            align: "right",
            render: (_, record) => (
                <Space size={8}>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                        style={{ borderRadius: 6 }}
                    >
                        Chỉnh sửa
                    </Button>

                    <Popconfirm
                        title="Xác nhận xóa vai trò này?"
                        description="Hành động này không thể hoàn tác."
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={roles}
            pagination={false}
            style={{ borderRadius: 12 }}
        />
    );
}