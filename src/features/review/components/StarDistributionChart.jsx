import React from 'react';
import { Card, Typography, Progress } from 'antd';
import { StarFilled, BarChartOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

// distribution: Map/Object { "1": 2, "2": 0, "3": 5, "4": 10, "5": 20 } (từ compare-branches hoặc tự tính từ topReviews nếu cần)
export default function StarDistributionChart({ distribution = {} }) {
    const stars = [5, 4, 3, 2, 1];
    const total = stars.reduce((sum, s) => sum + Number(distribution[s] || 0), 0);

    return (
        <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
            bodyStyle={{ padding: '20px 24px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChartOutlined style={{ color: '#faad14', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                    Phân bổ đánh giá theo sao
                </Title>
            </div>

            {total === 0 ? (
                <Text type="secondary">Chưa có dữ liệu phân bổ sao</Text>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stars.map((s) => {
                        const count = Number(distribution[s] || 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 42, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                                    {s} <StarFilled style={{ color: '#faad14', fontSize: 12 }} />
                                </div>
                                <Progress
                                    percent={pct}
                                    strokeColor="#faad14"
                                    showInfo={false}
                                    style={{ flex: 1 }}
                                />
                                <Text style={{ width: 60, textAlign: 'right', fontSize: 12 }} type="secondary">
                                    {count} ({pct}%)
                                </Text>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
