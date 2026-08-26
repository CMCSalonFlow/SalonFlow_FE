import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, InputNumber, Button, Space, Typography, Card, Tag, message } from 'antd';
import { RobotOutlined, SendOutlined, GiftOutlined, BulbOutlined } from '@ant-design/icons';
import { generateAiCampaignApi, executeCampaignApi } from '../api/customerAnalyticsApi';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function TargetedCampaignModal({
    visible = false,
    onClose = null,
    initialSegment = 'AT_RISK',
    branchId = null,
    onSuccess = null
}) {
    const [form] = Form.useForm();
    const [loadingAi, setLoadingAi] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createVoucher, setCreateVoucher] = useState(true);
    const [aiExplanation, setAiExplanation] = useState('');

    useEffect(() => {
        if (visible) {
            form.setFieldsValue({
                segmentType: initialSegment,
                campaignName: `Chiến dịch Chăm sóc khách hàng ${getSegmentLabel(initialSegment)}`,
                discountType: 'PERCENTAGE',
                discountValue: 20,
                minOrderAmount: 200000,
                maxDiscountAmount: 100000,
                validDays: 14
            });
            handleGenerateAi(initialSegment);
        } else {
            form.resetFields();
            setAiExplanation('');
        }
    }, [visible, initialSegment]);

    const getSegmentLabel = (type) => {
        switch (type) {
            case 'NEW': return 'Khách mới';
            case 'RETURNING': return 'Khách quay lại';
            case 'VIP': return 'Khách VIP';
            case 'AT_RISK': return 'Nguy cơ rời bỏ (At-risk)';
            default: return type;
        }
    };

    const handleGenerateAi = async (overrideSegment = null) => {
        const seg = overrideSegment || form.getFieldValue('segmentType') || 'AT_RISK';
        const values = form.getFieldsValue();
        try {
            setLoadingAi(true);
            const res = await generateAiCampaignApi({
                segmentType: seg,
                branchId,
                goalDescription: values.goalDescription,
                discountType: values.discountType,
                discountValue: values.discountValue,
                minOrderAmount: values.minOrderAmount,
                maxDiscountAmount: values.maxDiscountAmount
            });
            if (res) {
                form.setFieldsValue({
                    campaignName: res.campaignName || form.getFieldValue('campaignName'),
                    messageTitle: res.suggestedTitle,
                    messageContent: res.suggestedMessage,
                    discountType: res.discountType || form.getFieldValue('discountType') || 'PERCENTAGE',
                    discountValue: res.discountValue ?? form.getFieldValue('discountValue'),
                    minOrderAmount: res.minOrderAmount ?? form.getFieldValue('minOrderAmount'),
                    maxDiscountAmount: res.maxDiscountAmount ?? form.getFieldValue('maxDiscountAmount')
                });
                setAiExplanation(res.strategyExplanation || '');
                message.success('Đã tạo gợi ý thông điệp từ AI theo thông tin bạn vừa nhập!');
            }
        } catch (err) {
            console.error('AI Campaign Generation Error:', err);
            message.error('Không thể lấy gợi ý AI, vui lòng thử lại');
        } finally {
            setLoadingAi(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                campaignName: values.campaignName,
                segmentType: values.segmentType,
                branchId,
                messageTitle: values.messageTitle,
                messageContent: values.messageContent,
                createVoucher,
                discountType: values.discountType,
                discountValue: values.discountValue,
                minOrderAmount: values.minOrderAmount,
                maxDiscountAmount: values.maxDiscountAmount,
                validDays: values.validDays || 14
            };

            await executeCampaignApi(payload);
            message.success('Phát hành chiến dịch thành công! Đã gửi thông báo đến danh sách khách hàng.');
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (err) {
            console.error('Execute Campaign Error:', err);
            message.error(err.response?.data?.message || 'Phát hành chiến dịch thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={720}
            style={{ borderRadius: 16 }}
            title={
                <Space size={10}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <SendOutlined />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Tạo Chiến Dịch Tiếp Thị Nhắm Mục Tiêu</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>Tự động hóa truyền thông cá nhân hóa & phát hành ưu đãi cho từng phân khúc khách hàng</Text>
                    </div>
                </Space>
            }
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 20 }}>
                <Form.Item name="segmentType" label="Phân khúc Khách hàng Nhắm mục tiêu" rules={[{ required: true }]}>
                    <Select onChange={(val) => handleGenerateAi(val)} style={{ borderRadius: 8 }}>
                        <Option value="AT_RISK">🔴 Khách có nguy cơ rời bỏ (At-risk &gt; 60 ngày)</Option>
                        <Option value="VIP">👑 Khách hàng VIP (&gt; 5 lần / &gt; 5M chi tiêu)</Option>
                        <Option value="RETURNING">🟢 Khách hàng quay lại (2-5 lần)</Option>
                        <Option value="NEW">🔵 Khách hàng mới (Hoàn thành lần 1)</Option>
                    </Select>
                </Form.Item>


                {/* Toggle Voucher settings */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 12 }}>
                    <Space size={10}>
                        <GiftOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                        <div>
                            <div style={{ fontWeight: 700 }}>Đính kèm Voucher Khuyến mại Tự động</div>
                            <Text type="secondary" style={{ fontSize: 11 }}>Hệ thống sẽ tự sinh mã Voucher và gửi trực tiếp cho khách hàng trong phân khúc</Text>
                        </div>
                    </Space>
                    <Switch checked={createVoucher} onChange={(val) => setCreateVoucher(val)} />
                </div>

                {createVoucher && (
                    <Card size="small" style={{ marginBottom: 20, borderRadius: 12, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
                        <Space size={16} wrap>
                            <Form.Item name="discountType" label="Loại giảm giá" style={{ marginBottom: 8, width: 140 }}>
                                <Select style={{ borderRadius: 8 }}>
                                    <Option value="PERCENTAGE">Phần trăm (%)</Option>
                                    <Option value="FIXED">Số tiền cố định (VNĐ)</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="discountValue" label="Giá trị giảm" style={{ marginBottom: 8, width: 140 }}>
                                <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} />
                            </Form.Item>

                            <Form.Item name="minOrderAmount" label="Đơn tối thiểu (VNĐ)" style={{ marginBottom: 8, width: 160 }}>
                                <InputNumber min={0} step={50000} style={{ width: '100%', borderRadius: 8 }} />
                            </Form.Item>

                            <Form.Item name="validDays" label="Hạn dùng (Ngày)" style={{ marginBottom: 8, width: 120 }}>
                                <InputNumber min={1} max={90} style={{ width: '100%', borderRadius: 8 }} />
                            </Form.Item>
                        </Space>
                    </Card>
                )}

                {/* AI Rationale Banner */}
                <Card
                    size="small"
                    style={{
                        marginBottom: 20,
                        borderRadius: 12,
                        backgroundColor: '#f0f5ff',
                        borderColor: '#adc6ff'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={8}>
                            <RobotOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                            <Text fontWeight={700} style={{ color: '#1d39c4' }}>AI Campaign Assistant</Text>
                        </Space>
                        <Button
                            type="primary"
                            size="small"
                            icon={<RobotOutlined />}
                            loading={loadingAi}
                            onClick={() => handleGenerateAi()}
                            style={{ borderRadius: 8, background: '#1d39c4' }}
                        >
                            Gợi ý lại bằng AI
                        </Button>
                    </div>
                    {aiExplanation && (
                        <Paragraph type="secondary" style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                            <BulbOutlined style={{ color: '#fa8c16', marginRight: 4 }} /> {aiExplanation}
                        </Paragraph>
                    )}
                </Card>

                <Form.Item name="campaignName" label="Tên chiến dịch tiếp thị" rules={[{ required: true, message: 'Vui lòng nhập tên chiến dịch' }]}>
                    <Input placeholder="Ví dụ: Chiến dịch tri ân khách hàng At-risk Tháng 8" style={{ borderRadius: 8 }} />
                </Form.Item>

                <Form.Item name="messageTitle" label="Tiêu đề Thông báo / Tin nhắn" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                    <Input placeholder="Ví dụ: SalonFlow rất nhớ bạn! Nhận ngay ưu đãi 20%" style={{ borderRadius: 8 }} />
                </Form.Item>

                <Form.Item name="messageContent" label="Nội dung Tin nhắn Cá nhân hóa" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
                    <TextArea rows={4} placeholder="Nội dung gửi đến ứng dụng khách hàng..." style={{ borderRadius: 8 }} />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                    <Button onClick={onClose} style={{ borderRadius: 8 }}>Hủy bỏ</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        icon={<SendOutlined />}
                        style={{ borderRadius: 8, background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', border: 'none' }}
                    >
                        Phát Hành Chiến Dịch
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
