import React, { useState } from 'react';
import { Tag, Tooltip, Modal, Progress, Button, message } from 'antd';
import { WarningOutlined, AlertOutlined, SafetyCertificateOutlined, SendOutlined } from '@ant-design/icons';
import { sendNoShowReminderApi } from '../api/noShowApi';

/**
 * Component hiển thị Badge Cảnh báo nguy cơ No-Show cho từng Booking
 * @param {Object} props
 * @param {number} props.probabilityPercentage Xác suất % No-Show (ví dụ: 78.4)
 * @param {string} props.riskLevel "HIGH" | "MEDIUM" | "LOW"
 * @param {string} props.explanation Chuỗi mô tả lý do AI dự đoán
 * @param {Object} props.features Các chỉ số đặc trưng (cancelRate, distanceKm, leadTimeHours, completedCount)
 * @param {number} props.bookingId ID của booking (dùng khi bấm gửi nhắc nhở)
 * @param {boolean} props.smsSent Đã gửi Email / SMS nhắc nhở chưa
 */
const NoShowWarningBadge = ({
    probabilityPercentage = 0,
    riskLevel = 'LOW',
    explanation = '',
    features = null,
    bookingId = null,
    smsSent = false,
    onReminderSent = () => { }
}) => {
    const [detailVisible, setDetailVisible] = useState(false);
    const [sending, setSending] = useState(false);

    if (!riskLevel) return null;

    const isHigh = riskLevel === 'HIGH' || probabilityPercentage >= 70;
    const isMedium = riskLevel === 'MEDIUM' || (probabilityPercentage >= 40 && probabilityPercentage < 70);

    const getBadgeConfig = () => {
        if (isHigh) {
            return {
                color: 'error',
                text: `Cảnh báo No-Show: ${probabilityPercentage}%`,
                bg: 'bg-red-50 text-red-700 border-red-200'
            };
        }
        if (isMedium) {
            return {
                color: 'warning',
                text: `Nguy cơ vừa: ${probabilityPercentage}%`,
                bg: 'bg-amber-50 text-amber-700 border-amber-200'
            };
        }
        return {
            color: 'success',
            text: `Uy tín cao: ${probabilityPercentage}%`,
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
    };

    const config = getBadgeConfig();

    const handleSendReminder = async () => {
        if (!bookingId) return;
        setSending(true);
        try {
            await sendNoShowReminderApi(bookingId);
            message.success('Đã gửi Email nhắc lịch hẹn thành công tới khách hàng!');
            onReminderSent();
        } catch (error) {
            message.error(error?.response?.data?.message || 'Không thể gửi email nhắc nhở');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Tooltip
                title="Click để xem phân tích chi tiết AI dự đoán nguy cơ không đến (No-Show)"
                destroyTooltipOnHide
            >
                <Tag
                    color={config.color}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDetailVisible(true);
                    }}
                    className="cursor-pointer px-2 py-1 rounded-md font-medium inline-flex items-center gap-1.5 transition-all hover:scale-105 select-none"
                >
                    <span>{config.text}</span>
                </Tag>
            </Tooltip>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-base font-semibold">
                        <span>Chi Tiết Phân Tích AI Dự Đoán No-Show</span>
                    </div>
                }
                open={detailVisible}
                destroyOnClose
                maskClosable
                onCancel={() => setDetailVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailVisible(false)}>
                        Đóng
                    </Button>,
                    isHigh && (
                        <Button
                            key="send"
                            type="primary"
                            danger
                            icon={<SendOutlined />}
                            loading={sending}
                            onClick={handleSendReminder}
                        >
                            {smsSent ? 'Gửi Lại Email Nhắc Lịch' : 'Tự Động Gửi Email Nhắc Lịch'}
                        </Button>
                    )
                ]}
            >
                <div className="py-2 space-y-4">
                    {/* Progress Bar Xác suất */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-700">Xác suất khách KHÔNG ĐẾN:</span>
                            <span className={`text-lg font-bold ${isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {probabilityPercentage}%
                            </span>
                        </div>
                        <Progress
                            percent={probabilityPercentage}
                            status={isHigh ? 'exception' : isMedium ? 'normal' : 'success'}
                            strokeColor={isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981'}
                            showInfo={false}
                        />
                        <p className="mt-3 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 italic">
                            💡 {explanation || 'Phân tích từ mô hình Hồi quy Logistic AI.'}
                        </p>
                    </div>

                    {/* Feature Breakdown */}
                    {features && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Các chỉ số đặc trưng (Features Extracted):
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block">Tỉ lệ hủy/no-show quá khứ:</span>
                                    <span className="font-semibold text-slate-800">
                                        {Math.round((features.cancelRate || 0) * 100)}% ({features.totalCancelledOrNoShowBookings || 0}/{features.totalPastBookings || 0} lượt)
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block">Lead time đặt trước:</span>
                                    <span className="font-semibold text-slate-800">
                                        {features.leadTimeHours || 0} giờ (~{Math.round((features.leadTimeHours || 0) / 24)} ngày)
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block">Khoảng cách tới Salon:</span>
                                    <span className="font-semibold text-slate-800">
                                        ~{features.distanceKm || 0} km
                                    </span>
                                </div>
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block">Đã hoàn thành dịch vụ:</span>
                                    <span className="font-semibold text-slate-800">
                                        {features.completedCount || 0} lần thành công
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Status */}
                    {smsSent && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                            <SendOutlined className="text-emerald-600 text-sm" />
                            <span>Đã tự động kích hoạt gửi Email nhắc nhở tới hòm thư của khách hàng.</span>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default NoShowWarningBadge;
