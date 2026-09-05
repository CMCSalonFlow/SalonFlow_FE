import {
    Table,
    Button,
    Space,
    Popconfirm,
    Tag,
    Grid
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function RoleTable({
    roles,
    onEdit,
    onDelete
}) {
    const screens = Grid.useBreakpoint();

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            width: 75,
            align: "center",
            render: (id) => <Tag style={{ margin: 0, fontWeight: "bold" }}>#{id}</Tag>
        },
        {
            title: "Mã vai trò (Code)",
            dataIndex: "code",
            width: 180,
            render: (code) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>{code}</span>
        },
        {
            title: "Tên vai trò",
            dataIndex: "name",
            width: 200,
            render: (name) => <span style={{ fontWeight: 600, color: "#0f172a" }}>{name}</span>
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            width: 320,
            render: (desc) => <span style={{ color: "#64748b" }}>{desc || "---"}</span>
        },
        {
            title: "Thao tác",
            width: 180,
            align: "right",
            fixed: screens.md ? "right" : false,
            render: (_, record) => (
                <Space size={8}>
                    <Button
                        type="primary"
                        size="small"
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
                        <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 6 }}>
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
            scroll={{ x: 850 }}
            style={{ borderRadius: 12 }}
        />
    );
}