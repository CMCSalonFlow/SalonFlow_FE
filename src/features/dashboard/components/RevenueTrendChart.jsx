import React, { useState, useRef, useEffect } from 'react';
import { Card, Tag, Space, Typography } from 'antd';
import { CrownOutlined, RiseOutlined, FallOutlined, BarChartOutlined, LineChartOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function RevenueTrendChart({ timeline = [], period = 'daily', peakPeriod = null, overallYoY = 0 }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const scrollContainerRef = useRef(null);

    const formatVND = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    // Auto-scroll to the end (latest date) when chart loads
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [timeline]);

    if (!timeline || timeline.length === 0) {
        return (
            <Card bordered={false} style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">Chưa có dữ liệu doanh thu trong khoảng thời gian được chọn</Text>
            </Card>
        );
    }

    const isDaily = period === 'daily';

    // Calculate chart bounds
    const maxVal = Math.max(
        ...timeline.flatMap((t) => [
            Number(t.currentRevenue || 0),
            Number(t.previousYearRevenue || 0)
        ]),
        100000
    );

    const chartHeight = 220;
    const itemMinWidth = 52; // Chiều rộng tối thiểu mỗi cột ngày (px)
    const isScrollable = timeline.length > 10;
    const chartContentWidth = isScrollable ? timeline.length * itemMinWidth : '100%';
    const svgWidth = isScrollable ? timeline.length * itemMinWidth : 700;
    const paddingY = 24;

    const points = timeline.map((item, idx) => {
        const x = ((idx + 0.5) / timeline.length) * (typeof svgWidth === 'number' ? svgWidth : 700);
        const currRev = Number(item.currentRevenue || 0);
        const prevRev = Number(item.previousYearRevenue || 0);

        const currY = chartHeight - paddingY - (currRev / maxVal) * (chartHeight - paddingY * 2);
        const prevY = chartHeight - paddingY - (prevRev / maxVal) * (chartHeight - paddingY * 2);

        return { x, currY, prevY, currRev, prevRev, item, idx };
    });

    // Main line path
    const linePathD = points.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x},${pt.currY}`;
        const prevPt = points[i - 1];
        const cx = (prevPt.x + pt.x) / 2;
        return `${acc} C ${cx},${prevPt.currY} ${cx},${pt.currY} ${pt.x},${pt.currY}`;
    }, '');

    // YoY comparison line path
    const prevLinePathD = points.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x},${pt.prevY}`;
        const prevPt = points[i - 1];
        const cx = (prevPt.x + pt.x) / 2;
        return `${acc} C ${cx},${prevPt.prevY} ${cx},${pt.prevY} ${pt.x},${pt.prevY}`;
    }, '');

    const areaPathD = `${linePathD} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`;

    const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

    // Smart tooltip alignment for edge items (index 0 and N-1)
    const getTooltipTransform = (idx) => {
        if (idx === 0) return 'translateX(0%)';
        if (idx === timeline.length - 1) return 'translateX(-100%)';
        return 'translateX(-50%)';
    };

    const getShortLabel = (label) => {
        if (!label) return '';
        if (label.includes(' (')) {
            return label.split(' (')[0];
        }
        return label;
    };

    return (
        <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            bodyStyle={{ padding: '20px 24px' }}
        >
            {/* Header Title + Peak Period Highlight Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                    <Space align="center" size={8}>
                        {isDaily ? <BarChartOutlined style={{ color: '#1890ff', fontSize: 20 }} /> : <LineChartOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
                        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                            {isDaily ? 'Biểu đồ Doanh thu Hàng ngày (Bar Chart)' : 'Xu hướng Doanh thu (Line Chart)'}
                        </Title>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 2 }}>
                        {isDaily ? 'Cuộn ngang để xem chi tiết đầy đủ từng ngày' : 'Rê chuột vào điểm trên biểu đồ để xem ngày chi tiết'}
                    </Text>
                </div>

                {/* Highlight Peak Period Tag */}
                {peakPeriod && (
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
                            border: '1px solid #ffe58f',
                            borderRadius: 12,
                            padding: '8px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 2px 6px rgba(250, 140, 22, 0.15)'
                        }}
                    >
                        <div style={{ backgroundColor: '#fa8c16', color: '#fff', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            <CrownOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#873800', fontWeight: 600 }}>DOANH THU ĐỈNH CAO</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#d46b08' }}>
                                {peakPeriod.label}: {formatVND(peakPeriod.revenue)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend Row */}
            <div style={{ display: 'flex', gap: 20, fontSize: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, height: 14, backgroundColor: '#1890ff', borderRadius: 4, display: 'inline-block' }}></span>
                    <Text strong style={{ color: '#262626' }}>Doanh thu kỳ này</Text>
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, height: 3, backgroundColor: '#bfbfbf', borderTop: '2px dashed #8c8c8c', display: 'inline-block' }}></span>
                    <Text type="secondary">Cùng kỳ năm ngoái (YoY)</Text>
                </span>

                {overallYoY !== null && (
                    <Tag color={overallYoY >= 0 ? 'success' : 'error'} icon={overallYoY >= 0 ? <RiseOutlined /> : <FallOutlined />} style={{ borderRadius: 10, fontWeight: 700 }}>
                        YoY Tổng thể: {overallYoY > 0 ? `+${overallYoY}%` : `${overallYoY}%`}
                    </Tag>
                )}

                {isScrollable && (
                    <Tag color="orange" style={{ borderRadius: 10 }}>
                        👉 Kéo/Cuộn ngang để xem tất cả {timeline.length} mốc
                    </Tag>
                )}
            </div>

            {/* Scrollable Container Wrapper với Margin & Padding lề 24px thoải mái */}
            <div
                ref={scrollContainerRef}
                style={{
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    padding: '12px 16px 16px 16px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#1890ff #f0f0f0'
                }}
            >
                <div style={{ width: chartContentWidth, minWidth: '100%', position: 'relative', paddingLeft: 12, paddingRight: 12 }}>
                    {/* Main Chart Area */}
                    <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px`, marginTop: 10 }}>
                        {isDaily ? (
                            /* BAR CHART FOR DAILY */
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${timeline.length}, 1fr)`, gap: 6, height: '100%', alignItems: 'flex-end', paddingBottom: 24 }}>
                                {points.map((pt, i) => {
                                    const isHovered = hoveredIdx === i;
                                    const isPeak = pt.item.isPeakPeriod;
                                    const currPct = Math.min((pt.currRev / maxVal) * 100, 100);
                                    const prevPct = Math.min((pt.prevRev / maxVal) * 100, 100);

                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                position: 'relative',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'flex-end',
                                                justifyContent: 'center',
                                                gap: 3,
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={() => setHoveredIdx(i)}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                        >
                                            {/* Previous Year Bar */}
                                            <div
                                                style={{
                                                    width: 8,
                                                    height: `${Math.max(prevPct, 3)}%`,
                                                    backgroundColor: '#d9d9d9',
                                                    borderRadius: '3px 3px 0 0',
                                                    transition: 'all 0.2s'
                                                }}
                                            />

                                            {/* Current Year Bar */}
                                            <div
                                                style={{
                                                    width: 14,
                                                    height: `${Math.max(currPct, 3)}%`,
                                                    backgroundColor: isPeak ? '#fa8c16' : isHovered ? '#40a9ff' : '#1890ff',
                                                    borderRadius: '4px 4px 0 0',
                                                    boxShadow: isPeak ? '0 0 10px rgba(250, 140, 22, 0.5)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* LINE / AREA CHART FOR TRENDS */
                            <>
                                <svg
                                    viewBox={`0 0 ${typeof svgWidth === 'number' ? svgWidth : 700} ${chartHeight}`}
                                    preserveAspectRatio="none"
                                    style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
                                >
                                    <defs>
                                        <linearGradient id="revenue-area-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#1890ff" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="#1890ff" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>

                                    {/* Area Fill */}
                                    <path d={areaPathD} fill="url(#revenue-area-grad)" />

                                    {/* YoY Line (Dashed) */}
                                    <path
                                        d={prevLinePathD}
                                        fill="none"
                                        stroke="#bfbfbf"
                                        strokeWidth="2"
                                        strokeDasharray="5,5"
                                    />

                                    {/* Current Line */}
                                    <path
                                        d={linePathD}
                                        fill="none"
                                        stroke="#1890ff"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                {/* HTML Dots (Perfect Circles) */}
                                {points.map((pt, i) => {
                                    const isHovered = hoveredIdx === i;
                                    const isPeak = pt.item.isPeakPeriod;
                                    const leftPct = (pt.x / (typeof svgWidth === 'number' ? svgWidth : 700)) * 100;
                                    const topPx = pt.currY;

                                    return (
                                        <div
                                            key={i}
                                            onMouseEnter={() => setHoveredIdx(i)}
                                            onMouseLeave={() => setHoveredIdx(null)}
                                            style={{
                                                position: 'absolute',
                                                left: `${leftPct}%`,
                                                top: `${topPx}px`,
                                                transform: 'translate(-50%, -50%)',
                                                width: isPeak ? 14 : isHovered ? 12 : 8,
                                                height: isPeak ? 14 : isHovered ? 12 : 8,
                                                borderRadius: '50%',
                                                backgroundColor: isPeak ? '#fa8c16' : isHovered ? '#ffffff' : '#1890ff',
                                                border: `2px solid ${isPeak ? '#ffffff' : '#1890ff'}`,
                                                boxShadow: isPeak
                                                    ? '0 0 0 3px #fa8c16, 0 2px 8px rgba(250, 140, 22, 0.4)'
                                                    : isHovered
                                                    ? '0 0 0 3px #1890ff40, 0 2px 6px rgba(0,0,0,0.2)'
                                                    : '0 1px 3px rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease-in-out',
                                                zIndex: isPeak ? 25 : 10
                                            }}
                                        />
                                    );
                                })}
                            </>
                        )}

                        {/* Smart Bounded Tooltip Overlay */}
                        {hoveredPoint && (
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: `${chartHeight - hoveredPoint.currY + 14}px`,
                                    left: `${(hoveredPoint.x / (typeof svgWidth === 'number' ? svgWidth : 700)) * 100}%`,
                                    transform: getTooltipTransform(hoveredPoint.idx),
                                    background: 'rgba(0, 0, 0, 0.92)',
                                    color: '#fff',
                                    fontSize: 12,
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    whiteSpace: 'nowrap',
                                    zIndex: 50,
                                    pointerEvents: 'none',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: 12, color: '#e6f7ff', marginBottom: 4 }}>
                                    {hoveredPoint.item.label} {hoveredPoint.item.isPeakPeriod ? '👑 (Đỉnh)' : ''}
                                </div>
                                <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                    Kỳ này: {formatVND(hoveredPoint.currRev)}
                                </div>
                                <div style={{ color: '#bfbfbf', fontSize: 11 }}>
                                    Năm ngoái: {formatVND(hoveredPoint.prevRev)}
                                </div>
                                {hoveredPoint.item.yoyGrowthRate !== null && (
                                    <div style={{ fontSize: 11, marginTop: 2, color: hoveredPoint.item.yoyGrowthRate >= 0 ? '#73d13d' : '#ff7875' }}>
                                        Tăng trưởng YoY: {hoveredPoint.item.yoyGrowthRate > 0 ? `+${hoveredPoint.item.yoyGrowthRate}%` : `${hoveredPoint.item.yoyGrowthRate}%`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Full X-Axis Labels Grid (Rút gọn chỉ hiển thị Tuần XX) */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${timeline.length}, 1fr)`,
                            gap: 4,
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px solid #f0f0f0',
                            textAlign: 'center'
                        }}
                    >
                        {timeline.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    fontSize: 11,
                                    color: item.isPeakPeriod ? '#fa8c16' : '#595959',
                                    fontWeight: item.isPeakPeriod ? 800 : 500,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {getShortLabel(item.label)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}

