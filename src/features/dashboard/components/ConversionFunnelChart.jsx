import React from 'react';
import { Card, Typography, Space, Tag, Tooltip } from 'antd';
import { FilterOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function ConversionFunnelChart({ funnelData = null, loading = false }) {
    const stages = funnelData?.stages || [
        { stageKey: 'TOTAL_INTERACTED', stageName: 'Tương tác / Đặt lịch', count: 0, conversionRate: 100, overallRate: 100 },
        { stageKey: 'NEW_CUSTOMER', stageName: 'Hoàn thành lần đầu (New)', count: 0, conversionRate: 0, overallRate: 0 },
        { stageKey: 'RETURNING_CUSTOMER', stageName: 'Khách quay lại (2-5 lần)', count: 0, conversionRate: 0, overallRate: 0 },
        { stageKey: 'VIP_CUSTOMER', stageName: 'Khách VIP (>5 lần / >5M)', count: 0, conversionRate: 0, overallRate: 0 },
        { stageKey: 'AT_RISK_DROP', stageName: 'Nguy cơ rời bỏ (>60 ngày)', count: 0, conversionRate: 0, overallRate: 0 }
    ];

    const maxCount = Math.max(...stages.map(s => s.count || 0), 1);

    const getStageColor = (key) => {
        switch (key) {
            case 'TOTAL_INTERACTED': return '#722ed1';
            case 'NEW_CUSTOMER': return '#1890ff';
            case 'RETURNING_CUSTOMER': return '#52c41a';
            case 'VIP_CUSTOMER': return '#fa8c16';
            case 'AT_RISK_DROP': return '#f5222d';
            default: return '#1890ff';
        }
    };

    return (
        <Card
            loading={loading}
            variant="borderless"
            style={{
                borderRadius: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Space size={8}>
                    <FilterOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                    <Title level={5} style={{ margin: 0 }}>
                        Biểu đồ Phễu Chuyển đổi Khách hàng (Conversion Funnel)
                    </Title>
                </Space>
                <Tag color="purple">
                    Tỷ lệ giữ chân
                </Tag>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stages.map((stage, idx) => {
                    const widthPct = stage.count > 0 ? Math.max((stage.count / maxCount) * 100, 6) : 0;
                    const color = getStageColor(stage.stageKey);
                    const isAtRisk = stage.stageKey === 'AT_RISK_DROP';

                    return (
                        <div key={stage.stageKey} style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                                <Space size={6}>
                                    <span style={{ fontWeight: 700, color: '#262626' }}>
                                        {idx + 1}. {stage.stageName}
                                    </span>
                                    {isAtRisk && (
                                        <Tag color="error" style={{ margin: 0, fontSize: 10 }}>
                                            Khách bỏ rời
                                        </Tag>
                                    )}
                                </Space>
                                <Space size={8}>
                                    <span style={{ fontWeight: 800, fontSize: 14, color }}>
                                        {stage.count} khách
                                    </span>
                                    <Tooltip title="Tỷ lệ so với giai đoạn trước">
                                        <Tag color={color} style={{ margin: 0, fontWeight: 600 }}>
                                            {stage.conversionRate}% {idx > 0 && !isAtRisk ? 'chuyển đổi' : ''}
                                        </Tag>
                                    </Tooltip>
                                </Space>
                            </div>

                            {/* Horizontal Funnel Bar */}
                            <div
                                style={{
                                    height: 32,
                                    width: '100%',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${widthPct}%`,
                                        backgroundColor: color,
                                        opacity: isAtRisk ? 0.85 : 1,
                                        borderRadius: 8,
                                        transition: 'width 0.6s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: 12,
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: 12
                                    }}
                                >
                                    {widthPct > 15 && `${stage.overallRate}% tổng`}
                                </div>
                            </div>

                            {/* Conversion Arrow between steps */}
                            {idx < stages.length - 2 && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, marginBottom: -8, color: '#bfbfbf', fontSize: 12 }}>
                                    <ArrowRightOutlined style={{ transform: 'rotate(90deg)' }} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
