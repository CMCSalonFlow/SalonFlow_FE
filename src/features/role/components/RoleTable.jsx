import {
    Table,
    Button,
    Tag,
    Space,
    Popconfirm
} from "antd";

export default function RoleTable({
    roles,
    onEdit,
    onDelete
}) {

    const columns = [
        {
            title: "ID",
            dataIndex: "id"
        },
        {
            title: "Code",
            dataIndex: "code"
        },
        {
            title: "Name",
            dataIndex: "name"
        },
        {
            title: "Description",
            dataIndex: "description"
        },
        {
            title: "Permissions",
            dataIndex: "permissions",
            render: (permissions) => (
                <>
                    {permissions?.map(
                        permission => (
                            <Tag
                                key={permission}
                            >
                                {permission}
                            </Tag>
                        )
                    )}
                </>
            )
        },
        {
            title: "Action",
            render: (_, record) => (
                <Space>

                    <Button
                        type="primary"
                        onClick={() =>
                            onEdit(record)
                        }
                    >
                        Edit
                    </Button>

                    <Popconfirm
                        title="Delete role?"
                        onConfirm={() =>
                            onDelete(record.id)
                        }
                    >
                        <Button danger>
                            Delete
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
        />
    );
}