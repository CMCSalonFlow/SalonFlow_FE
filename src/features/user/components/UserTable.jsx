import {
    Table,
    Button,
    Space,
    Tag,
    Popconfirm
} from "antd";

export default function UserTable({
    users,
    onEdit,
    onDelete
}) {

    const columns = [
        {
            title: "ID",
            dataIndex: "id"
        },
        {
            title: "Username",
            dataIndex: "username"
        },
        {
            title: "Email",
            dataIndex: "email"
        },
        {
            title: "Full Name",
            dataIndex: "fullName"
        },
        {
            title: "Status",
            dataIndex: "status"
        },
        {
            title: "Roles",
            dataIndex: "roles",
            render: (roles) => (
                <>
                    {roles?.map(role => (
                        <Tag key={role}>
                            {role}
                        </Tag>
                    ))}
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
                        title="Delete user?"
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
            dataSource={users}
        />
    );
}