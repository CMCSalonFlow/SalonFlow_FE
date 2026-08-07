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
            bordered={false}
            style={{
                borderRadius: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            bodyStyle={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
            {/* Header: Icon + Title + Growth Tag */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {Icon && (
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: iconBg,
                                    color: iconColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20
                                }}
                            >
                                <Icon />
                            </div>
                        )}
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {title}
                        </Text>
                    </div>

                    {growthRate !== null && (
                        <Tag
                            color={isPositive ? 'success' : isNegative ? 'error' : 'default'}
                            icon={isPositive ? <ArrowUpOutlined /> : isNegative ? <ArrowDownOutlined /> : <MinusOutlined />}
                            style={{ borderRadius: 12, fontWeight: 600, padding: '2px 8px', margin: 0 }}
                        >
                            {growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`}
                        </Tag>
                    )}
                </div>

                {/* Main Value */}
                <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#262626', lineHeight: 1.2 }}>
                        {value}
                    </div>
                    {subText && (
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                            {subText}
                        </Text>
                    )}
                </div>
            </div>

            {/* Bottom Sparkline */}
            <div style={{ marginTop: 16, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
                    <span>7 ngày qua</span>
                    <span>Xu hướng</span>
                </div>
                <SparklineChart
                    data={trendData}
                    dataKey={dataKey}
                    color={color}
                    gradientId={gradientId}
                    height={45}
                    formatter={formatter}
                />
            </div>
        </Card>
    );
}
