import React from 'react';
import { Alert, Tag, Space } from 'antd';
import { WarningOutlined, FallOutlined } from '@ant-design/icons';

export default function RevenueAlertBanner({ alert }) {
    if (!alert || !alert.isAlerting) return null;

    const formatCurrency = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    return (
        <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined style={{ fontSize: 20, color: '#fa8c16' }} />}
            style={{
                marginBottom: 20,
                borderRadius: 12,
                border: '1px solid #ffe58f',
                background: '#fffbe6',
                padding: '12px 20px'
            }}
            message={
                <Space align="center" style={{ flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 15, color: '#873800' }}>
                        Cảnh báo sụt giảm doanh thu hôm nay
                    </span>
                    <Tag color="error" icon={<FallOutlined />}>
                        Giảm {alert.dropPercentage}%
                    </Tag>
                </Space>
            }
            description={
                <div style={{ marginTop: 6, color: '#595959', fontSize: 13 }}>
                    {alert.message ||
                        `Doanh thu hôm nay (${formatCurrency(alert.todayRevenue)}) đang thấp hơn 80% so với trung bình 7 ngày tuần trước (${formatCurrency(alert.lastWeekDailyAverage)}/ngày).`}
                </div>
            }
        />
    );
}
