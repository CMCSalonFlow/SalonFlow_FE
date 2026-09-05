import React from "react";
import { Table, Button, Popconfirm, Empty, Tag, Space, Typography } from "antd";
import { DeleteOutlined, CalendarOutlined, GlobalOutlined, BankOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const OffDayTable = ({ offDays = [], loading = false, onDelete }) => {
    const columns = [
        {
            title: "Tên Ngày Nghỉ Lễ / Dịp Nghỉ",
            dataIndex: "title",
            key: "title",
            render: (text) => (
                <Space size={8}>
                    <CalendarOutlined style={{ color: '#1890ff' }} />
                    <Text fontWeight={600}>{text || "Nghỉ lễ chung"}</Text>
                </Space>
            )
        },
        {
            title: "Phạm Vi Áp Dụng",
            dataIndex: "isAllBranches",
            key: "scope",
            render: (isAll, record) => (
                isAll ? (
                    <Tag icon={<GlobalOutlined />} color="volcano" style={{ borderRadius: 6, fontWeight: 600, padding: '4px 10px' }}>
                        🌐 TOÀN SALON
                    </Tag>
                ) : (
                    <Tag icon={<BankOutlined />} color="blue" style={{ borderRadius: 6, fontWeight: 600, padding: '4px 10px' }}>
                        🏢 {record.branchName || "Chi nhánh cụ thể"}
                    </Tag>
                )
            )
        },
        {
            title: "Thời Gian Nghỉ",
            key: "timeRange",
            render: (_, record) => {
                const from = record.dateFrom ? dayjs(record.dateFrom).format("DD/MM/YYYY") : "";
                const to = record.dateTo ? dayjs(record.dateTo).format("DD/MM/YYYY") : "";
                return (
                    <div>
                        <Text strong style={{ color: '#262626' }}>{from}</Text>
                        {from !== to && <Text type="secondary"> ➔ <Text strong style={{ color: '#262626' }}>{to}</Text></Text>}
                    </div>
                );
            }
        },
        {
            title: "Số Ngày Nghỉ",
            dataIndex: "totalDays",
            key: "totalDays",
            render: (val) => (
                <Tag color="gold" style={{ borderRadius: 6, fontWeight: 600 }}>
                    {val || 1} ngày
                </Tag>
            )
        },
        {
            title: "Ghi Chú / Lý Do",
            dataIndex: "reason",
            key: "reason",
            render: (val) => val ? <Text type="secondary">{val}</Text> : <Text type="secondary" italic>Không có ghi chú</Text>
        },
        {
            title: "Thao Tác",
            key: "action",
            width: 100,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa ngày nghỉ lễ này?"
                    description="Sau khi xóa, chi nhánh và khách hàng sẽ có thể chọn đặt lịch bình thường vào ngày này."
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => onDelete(record.id)}
                >
                    <Button danger icon={<DeleteOutlined />} size="small" style={{ borderRadius: 6 }}>
                        Xóa
                    </Button>
                </Popconfirm>
            )
        }
    ];

    return (
        <Table
            rowKey="id"
            columns={columns}
            dataSource={offDays}
            loading={loading}
            scroll={{ x: 750 }}
            pagination={{ pageSize: 10 }}
            locale={{
                emptyText: <Empty description="Chưa có ngày nghỉ lễ / đóng cửa nào được thiết lập" />
            }}
            style={{ backgroundColor: '#fff', borderRadius: 12 }}
        />
    );
};

export default OffDayTable;