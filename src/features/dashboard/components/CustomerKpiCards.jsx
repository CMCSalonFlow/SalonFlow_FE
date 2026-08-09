import React from 'react';
import { Row, Col, Card, Typography, Tag, Tooltip } from 'antd';
import { TeamOutlined, CrownOutlined, DollarOutlined, WarningOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function CustomerKpiCards({ overviewData = null, loading = false }) {
    const formatVND = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    const totalCustomers = overviewData?.totalCustomers || 0;
    const avgClv = overviewData?.averageCustomerLifetimeValue || 0;
    const avgAov = overviewData?.averageOrderValue || 0;
    const avgFreq = overviewData?.averageFrequencyPerMonth || 0;
    const atRiskCount = overviewData?.atRiskCount || 0;
    const atRiskPct = overviewData?.atRiskPercentage || 0;

    const cards = [
        {
            title: 'TỔNG KHÁCH HÀNG',
            tooltip: 'Tổng số khách hàng độc nhất đã từng đăng ký hoặc hoàn thành dịch vụ tại Salon.',
            value: totalCustomers.toLocaleString('vi-VN'),
            subText: `Khách mới: ${overviewData?.newCount || 0} (${overviewData?.newPercentage || 0}%)`,
            icon: TeamOutlined,
            iconBg: '#e6f7ff',
            iconColor: '#1890ff',
            tagColor: 'processing',
            tagText: `${overviewData?.returningCount || 0} khách quay lại`
        },
        {
            title: 'CLV TRUNG BÌNH (1 NĂM)',
            tooltip: 'CLV (Customer Lifetime Value - Giá trị vòng đời khách hàng): Tổng doanh thu trung bình dự kiến 1 khách hàng mang lại cho Salon trong vòng 12 tháng.\n\nCông thức: CLV = AOV (Chi tiêu TB/lần) × Tần suất (lần/tháng) × 12 tháng.',
            value: formatVND(avgClv),
            subText: `Công thức: AOV × Tần suất × 12 tháng`,
            icon: CrownOutlined,
            iconBg: '#fff7e6',
            iconColor: '#fa8c16',
            tagColor: 'warning',
            tagText: 'Giá trị vòng đời'
        },
        {
            title: 'AOV & TẦN SUẤT QUAY LẠI',
            tooltip: '• AOV (Average Order Value - Giá trị đơn hàng trung bình): Số tiền trung bình khách chi trả cho mỗi lượt đặt lịch.\n• Tần suất: Số lượt đặt lịch trung bình của 1 khách hàng trong vòng 1 tháng.',
            value: formatVND(avgAov),
            subText: `Tần suất trung bình: ${avgFreq} lần/tháng`,
            icon: DollarOutlined,
            iconBg: '#f6ffed',
            iconColor: '#52c41a',
            tagColor: 'success',
            tagText: `${avgFreq} lượt/tháng`
        },
        {
            title: 'KHÁCH NGUY CƠ RỜI BỎ',
            tooltip: 'At-risk Customer (Khách hàng có nguy cơ ngưng sử dụng): Những khách hàng từng làm dịch vụ tại Salon nhưng đã hơn 60 ngày liên tục chưa quay lại đặt lịch mới.',
            value: `${atRiskCount} khách`,
            subText: `Chưa quay lại dịch vụ > 60 ngày`,
            icon: WarningOutlined,
            iconBg: '#fff1f0',
            iconColor: '#f5222d',
            tagColor: atRiskPct > 20 ? 'error' : 'warning',
            tagText: `${atRiskPct}% tổng khách`
        }
    ];

    return (
        <Row gutter={[16, 16]}>
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <Col xs={24} sm={12} lg={6} key={idx}>
                        <Card
                            loading={loading}
                            variant="borderless"
                            style={{
                                borderRadius: 16,
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                height: '100%',
                                transition: 'transform 0.2s, boxShadow 0.2s'
                            }}
                            styles={{ body: { padding: 20 } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            backgroundColor: card.iconBg,
                                            color: card.iconColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 18,
                                            marginRight: 4
                                        }}
                                    >
                                        <Icon />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {card.title}
                                    </Text>
                                    <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{card.tooltip}</div>} placement="top">
                                        <QuestionCircleOutlined style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: 13 }} />
                                    </Tooltip>
                                </div>
                                <Tag color={card.tagColor} style={{ borderRadius: 10, fontWeight: 600, margin: 0 }}>
                                    {card.tagText}
                                </Tag>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#141414', lineHeight: 1.2 }}>
                                    {card.value}
                                </div>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                    {card.subText}
                                </Text>
                            </div>
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
}
