import React from 'react';
import { Card, Table, Rate, Typography, Progress } from 'antd';
import { ShopOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function BranchComparisonTable({ branches = [] }) {
    const columns = [
        {
            title: 'Chi nhánh',
            dataIndex: 'branchName',
            key: 'branchName',
            render: (v) => <Text strong>{v}</Text>
        },
        {
            title: 'Điểm trung bình',
            dataIndex: 'averageRating',
            key: 'averageRating',
            width: 220,
            render: (v) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Rate disabled allowHalf value={Number(v || 0)} style={{ fontSize: 14 }} />
                    <Text>{Number(v || 0).toFixed(2)}</Text>
                </div>
            ),
            sorter: (a, b) => Number(a.averageRating || 0) - Number(b.averageRating || 0)
        },
        {
            title: 'Tổng số review',
            dataIndex: 'totalReviews',
            key: 'totalReviews',
            width: 140,
            sorter: (a, b) => Number(a.totalReviews || 0) - Number(b.totalReviews || 0)
        },
        {
            title: 'Tỉ lệ 5 sao',
            key: 'fiveStarRate',
            width: 200,
            render: (_, record) => {
                const dist = record.ratingDistribution || {};
                const total = Object.values(dist).reduce((s, v) => s + Number(v || 0), 0);
                const five = Number(dist[5] || 0);
                const pct = total > 0 ? Math.round((five / total) * 100) : 0;
                return <Progress percent={pct} strokeColor="#52c41a" size="small" />;
            }
        }
    ];

    return (
        <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShopOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                    So sánh rating giữa các chi nhánh
                </Title>
            </div>
            <Table
                rowKey="branchId"
                columns={columns}
                dataSource={branches}
                pagination={false}
                locale={{ emptyText: 'Chưa có dữ liệu so sánh chi nhánh' }}
            />
        </Card>
    );
}
