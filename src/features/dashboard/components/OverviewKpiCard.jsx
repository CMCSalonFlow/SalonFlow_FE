import React from 'react';
import { Card, Statistic, Tag, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import SparklineChart from './SparklineChart';

const { Text } = Typography;

export default function OverviewKpiCard({
    title,
    value,
    subText,
    growthRate = null,
    icon: Icon,
    iconBg = '#e6f7ff',
    iconColor = '#1890ff',
    trendData = [],
    dataKey = 'revenue',
    color = '#1890ff',
    gradientId = 'kpi-grad',
    formatter = (v) => v
}) {
    const isPositive = growthRate !== null && growthRate > 0;
    const isNegative = growthRate !== null && growthRate < 0;

    return (
        <Card
            variant="borderless"
            className="owner-kpi-card"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
            styles={{ body: { padding: '22px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
        >
            {/* Header: Icon + Title + Growth Tag */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {Icon && (
                            <div
                                className="owner-kpi-icon-wrapper"
                                style={{
                                    backgroundColor: iconBg,
                                    color: iconColor,
                                    boxShadow: `0 4px 12px ${iconColor}25`
                                }}
                            >
                                <Icon />
                            </div>
                        )}
                        <Text style={{ fontSize: 13, fontWeight: 700, color: '#475569', letterSpacing: 0.3 }}>
                            {title}
                        </Text>
                    </div>

                    {growthRate !== null && (
                        <Tag
                            color={isPositive ? 'success' : isNegative ? 'error' : 'default'}
                            icon={isPositive ? <ArrowUpOutlined /> : isNegative ? <ArrowDownOutlined /> : <MinusOutlined />}
                            style={{ borderRadius: 20, fontWeight: 700, padding: '3px 10px', margin: 0, fontSize: 11 }}
                        >
                            {growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`}
                        </Tag>
                    )}
                </div>

                {/* Main Value */}
                <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                        {value}
                    </div>
                    {subText && (
                        <Text style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginTop: 5 }}>
                            {subText}
                        </Text>
                    )}
                </div>
            </div>

            {/* Bottom Sparkline */}
            <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 6 }}>
                    <span>7 ngày qua</span>
                    <span style={{ color: color, fontWeight: 600 }}>Biểu đồ</span>
                </div>
                <SparklineChart
                    data={trendData}
                    dataKey={dataKey}
                    color={color}
                    gradientId={gradientId}
                    height={48}
                    formatter={formatter}
                />
            </div>
        </Card>
    );
}
