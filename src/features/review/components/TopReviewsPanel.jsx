import React from 'react';
import { Card, List, Avatar, Rate, Typography, Tag, Row, Col } from 'antd';
import { SmileOutlined, FrownOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

function ReviewItem({ item }) {
    const confidencePercent = item.sentimentConfidence != null
        ? Math.round(item.sentimentConfidence * 100)
        : null;

    const sentimentColor =
        item.sentiment === 'POSITIVE' ? 'green' :
        item.sentiment === 'NEGATIVE' ? 'red' : 'default';

    return (
        <List.Item>
            <List.Item.Meta
                avatar={<Avatar src={item.customerAvatar} icon={<UserOutlined />} />}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong>{item.customerName || 'Khách hàng'}</Text>
                        <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                        {item.branchName && <Tag>{item.branchName}</Tag>}
                        {confidencePercent !== null && (
                            <Tag color={sentimentColor}>AI {confidencePercent}%</Tag>
                        )}
                    </div>
                }
                description={
                    <>
                        <Paragraph style={{ marginBottom: 4 }} ellipsis={{ rows: 2 }}>
                            {item.comment || '(Không có nội dung)'}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY HH:mm') : ''}
                        </Text>
                    </>
                }
            />
        </List.Item>
    );
}

export default function TopReviewsPanel({ topPositive = [], topNegative = [] }) {
    return (
        <>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                Chỉ hiển thị review đã được AI phân tích cảm xúc xong.
            </Text>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
                        title={
                            <span style={{ color: '#52c41a', fontWeight: 700 }}>
                                <SmileOutlined /> Top review tích cực
                            </span>
                        }
                    >
                        {topPositive.length === 0 ? (
                            <Text type="secondary">Chưa có review nào đã phân tích xong</Text>
                        ) : (
                            <List dataSource={topPositive} renderItem={(item) => <ReviewItem item={item} />} />
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
                        title={
                            <span style={{ color: '#ff4d4f', fontWeight: 700 }}>
                                <FrownOutlined /> Top review tiêu cực
                            </span>
                        }
                    >
                        {topNegative.length === 0 ? (
                            <Text type="secondary">Chưa có review nào đã phân tích xong</Text>
                        ) : (
                            <List dataSource={topNegative} renderItem={(item) => <ReviewItem item={item} />} />
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    );
}