import React from 'react';
import { Card, Progress, Typography, Tag, Table } from 'antd';
import { PieChartOutlined, ScissorOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ServiceBreakdownChart({ breakdown = [], totalRevenue = 0 }) {
    const formatVND = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const colors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d'];

    if (!breakdown || breakdown.length === 0) {
        return (
            <Card
                bordered={false}
                title={
                    <span style={{ fontWeight: 700 }}>
                        <PieChartOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
                        Phân rã Doanh thu theo Dịch vụ (Pie Chart)
                    </span>
                }
                style={{ borderRadius: 16, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#bfbfbf', fontSize: 13 }}>
                    Chưa có dữ liệu dịch vụ hoàn thành trong khoảng thời gian này
                </div>
            </Card>
        );
    }

    // Prepare Pie SVG Conic Gradient angles
    let cumulativePercent = 0;
    const slices = breakdown.map((item, idx) => {
        const pct = item.percentage || 0;
        const startAngle = cumulativePercent;
        cumulativePercent += pct;
        return {
            ...item,
            color: colors[idx % colors.length],
            startPct: startAngle,
            endPct: cumulativePercent
        };
    });

    const columns = [
        {
            title: 'Dịch vụ / Gói',
            dataIndex: 'serviceName',
            key: 'serviceName',
            render: (text, record, idx) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {idx === 0 && <TrophyOutlined style={{ color: '#fa8c16', fontSize: 16 }} />}
                    <div>
                        <Text strong style={{ fontSize: 13 }}>{text}</Text>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{record.categoryName}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Lượt phục vụ',
            dataIndex: 'itemCount',
            key: 'itemCount',
            align: 'center',
            render: (val) => <Tag color="blue">{val} lượt</Tag>
        },
        {
            title: 'Doanh thu',
            dataIndex: 'revenue',
            key: 'revenue',
            align: 'right',
            render: (val) => <Text strong style={{ color: '#52c41a' }}>{formatVND(val)}</Text>
        },
        {
            title: 'Tỷ trọng %',
            dataIndex: 'percentage',
            key: 'percentage',
            align: 'right',
            render: (val) => <Tag color="purple">{val}%</Tag>
        }
    ];

    return (
        <Card
            bordered={false}
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>
                        <PieChartOutlined style={{ color: '#eb2f96', marginRight: 8, fontSize: 18 }} />
                        <strong style={{ fontSize: 16 }}>Phân rã Doanh thu theo Dịch vụ (Pie/Donut Chart)</strong>
                    </span>
                </div>
            }
            style={{ borderRadius: 16, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            styles={{ body: { padding: '20px 24px' } }}
        >
            <Text type="secondary" style={{ fontSize: 13, marginBottom: 20, display: 'block' }}>
                Tỷ trọng đóng góp doanh thu của từng danh mục dịch vụ trong salon
            </Text>

            {/* Donut Chart Visual & Legend Grid */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, flexWrap: 'wrap', marginBottom: 24 }}>
                {/* SVG Donut Chart */}
                <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', borderRadius: '50%' }}>
                        {slices.map((slice, i) => {
                            const strokeDasharray = `${slice.percentage} ${100 - slice.percentage}`;
                            const strokeDashoffset = 100 - slice.startPct;

                            return (
                                <circle
                                    key={i}
                                    cx="18"
                                    cy="18"
                                    r="15.91549430918954"
                                    fill="transparent"
                                    stroke={slice.color}
                                    strokeWidth="3.8"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            );
                        })}
                    </svg>

                    {/* Donut Center Info */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 10, color: '#8c8c8c', textTransform: 'uppercase' }}>TỔNG DỊCH VỤ</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#262626' }}>{breakdown.length}</div>
                    </div>
                </div>

                {/* Progress Breakdown Bars */}
                <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {breakdown.slice(0, 5).map((item, idx) => {
                        const color = colors[idx % colors.length];
                        return (
                            <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                                    <span style={{ fontWeight: 600, color: '#262626' }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, display: 'inline-block', marginRight: 6 }}></span>
                                        {item.serviceName}
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#595959' }}>
                                        {formatVND(item.revenue)} ({item.percentage}%)
                                    </span>
                                </div>
                                <Progress percent={item.percentage} strokeColor={color} showInfo={false} size="small" />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Service Ranking Table */}
            <Table
                dataSource={breakdown}
                columns={columns}
                rowKey={(r) => r.serviceId || r.serviceName}
                pagination={false}
                size="small"
                scroll={{ x: 500 }}
                style={{ marginTop: 16 }}
            />
        </Card>
    );
}
