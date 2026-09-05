import {
    Button,
    Space,
    Table,
    Tag,
    Popconfirm,
    Switch,
    Grid
} from "antd";

export default function BranchTable({
    data,
    loading,
    onEdit,
    onDelete,
    onUsers,
    onToggleSms
}) {
    const screens = Grid.useBreakpoint();

    const columns = [
        {
            title: "Tên chi nhánh",
            dataIndex: "name",
            key: "name",
            width: 180
        },
        {
            title: "Địa chỉ",
            dataIndex: "address",
            key: "address",
            width: 240,
            ellipsis: true
        },
        {
            title: "Điện thoại",
            dataIndex: "phone",
            key: "phone",
            width: 130
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            width: 180
        },
        {
            title: "Trạng thái",
            dataIndex: "isActive",
            width: 120,
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
            width: 140,
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
            width: 140,
            fixed: screens.md ? "right" : false,
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
            scroll={{ x: 1050 }}
            pagination={{
                pageSize: 10,
                simple: screens.xs
            }}
        />
    );
}