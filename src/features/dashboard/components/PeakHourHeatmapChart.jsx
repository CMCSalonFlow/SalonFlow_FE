import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Tooltip, Spin, DatePicker, ConfigProvider } from 'antd';
import { HeatMapOutlined, ClockCircleOutlined, FireOutlined, TeamOutlined, CalendarOutlined, InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viVN from 'antd/locale/vi_VN';
import { getPeakHoursAnalyticsApi } from '../api/customerAnalyticsApi';

dayjs.locale('vi');

const { Text, Title } = Typography;

const DAY_LABELS = [
    { dayOfWeek: 1, label: 'Thứ 2' },
    { dayOfWeek: 2, label: 'Thứ 3' },
    { dayOfWeek: 3, label: 'Thứ 4' },
    { dayOfWeek: 4, label: 'Thứ 5' },
    { dayOfWeek: 5, label: 'Thứ 6' },
    { dayOfWeek: 6, label: 'Thứ 7' },
    { dayOfWeek: 7, label: 'Chủ Nhật' }
];

// Tạo 30 mốc thời gian (mỗi mốc 30 phút từ 07:00 đến 21:30)
const TIME_SLOTS = [];
for (let h = 7; h <= 21; h++) {
    TIME_SLOTS.push({ hour: h, minute: 0, label: `${String(h).padStart(2, '0')}:00` });
    TIME_SLOTS.push({ hour: h, minute: 30, label: `${String(h).padStart(2, '0')}:30` });
}

export default function PeakHourHeatmapChart({ branchId = null }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hoveredCell, setHoveredCell] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(dayjs());

    const loadData = async () => {
        try {
            setLoading(true);
            let fromStr = null;
            let toStr = null;

            if (selectedWeek) {
                const start = selectedWeek.day(1); // Thứ 2
                const end = selectedWeek.day(7);   // Chủ Nhật
                fromStr = start.format('YYYY-MM-DD');
                toStr = end.format('YYYY-MM-DD');
            }

            const res = await getPeakHoursAnalyticsApi(branchId, fromStr, toStr);
            if (res) {
                setData(res);
            }
        } catch (err) {
            console.error('Error fetching peak hours heatmap:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [branchId, selectedWeek]);

    const getCellColor = (count, maxCount) => {
        if (!count || count === 0) return '#f9f0ff';
        const ratio = maxCount > 0 ? count / maxCount : 0;
        if (ratio > 0.85) return '#391085'; // Peak density (Deep Purple)
        if (ratio > 0.60) return '#722ed1'; // High density
        if (ratio > 0.35) return '#9254de'; // Medium density
        if (ratio > 0.15) return '#b37feb'; // Low-medium density
        return '#d3ade6';                   // Soft purple
    };

    const getCellTextColor = (count, maxCount) => {
        if (!count || count === 0) return '#bfbfbf';
        const ratio = maxCount > 0 ? count / maxCount : 0;
        return ratio > 0.35 ? '#ffffff' : '#434343';
    };

    // Matrix lookup map: "dayOfWeek-hourOfDay-minuteOfHour"
    const matrixMap = {};
    if (data?.matrix) {
        data.matrix.forEach(cell => {
            const minKey = cell.minuteOfHour !== undefined ? cell.minuteOfHour : 0;
            matrixMap[`${cell.dayOfWeek}-${cell.hourOfDay}-${minKey}`] = cell;
        });
    }

    const maxCount = data?.maxBookingCount || 0;

    const dateRangeText = data?.fromDate && data?.toDate
        ? `${dayjs(data.fromDate).format('DD/MM/YYYY')} - ${dayjs(data.toDate).format('DD/MM/YYYY')}`
        : 'Toàn bộ thời gian';

    const getDayDateLabel = (dayOfWeek) => {
        if (!data?.fromDate || !data?.toDate) return null;
        const start = dayjs(data.fromDate);
        const end = dayjs(data.toDate);

        for (let d = end; d.isAfter(start) || d.isSame(start, 'day'); d = d.subtract(1, 'day')) {
            const dow = d.day() === 0 ? 7 : d.day();
            if (dow === dayOfWeek) {
                return d.format('DD/MM');
            }
        }
        return null;
    };

    return (
        <Card
            variant="borderless"
            style={{
                borderRadius: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                marginBottom: 24
            }}
            styles={{ body: { padding: 24 } }}
        >
            {/* Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                <Space size={12} align="center" wrap>
                    <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#f9f0ff', color: '#722ed1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        <HeatMapOutlined />
                    </div>
                    <div>
                        <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                            Biểu đồ Heatmap Khung Giờ Cao Điểm
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Phân tích mật độ chi tiết cách 30 phút theo Thứ trong tuần × Khung giờ ({dateRangeText})
                        </Text>
                    </div>

                    <Space size={8} align="center" style={{ marginLeft: 8 }}>
                        <style>{`
                            .hide-week-col .ant-picker-content th:first-child,
                            .hide-week-col .ant-picker-content td.ant-picker-cell-week,
                            .hide-week-col .ant-picker-content td.ant-picker-week-panel-row-cell-week {
                                display: none !important;
                            }
                        `}</style>
                        <CalendarOutlined style={{ color: '#722ed1' }} />
                        <Text strong style={{ fontSize: 13, color: '#475569' }}>Chọn tuần xem:</Text>
                        <ConfigProvider locale={viVN}>
                            <DatePicker
                                picker="week"
                                value={selectedWeek}
                                onChange={(date) => date && setSelectedWeek(date)}
                                allowClear={false}
                                size="small"
                                placeholder="Chọn tuần phân tích"
                                popupClassName="hide-week-col"
                                format={(val) => val ? `${val.day(1).format('DD/MM')} - ${val.day(7).format('DD/MM/YYYY')}` : ''}
                                style={{ borderRadius: 8, width: 215, fontWeight: 600 }}
                            />
                        </ConfigProvider>
                    </Space>
                </Space>

                {/* Insights Summary Tags */}
                {data && (
                    <Space size={10} wrap>
                        <Tag icon={<FireOutlined style={{ color: '#ff4d4f' }} />} color="purple" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>
                            Ngày đông nhất: <b>{data.busiestDay || 'N/A'}</b>
                        </Tag>
                        <Tag icon={<ClockCircleOutlined style={{ color: '#1890ff' }} />} color="geekblue" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>
                            Giờ cao điểm: <b>{data.busiestHour || 'N/A'}</b>
                        </Tag>
                        <Tag icon={<TeamOutlined style={{ color: '#52c41a' }} />} color="green" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12 }}>
                            Tổng đơn phân tích: <b>{data.totalBookingsAnalysed || 0} lượt</b>
                        </Tag>
                    </Space>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin size="large" description="Đang phân tích mật độ giờ cao điểm..." />
                </div>
            ) : (
                <>
                    {/* Scrollable Container with Fixed Cell Sizes */}
                    <div
                        style={{
                            overflowX: 'auto',
                            paddingBottom: 12,
                            borderRadius: 8,
                            boxShadow: 'inset -8px 0 8px -8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: 'max-content', minWidth: '100%' }}>
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: '#ffffff',
                                            zIndex: 20,
                                            width: 125,
                                            minWidth: 125,
                                            padding: '8px 6px',
                                            fontSize: 12,
                                            color: '#8c8c8c',
                                            textAlign: 'left',
                                            fontWeight: 700,
                                            boxShadow: '2px 0 5px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        Ngày / Giờ
                                    </th>
                                    {TIME_SLOTS.map((slot, idx) => (
                                        <th
                                            key={`${slot.hour}-${slot.minute}`}
                                            style={{
                                                width: 48,
                                                minWidth: 48,
                                                padding: '6px 2px',
                                                fontSize: 10,
                                                color: slot.minute === 0 ? '#1890ff' : '#8c8c8c',
                                                textAlign: 'center',
                                                fontWeight: slot.minute === 0 ? 700 : 500
                                            }}
                                        >
                                            {slot.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAY_LABELS.map(day => {
                                    const dateLabel = getDayDateLabel(day.dayOfWeek);
                                    return (
                                        <tr key={day.dayOfWeek}>
                                            <td
                                                style={{
                                                    position: 'sticky',
                                                    left: 0,
                                                    backgroundColor: '#ffffff',
                                                    zIndex: 15,
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    color: '#262626',
                                                    padding: '6px 8px',
                                                    boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                <span>{day.label}</span>
                                                {dateLabel && (
                                                    <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4, fontWeight: 500 }}>
                                                        ({dateLabel})
                                                    </span>
                                                )}
                                            </td>
                                            {TIME_SLOTS.map(slot => {
                                                const key = `${day.dayOfWeek}-${slot.hour}-${slot.minute}`;
                                                const cell = matrixMap[key] || {
                                                    dayName: day.label,
                                                    hourLabel: slot.label,
                                                    bookingCount: 0
                                                };
                                                const count = cell.bookingCount || 0;
                                                const bgColor = getCellColor(count, maxCount);
                                                const textColor = getCellTextColor(count, maxCount);

                                                let endLabel = slot.minute === 0
                                                    ? `${String(slot.hour).padStart(2, '0')}:30`
                                                    : `${String(slot.hour + 1).padStart(2, '0')}:00`;

                                                let recommendationText = 'Bố trí ca làm bình thường';
                                                if (count > 0) {
                                                    if (maxCount > 0 && count / maxCount > 0.8) {
                                                        recommendationText = '🔥 Cao điểm nhất! Cần tối đa 100% thợ trực ca';
                                                    } else if (maxCount > 0 && count / maxCount > 0.4) {
                                                        recommendationText = '⚡ Giờ đông khách, khuyến nghị bố trí thêm thợ';
                                                    }
                                                } else {
                                                    recommendationText = '☕ Giờ thấp điểm, có thể sắp xếp xoay ca nghỉ';
                                                }

                                                const tooltipContent = (
                                                    <div style={{ padding: 4 }}>
                                                        <div style={{ fontWeight: 700, color: '#ffd666', fontSize: 13, marginBottom: 4 }}>
                                                            📅 {day.label} {dateLabel ? `(${dateLabel})` : ''} | ⏰ Khung {slot.label} - {endLabel}
                                                        </div>
                                                        <div style={{ fontSize: 12, marginBottom: 2 }}>
                                                            Mật độ: <b>{count} lượt đặt dịch vụ</b>
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#e6f7ff', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 4, marginTop: 4 }}>
                                                            💡 {recommendationText}
                                                        </div>
                                                    </div>
                                                );

                                            return (
                                                <td key={key} style={{ padding: 0, width: 48, minWidth: 48 }}>
                                                    <Tooltip title={tooltipContent} placement="top" arrow>
                                                        <div
                                                            onMouseEnter={() => setHoveredCell(key)}
                                                            onMouseLeave={() => setHoveredCell(null)}
                                                            style={{
                                                                width: 48,
                                                                height: 38,
                                                                backgroundColor: bgColor,
                                                                color: textColor,
                                                                borderRadius: 6,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: count > 0 ? 800 : 400,
                                                                fontSize: 11,
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                                                                transform: hoveredCell === key ? 'scale(1.18)' : 'scale(1)',
                                                                boxShadow: hoveredCell === key ? '0 4px 12px rgba(114, 46, 209, 0.4)' : 'none',
                                                                zIndex: hoveredCell === key ? 25 : 1,
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            {count > 0 ? count : ''}
                                                        </div>
                                                    </Tooltip>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                        </table>
                    </div>

                    {/* Legend Scale Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 12 }}>
                        {/* Color Scale Legend */}
                        <Space size={12} align="center">
                            <Text type="secondary" style={{ fontSize: 11 }}>Thang mật độ:</Text>
                            <Space size={4}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#f9f0ff', border: '1px solid #d9d9d9' }} />
                                    <span style={{ fontSize: 10, color: '#8c8c8c' }}>0</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#d3ade6' }} />
                                    <span style={{ fontSize: 10, color: '#8c8c8c' }}>Thấp</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#9254de' }} />
                                    <span style={{ fontSize: 10, color: '#8c8c8c' }}>Vừa</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#722ed1' }} />
                                    <span style={{ fontSize: 10, color: '#8c8c8c' }}>Đông</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#391085' }} />
                                    <span style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 700 }}>Cao điểm ⚡</span>
                                </div>
                            </Space>
                        </Space>
                    </div>
                </>
            )}
        </Card>
    );
}
