import React from 'react';
import { Table, Card, Tag, Input, Segmented, Button, Typography, Space, Avatar, Tooltip } from 'antd';
import { SearchOutlined, SendOutlined, UserOutlined, CrownOutlined, WarningOutlined, SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function CustomerSegmentTable({
    customers = [],
    totalElements = 0,
    loading = false,
    selectedSegment = 'ALL',
    onSegmentChange = null,
    searchQuery = '',
    onSearchChange = null,
    page = 0,
    pageSize = 10,
    onPageChange = null,
    onOpenCampaignModal = null
}) {
    const formatVND = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const getSegmentBadge = (type) => {
        switch (type) {
            case 'NEW':
                return <Tag color="blue" icon={<SyncOutlined />}>Khách mới</Tag>;
            case 'RETURNING':
                return <Tag color="green">Khách quay lại</Tag>;
            case 'VIP':
                return <Tag color="warning" icon={<CrownOutlined />}>VIP</Tag>;
            case 'AT_RISK':
                return <Tag color="error" icon={<WarningOutlined />}>At-risk (&gt;60 ngày)</Tag>;
            default:
                return <Tag>{type}</Tag>;
        }
    };

    const columns = [
        {
            title: 'Khách hàng',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text, record) => (
                <Space size={10}>
                    <Avatar src={record.avatarUrl} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    <div>
                        <div style={{ fontWeight: 700, color: '#262626' }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.phone || 'Chưa có SĐT'}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: (
                <Space size={4}>
                    <span>Phân khúc</span>
                    <Tooltip title="• Khách mới: Hoàn thành lần đầu&#10;• Khách quay lại: 2 - 5 lần&#10;• VIP: > 5 lần hoặc chi tiêu > 5M&#10;• At-risk: Chưa quay lại > 60 ngày">
                        <QuestionCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: 12 }} />
                    </Tooltip>
                </Space>
            ),
            dataIndex: 'segmentType',
            key: 'segmentType',
            render: (type) => getSegmentBadge(type)
        },
        {
            title: 'Số lần làm',
            dataIndex: 'completedBookingsCount',
            key: 'completedBookingsCount',
            align: 'center',
            render: (val) => <span style={{ fontWeight: 700 }}>{val} lần</span>
        },
        {
            title: 'Tổng chi tiêu',
            dataIndex: 'totalSpent',
            key: 'totalSpent',
            align: 'right',
            render: (val) => <span style={{ fontWeight: 700, color: '#1890ff' }}>{formatVND(val)}</span>
        },
        {
            title: 'Ngày đến gần nhất',
            dataIndex: 'lastBookingDate',
            key: 'lastBookingDate',
            render: (date, record) => (
                <div>
                    <div>{date || '-'}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.daysSinceLastBooking > 0 ? `${record.daysSinceLastBooking} ngày trước` : 'Hôm nay'}
                    </Text>
                </div>
            )
        },
        {
            title: (
                <Space size={4}>
                    <span>AOV & Tần suất</span>
                    <Tooltip title="• AOV (Average Order Value): Số tiền chi tiêu trung bình / lượt đặt lịch&#10;• Tần suất: Số lượt làm dịch vụ trung bình trong 1 tháng">
                        <QuestionCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: 12 }} />
                    </Tooltip>
                </Space>
            ),
            key: 'metrics',
            render: (_, record) => (
                <div>
                    <div>AOV: {formatVND(record.averageOrderValue)}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.frequencyPerMonth} lần/tháng
                    </Text>
                </div>
            )
        },
        {
            title: (
                <Space size={4}>
                    <span>CLV (1 năm)</span>
                    <Tooltip title="CLV (Customer Lifetime Value): Giá trị vòng đời dự tính = AOV × Tần suất × 12 tháng">
                        <QuestionCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: 12 }} />
                    </Tooltip>
                </Space>
            ),
            dataIndex: 'customerLifetimeValue',
            key: 'customerLifetimeValue',
            align: 'right',
            render: (val) => (
                <Tooltip title="Giá trị vòng đời dự tính = AOV × Tần suất × 12 tháng">
                    <span style={{ fontWeight: 800, color: '#fa8c16' }}>{formatVND(val)}</span>
                </Tooltip>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                <Button
                    type="primary"
                    ghost
                    size="small"
                    icon={<SendOutlined />}
                    style={{ borderRadius: 8 }}
                    onClick={() => onOpenCampaignModal && onOpenCampaignModal(record.segmentType, record)}
                >
                    Gửi Ưu Đãi
                </Button>
            )
        }
    ];

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
            styles={{ body: { padding: 24 } }}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={5} style={{ margin: 0 }}>
                        Danh sách Phân loại Khách hàng Chi tiết
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Quản lý và kích hoạt chiến dịch tiếp thị cá nhân hóa theo nhóm đối tượng
                    </Text>
                </div>
            </div>

            {/* Controls: Segment Filter & Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Segmented
                    value={selectedSegment}
                    onChange={(val) => onSegmentChange && onSegmentChange(val)}
                    options={[
                        { label: 'Tất cả khách', value: 'ALL' },
                        { label: 'Khách mới (New)', value: 'NEW' },
                        { label: 'Khách quay lại (Returning)', value: 'RETURNING' },
                        { label: 'VIP (>5M / >5 lần)', value: 'VIP' },
                        { label: 'At-risk (>60 ngày)', value: 'AT_RISK' }
                    ]}
                    style={{ borderRadius: 10 }}
                />

                <Input
                    placeholder="Tìm kiếm theo tên hoặc SĐT..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchQuery}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                    style={{ width: 280, borderRadius: 10 }}
                    allowClear
                />
            </div>

            <Table
                rowKey="customerId"
                columns={columns}
                dataSource={customers}
                loading={loading}
                pagination={{
                    current: page + 1,
                    pageSize: pageSize,
                    total: totalElements,
                    onChange: (p, s) => onPageChange && onPageChange(p - 1, s),
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50']
                }}
                scroll={{ x: 900 }}
            />
        </Card>
    );
}
