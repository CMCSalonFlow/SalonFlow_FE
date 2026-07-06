import React from "react";
import { Table, Button, Popconfirm, Empty } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const OffDayTable = ({
    offDays = [],
    loading = false,
    onDelete,
}) => {
    const columns = [
        {
            title: "Nhân viên",
            dataIndex: "staffName",
            key: "staffName",
        },
        {
            title: "Từ ngày",
            dataIndex: "dateFrom",
            key: "dateFrom",
            render: (value) =>
                value ? dayjs(value).format("DD/MM/YYYY") : "",
        },
        {
            title: "Đến ngày",
            dataIndex: "dateTo",
            key: "dateTo",
            render: (value) =>
                value ? dayjs(value).format("DD/MM/YYYY") : "",
        },
        {
            title: "Lý do",
            dataIndex: "reason",
            key: "reason",
            render: (value) => value || "-",
        },
        {
            title: "Thao tác",
            key: "action",
            width: 120,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa ngày nghỉ?"
                    description="Bạn có chắc muốn xóa ngày nghỉ này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => onDelete(record.id)}
                >
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                    >
                        Xóa
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={offDays}
            loading={loading}
            pagination={{
                pageSize: 10,
            }}
            locale={{
                emptyText: (
                    <Empty description="Chưa có ngày nghỉ" />
                ),
            }}
        />
    );
};

export default OffDayTable;