import React from 'react';
import { Select, Space } from 'antd';
import { ShopOutlined } from '@ant-design/icons';

export default function BranchSelector({ branches = [], selectedBranchId, onChange }) {
    return (
        <Space>
            <ShopOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            <Select
                value={selectedBranchId || undefined}
                onChange={(val) => onChange(val || null)}
                placeholder="Tất cả chi nhánh"
                allowClear
                style={{ width: 220 }}
            >
                {branches.map((b) => (
                    <Select.Option key={b.id} value={b.id}>
                        {b.name}
                    </Select.Option>
                ))}
            </Select>
        </Space>
    );
}
