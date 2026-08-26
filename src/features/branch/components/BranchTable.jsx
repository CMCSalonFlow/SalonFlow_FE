import {
    Button,
    Space,
    Table,
    Tag,
    Popconfirm,
    Switch
} from "antd";

export default function BranchTable({
    data,
    loading,
    onEdit,
    onDelete,
    onUsers,
    onToggleSms
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
            title: "SMS Nhắc hẹn",
            dataIndex: "isSmsEnabled",
            render: (enabled, record) => (
                <Switch
                    checked={enabled !== false}
                    onChange={(checked) => onToggleSms && onToggleSms(record, checked)}
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                />
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