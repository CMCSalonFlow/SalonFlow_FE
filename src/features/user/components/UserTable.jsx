import {
    Table,
    Button,
    Space,
    Tag,
    Popconfirm,
    Skeleton,
    Card
} from "antd";

export default function UserTable({
    users,
    loading = false,
    onEdit,
    onDelete
}) {
    const columns = [
        {
            title: "Mã ID",
            dataIndex: "id",
            width: 70
        },
        {
            title: "Tên đăng nhập",
            dataIndex: "username"
        },
        {
            title: "Email",
            dataIndex: "email"
        },
        {
            title: "Họ và tên",
            dataIndex: "fullName"
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (status) => (
                <Tag color={status === "ACTIVE" ? "green" : "volcano"}>
                    {status === "ACTIVE" ? "Hoạt động" : (status || "Hoạt động")}
                </Tag>
            )
        },
        {
            title: "Vai trò",
            dataIndex: "roles",
            render: (roles) => (
                <>
                    {roles?.map(role => (
                        <Tag key={role} color="blue">
                            {role}
                        </Tag>
                    ))}
                </>
            )
        },
        {
            title: "Thao tác",
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        onClick={() => onEdit(record)}
                    >
                        Chỉnh sửa
                    </Button>

                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa người dùng này không?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    if (loading) {
        return (
            <Card style={{ borderRadius: 12, borderColor: "#f0f0f0" }} bodyStyle={{ padding: 24 }}>
                <Space direction="vertical" style={{ width: "100%" }} size="large">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Skeleton.Input active style={{ width: 140, height: 28 }} />
                        <Skeleton.Button active style={{ width: 110, height: 32 }} />
                    </div>

                    {[1, 2, 3, 4, 5].map((item) => (
                        <div
                            key={item}
                            style={{
                                display: "flex",
                                gap: 20,
                                alignItems: "center",
                                paddingBottom: 12,
                                borderBottom: "1px dashed #f0f0f0"
                            }}
                        >
                            <Skeleton.Avatar active size="small" shape="circle" />
                            <Skeleton.Input active style={{ width: "15%", height: 22 }} />
                            <Skeleton.Input active style={{ width: "25%", height: 22 }} />
                            <Skeleton.Input active style={{ width: "20%", height: 22 }} />
                            <Skeleton.Button active size="small" style={{ width: 70, height: 22 }} />
                            <Skeleton.Button active size="small" style={{ width: 80, height: 22 }} />
                        </div>
                    ))}
                </Space>
            </Card>
        );
    }

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={users}
        />
    );
}