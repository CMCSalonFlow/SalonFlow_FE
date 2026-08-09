import React, { useState } from 'react';
import { Card, Typography, Space, Tag, Row, Col } from 'antd';
import { PieChartOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function CustomerSegmentationChart({ overviewData = null, onSelectSegment = null }) {
    const [hoveredSegment, setHoveredSegment] = useState(null);

    const segments = [
        {
            key: 'NEW',
            name: 'Khách mới (New)',
            rule: 'Hoàn thành 1 lần dịch vụ',
            count: overviewData?.newCount || 0,
            percentage: overviewData?.newPercentage || 0,
            color: '#1890ff',
            bgColor: '#e6f7ff'
        },
        {
            key: 'RETURNING',
            name: 'Khách quay lại (Returning)',
            rule: 'Hoàn thành 2-5 lần dịch vụ',
            count: overviewData?.returningCount || 0,
            percentage: overviewData?.returningPercentage || 0,
            color: '#52c41a',
            bgColor: '#f6ffed'
        },
        {
            key: 'VIP',
            name: 'Khách hàng VIP',
            rule: '> 5 lần hoặc > 5,000,000đ chi tiêu',
            count: overviewData?.vipCount || 0,
            percentage: overviewData?.vipPercentage || 0,
            color: '#fa8c16',
            bgColor: '#fff7e6'
        },
        {
            key: 'AT_RISK',
            name: 'Nguy cơ rời bỏ (At-risk)',
            rule: 'Chưa quay lại dịch vụ > 60 ngày',
            count: overviewData?.atRiskCount || 0,
            percentage: overviewData?.atRiskPercentage || 0,
            color: '#f5222d',
            bgColor: '#fff1f0'
        }
    ];

    const totalCount = overviewData?.totalCustomers || 0;

    // SVG Donut Chart Calculation
    const size = 200;
    const strokeWidth = 32;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;
    const slices = segments.map((seg) => {
        const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
        const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
        accumulatedPercentage += seg.percentage;
        return { ...seg, strokeDasharray, strokeDashoffset };
    });

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                height: '100%'
            }}
            styles={{ body: { padding: 24 } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Space size={8}>
                    <PieChartOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                    <Title level={5} style={{ margin: 0 }}>
                        Phân bổ Phân khúc Khách hàng
                    </Title>
                </Space>
                <Tag icon={<InfoCircleOutlined />} color="blue">
                    Rule Tự động
                </Tag>
            </div>

            <Row gutter={[24, 24]} align="middle">
                {/* SVG Donut Chart */}
                <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#f5f5f5"
                            strokeWidth={strokeWidth}
                        />
                        {totalCount > 0 &&
                            slices.map((slice) => (
                                <circle
                                    key={slice.key}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={slice.color}
                                    strokeWidth={hoveredSegment === slice.key ? strokeWidth + 4 : strokeWidth}
                                    strokeDasharray={slice.strokeDasharray}
                                    strokeDashoffset={slice.strokeDashoffset}
                                    style={{
                                        transform: 'rotate(-90deg)',
                                        transformOrigin: '50% 50%',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={() => setHoveredSegment(slice.key)}
                                    onMouseLeave={() => setHoveredSegment(null)}
                                    onClick={() => onSelectSegment && onSelectSegment(slice.key)}
                                />
                            ))}
                    </svg>
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#262626' }}>
                            {totalCount}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Khách hàng
                        </Text>
                    </div>
                </Col>

                {/* Legend list */}
                <Col xs={24} md={14}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {segments.map((seg) => (
                            <div
                                key={seg.key}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    backgroundColor: hoveredSegment === seg.key ? seg.bgColor : '#fafafa',
                                    borderLeft: `4px solid ${seg.color}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={() => setHoveredSegment(seg.key)}
                                onMouseLeave={() => setHoveredSegment(null)}
                                onClick={() => onSelectSegment && onSelectSegment(seg.key)}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#262626' }}>
                                        {seg.name}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        {seg.rule}
                                    </Text>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: seg.color }}>
                                        {seg.count} khách
                                    </div>
                                    <Tag color={seg.color} style={{ margin: 0, fontSize: 11, fontWeight: 600 }}>
                                        {seg.percentage}%
                                    </Tag>
                                </div>
                            </div>
                        ))}
                    </div>
                </Col>
            </Row>
        </Card>
    );
}
