import React from 'react';
import { Segmented, DatePicker, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function RevenuePeriodFilter({
    period = 'daily',
    onPeriodChange,
    dateRange = [],
    onDateRangeChange
}) {
    const periodOptions = [
        { label: 'Hàng ngày', value: 'daily' },
        { label: 'Hàng tuần', value: 'weekly' },
        { label: 'Hàng tháng', value: 'monthly' },
        { label: 'Hàng năm', value: 'yearly' }
    ];

    return (
        <Space align="center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <Segmented
                options={periodOptions}
                value={period}
                onChange={(val) => onPeriodChange(val)}
                size="middle"
                style={{ borderRadius: 10, background: '#f5f5f5', padding: 3 }}
            />

            <RangePicker
                value={
                    dateRange && dateRange[0] && dateRange[1]
                        ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                        : null
                }
                onChange={(dates, dateStrings) => {
                    if (dates && dates[0] && dates[1]) {
                        onDateRangeChange([
                            dates[0].format('YYYY-MM-DD'),
                            dates[1].format('YYYY-MM-DD')
                        ]);
                    } else {
                        onDateRangeChange(null);
                    }
                }}
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                style={{ borderRadius: 8 }}
                allowClear
            />
        </Space>
    );
}
