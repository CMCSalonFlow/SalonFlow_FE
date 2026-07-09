import {
    Button,
    Space,
    Table,
    Tag,
    Popconfirm
} from "antd";

export default function BranchTable({
    data,
    loading,
    onEdit,
    onDelete,
    onUsers
}) {

    const columns = [
        {
            title: "Tên chi nhánh",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            key: "address"
        },
        {
            title: "Điện thoại",
            dataIndex: "phone",
            key: "phone"
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email"
        },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            render: (active) =>
                active ? (
                    <Tag color="green">
                        Hoạt động
                    </Tag>
                ) : (
                    <Tag color="volcano">
                        Đóng cửa
                    </Tag>
                )
        },
        {
            title: "Thao tác",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() =>
                            onEdit(record)
                        }
                    >
                        Sửa
                    </Button>

                    <Button
                        type="link"
                        onClick={() =>
                            onUsers(record)
                        }
                    >
                        Nhân viên
                    </Button>

                    <Popconfirm
                        title="Xóa chi nhánh?"
                        onConfirm={() =>
                            onDelete(record.id)
                        }
                    >
                        <Button danger type="link">
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
            loading={loading}
            columns={columns}
            dataSource={data}
            pagination={{
                pageSize: 10
            }}
        />
    );
}