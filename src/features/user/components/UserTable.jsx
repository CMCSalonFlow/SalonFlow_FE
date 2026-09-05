import {
    Table,
    Button,
    Space,
    Tag,
    Popconfirm,
    Skeleton,
    Card,
    Grid
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function UserTable({
    users,
    loading = false,
    onEdit,
    onDelete
}) {
    const screens = Grid.useBreakpoint();

    const columns = [
        {
            title: "Mã ID",
            dataIndex: "id",
            width: 75,
            align: "center",
            render: (id) => <Tag style={{ margin: 0, fontWeight: "bold" }}>#{id}</Tag>
        },
        {
            title: "Tên đăng nhập",
            dataIndex: "username",
            width: 160,
            render: (val) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{val}</span>
        },
        {
            title: "Email",
            dataIndex: "email",
            width: 220,
            render: (val) => <span style={{ color: "#475569" }}>{val}</span>
        },
        {
            title: "Họ và tên",
            dataIndex: "fullName",
            width: 180,
            render: (val) => <span style={{ fontWeight: 500 }}>{val || "---"}</span>
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 130,
            render: (status) => (
                <Tag color={status === "ACTIVE" ? "green" : "volcano"}>
                    {status === "ACTIVE" ? "Hoạt động" : (status || "Hoạt động")}
                </Tag>
            )
        },
        {
            title: "Vai trò",
            dataIndex: "roles",
            width: 160,
            render: (roles) => (
                <Space wrap size={[0, 4]}>
                    {roles?.map(role => (
                        <Tag key={role} color="blue">
                            {role}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: "Thao tác",
            width: 180,
            fixed: screens.md ? "right" : false,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => onEdit(record)}
                    >
                        Sửa
                    </Button>

                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa người dùng này không?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => onDelete(record.id)}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
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
            scroll={{ x: 950 }}
            pagination={{ pageSize: 10, simple: screens.xs }}
        />
    );
}