import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { TagsOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c'];

export default function WordCloudPanel({ keywords = [], yearMonth }) {
    if (!keywords || keywords.length === 0) {
        return (
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TagsOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                    <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Từ khoá phổ biến</Title>
                </div>
                <Text type="secondary">
                    Chưa có dữ liệu từ khoá cho tháng {yearMonth || 'này'}. Dữ liệu được tính sẵn theo lịch hàng ngày,
                    có thể chưa cập nhật cho tháng hiện tại.
                </Text>
            </Card>
        );
    }

    const maxFreq = Math.max(...keywords.map((k) => Number(k.frequency || 0)));
    const minFreq = Math.min(...keywords.map((k) => Number(k.frequency || 0)));

    const getFontSize = (freq) => {
        if (maxFreq === minFreq) return 16;
        const ratio = (freq - minFreq) / (maxFreq - minFreq);
        return 13 + ratio * 22; // 13px -> 35px
    };

    return (
        <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <TagsOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Từ khoá phổ biến trong review</Title>
            </div>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                Tháng {yearMonth} — kích thước chữ tỉ lệ với tần suất xuất hiện
            </Text>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 14px', alignItems: 'center', padding: '8px 4px' }}>
                {keywords.map((k, idx) => (
                    <span
                        key={k.keyword}
                        title={`${k.keyword}: ${k.frequency} lần`}
                        style={{
                            fontSize: `${getFontSize(k.frequency)}px`,
                            fontWeight: 700,
                            color: COLORS[idx % COLORS.length],
                            lineHeight: 1,
                            cursor: 'default'
                        }}
                    >
                        {k.keyword}
                    </span>
                ))}
            </div>
        </Card>
    );
}
