import React from 'react';
import { Table, Tag, Button, Popconfirm, message } from 'antd';
import { DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useOffDays } from '../hooks/useOffDays';

const OffDayTable = () => {
    const { useGetByStaff, useDelete } = useOffDays;
    const deleteMutation = useDelete();

    // Tạm thời lấy của 1 staff (sau này sẽ làm select staff)
    const staffId = 1; // Thay bằng ID thật hoặc lấy từ state
    const { data: offDays, isLoading } = useGetByStaff(staffId);

    const handleDelete = (offDayId) => {
        deleteMutation.mutate(offDayId, {
            onSuccess: () => message.success('Xóa ngày nghỉ thành công'),
            onError: () => message.error('Xóa thất bại')
        });
    };

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: ['staff', 'name'],
            key: 'staffName',
            render: (text, record) => record.staffName || `Nhân viên #${record.staffId}`,
        },
        {
            title: 'Từ ngày',
            dataIndex: 'dateFrom',
            key: 'dateFrom',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Đến ngày',
            dataIndex: 'dateTo',
            key: 'dateTo',
            render: (date) => dayjs(date).format('DD/MM/YYYY'),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: () => <Tag color="red">Đã nghỉ</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa ngày nghỉ này?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button danger icon={<DeleteOutlined />} size="small">
                        Xóa
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={offDays}
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
        />
    );
};

export default OffDayTable;