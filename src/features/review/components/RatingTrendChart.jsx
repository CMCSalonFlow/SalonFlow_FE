import React, { useState } from 'react';
import { Card, Typography, Space, Radio, Row, Col } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function RatingTrendChart({ points = [], periodMonths = 6, onPeriodChange }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    if (!points || points.length === 0) {
        return (
            <Card bordered={false} style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Chưa có dữ liệu rating trong khoảng thời gian được chọn</Text>
            </Card>
        );
    }

    const chartHeight = 200;
    const paddingY = 24;
    const svgWidth = 700;
    const maxRating = 5;

    const pts = points.map((item, idx) => {
        const x = ((idx + 0.5) / points.length) * svgWidth;
        const rating = Number(item.averageRating || 0);
        const y = chartHeight - paddingY - (rating / maxRating) * (chartHeight - paddingY * 2);
        return { x, y, rating, item, idx };
    });

    const linePathD = pts.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x},${pt.y}`;
        const prev = pts[i - 1];
        const cx = (prev.x + pt.x) / 2;
        return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
    }, '');

    const areaPathD = `${linePathD} L ${pts[pts.length - 1].x},${chartHeight} L ${pts[0].x},${chartHeight} Z`;

    const hovered = hoveredIdx !== null ? pts[hoveredIdx] : null;

    const getTooltipTransform = (idx) => {
        if (idx === 0) return 'translateX(0%)';
        if (idx === points.length - 1) return 'translateX(-100%)';
        return 'translateX(-50%)';
    };

    return (
        <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            bodyStyle={{ padding: '20px 24px' }}
        >
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Space align="center" size={8}>
                        <LineChartOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                            Xu hướng Rating trung bình theo tháng
                        </Title>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 2 }}>
                        Rê chuột vào điểm trên biểu đồ để xem chi tiết từng tháng
                    </Text>
                </Col>
                <Col>
                    <Radio.Group
                        value={periodMonths}
                        onChange={(e) => onPeriodChange && onPeriodChange(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                        size="small"
                    >
                        <Radio.Button value={3}>3 tháng</Radio.Button>
                        <Radio.Button value={6}>6 tháng</Radio.Button>
                        <Radio.Button value={12}>1 năm</Radio.Button>
                    </Radio.Group>
                </Col>
            </Row>

            <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
                <svg
                    viewBox={`0 0 ${svgWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
                >
                    <defs>
                        <linearGradient id="rating-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fadb14" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#fadb14" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <path d={areaPathD} fill="url(#rating-area-grad)" />
                    <path d={linePathD} fill="none" stroke="#faad14" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {pts.map((pt, i) => {
                    const isHovered = hoveredIdx === i;
                    const leftPct = (pt.x / svgWidth) * 100;
                    return (
                        <div
                            key={i}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            style={{
                                position: 'absolute',
                                left: `${leftPct}%`,
                                top: `${pt.y}px`,
                                transform: 'translate(-50%, -50%)',
                                width: isHovered ? 12 : 8,
                                height: isHovered ? 12 : 8,
                                borderRadius: '50%',
                                backgroundColor: isHovered ? '#ffffff' : '#faad14',
                                border: '2px solid #faad14',
                                boxShadow: isHovered ? '0 0 0 3px #faad1440' : '0 1px 3px rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                                zIndex: 10
                            }}
                        />
                    );
                })}

                {hovered && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: `${chartHeight - hovered.y + 14}px`,
                            left: `${(hovered.x / svgWidth) * 100}%`,
                            transform: getTooltipTransform(hovered.idx),
                            background: 'rgba(0, 0, 0, 0.92)',
                            color: '#fff',
                            fontSize: 12,
                            padding: '8px 12px',
                            borderRadius: 10,
                            whiteSpace: 'nowrap',
                            zIndex: 50,
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#fff7e6', marginBottom: 4 }}>{hovered.item.month}</div>
                        <div style={{ color: '#ffe58f' }}>Trung bình: {hovered.rating.toFixed(2)} / 5</div>
                        <div style={{ color: '#bfbfbf', fontSize: 11 }}>{hovered.item.totalReviews} review</div>
                    </div>
                )}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${points.length}, 1fr)`,
                    gap: 4,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #f0f0f0',
                    textAlign: 'center'
                }}
            >
                {points.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 11, color: '#595959' }}>
                        {item.month}
                    </div>
                ))}
            </div>
        </Card>
    );
}
