import React, { useState } from 'react';

/**
 * Component SVG Sparkline Chart chuẩn với HTML Overlay Dots đảm bảo các chấm LUÔN TRÒN TUYỆT ĐỐI không bị dẹt
 */
export default function SparklineChart({
    data = [],
    dataKey = 'revenue',
    color = '#1890ff',
    gradientId = 'sparkline-grad',
    height = 55,
    showDots = true,
    alignWithColumns = false, // Nếu true: căn 7 chấm vào giữa 7 ô ngày bên dưới
    formatter = (val) => val
}) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    if (!data || data.length === 0) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf', fontSize: 12 }}>
                Chưa có dữ liệu
            </div>
        );
    }

    const values = data.map((d) => Number(d[dataKey] || 0));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const paddingY = 14;
    const width = 700; // viewBox width nội bộ SVG

    const points = values.map((val, idx) => {
        let x;
        if (alignWithColumns) {
            x = ((idx + 0.5) / values.length) * width;
        } else {
            const paddingX = 10;
            x = paddingX + (idx / Math.max(values.length - 1, 1)) * (width - paddingX * 2);
        }
        const normalizedY = (val - minVal) / range;
        const y = height - paddingY - normalizedY * (height - paddingY * 2);
        return { x, y, val, item: data[idx], idx };
    });

    const pathD = points.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x},${pt.y}`;
        const prevPt = points[i - 1];
        const cx = (prevPt.x + pt.x) / 2;
        return `${acc} C ${cx},${prevPt.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

    return (
        <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
            {/* SVG Line & Area Fill */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <path d={areaD} fill={`url(#${gradientId})`} />

                {/* Main Curve Line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Perfect Round HTML Dots (Không bao giờ bị méo/dẹt theo tỉ lệ SVG) */}
            {showDots &&
                points.map((pt, i) => {
                    const isHovered = hoveredIdx === i;
                    const leftPct = (pt.x / width) * 100;
                    const topPx = pt.y;

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
                                width: isHovered ? 12 : 8,
                                height: isHovered ? 12 : 8,
                                borderRadius: '50%',
                                backgroundColor: isHovered ? '#ffffff' : color,
                                border: `2px solid ${color}`,
                                boxShadow: isHovered
                                    ? `0 0 0 3px ${color}40, 0 2px 6px rgba(0,0,0,0.2)`
                                    : '0 1px 3px rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                                zIndex: 10
                            }}
                        />
                    );
                })}

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: `${height - hoveredPoint.y + 12}px`,
                        left: `${(hoveredPoint.x / width) * 100}%`,
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.88)',
                        color: '#fff',
                        fontSize: 11,
                        padding: '5px 10px',
                        borderRadius: 8,
                        whiteSpace: 'nowrap',
                        zIndex: 30,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ fontSize: 10, color: '#bfbfbf', marginBottom: 2 }}>
                        {hoveredPoint.item.dayOfWeek} ({hoveredPoint.item.date})
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: 12 }}>
                        {formatter(hoveredPoint.val)}
                    </div>
                </div>
            )}
        </div>
    );
}
