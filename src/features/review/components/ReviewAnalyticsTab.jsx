import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Select, DatePicker, Button, Space, Spin, Alert, Typography, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import {
    getReviewTrendApi,
    getTopReviewsApi,
    getBranchComparisonApi,
    getWordCloudApi,
    exportReviewsCsvApi
} from '../api/reviewAnalyticsApi';

import RatingTrendChart from './RatingTrendChart';
import StarDistributionChart from './StarDistributionChart';
import TopReviewsPanel from './TopReviewsPanel';
import BranchComparisonTable from './BranchComparisonTable';
import WordCloudPanel from './WordCloudPanel';

const { Text } = Typography;

/**
 * ⚠️ GIẢ ĐỊNH CẦN XÁC NHẬN: component này cần salonId để gọi các API scope-theo-salon
 * (trend không branch, compare-branches, word cloud không branch). Đang lấy salonId
 * qua prop `salonId` truyền từ ngoài vào (ReviewAdminPage) — nơi đó cần tự lấy salonId
 * thật từ salonApi (ví dụ getMySalonApi()) rồi truyền xuống. Nếu salonId chưa có sẵn,
 * cần bổ sung logic lấy salon hiện tại trước khi dùng tab này.
 */
export default function ReviewAnalyticsTab({ salonId, branches = [] }) {
    const [branchId, setBranchId] = useState(undefined);
    const [monthRange, setMonthRange] = useState([dayjs().subtract(5, 'month'), dayjs()]);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    const [trend, setTrend] = useState(null);
    const [topReviews, setTopReviews] = useState(null);
    const [branchComparison, setBranchComparison] = useState(null);
    const [wordCloud, setWordCloud] = useState(null);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);

    const scopeParams = branchId ? { branchId } : { salonId };

    const loadAll = useCallback(async () => {
        if (!salonId && !branchId) {
            return; // Chưa có scope hợp lệ, không gọi API (tránh lỗi 400 từ BE)
        }
        setLoading(true);
        setError(null);
        try {
            const fromMonth = monthRange?.[0]?.format('YYYY-MM');
            const toMonth = monthRange?.[1]?.format('YYYY-MM');
            const yearMonth = selectedMonth?.format('YYYY-MM');

            const [trendRes, topRes, wordCloudRes] = await Promise.all([
                getReviewTrendApi({ ...scopeParams, fromMonth, toMonth }),
                getTopReviewsApi({ ...scopeParams, limit: 5 }),
                getWordCloudApi({ ...scopeParams, yearMonth, limit: 30 })
            ]);

            setTrend(trendRes);
            setTopReviews(topRes);
            setWordCloud(wordCloudRes);

            // So sánh chi nhánh chỉ có ý nghĩa ở mức salon (không branch cụ thể)
            if (salonId && !branchId) {
                const compareRes = await getBranchComparisonApi(salonId);
                setBranchComparison(compareRes);
            } else {
                setBranchComparison(null);
            }
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || 'Không thể tải dữ liệu phân tích đánh giá.');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salonId, branchId, monthRange, selectedMonth]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleExport = async () => {
        if (!salonId && !branchId) {
            message.warning('Cần chọn chi nhánh hoặc có salon hợp lệ trước khi export.');
            return;
        }
        setExporting(true);
        try {
            const blob = await exportReviewsCsvApi(scopeParams);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reviews-export-${branchId ? `branch-${branchId}` : `salon-${salonId}`}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('Đã tải file CSV thành công.');
        } catch (err) {
            console.error(err);
            message.error('Không thể export CSV. Vui lòng thử lại.');
        } finally {
            setExporting(false);
        }
    };

    // Phân bổ sao: nếu đang xem 1 branch cụ thể và có dữ liệu so sánh cho branch đó thì dùng,
    // nếu xem toàn salon thì cộng dồn distribution từ tất cả chi nhánh (branchComparison)
    const aggregatedDistribution = (() => {
        if (!branchComparison?.branches) return {};
        const result = {};
        branchComparison.branches.forEach((b) => {
            const dist = b.ratingDistribution || {};
            Object.entries(dist).forEach(([star, count]) => {
                result[star] = (result[star] || 0) + Number(count || 0);
            });
        });
        return result;
    })();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!salonId && !branchId && (
                <Alert
                    type="warning"
                    showIcon
                    message="Chưa xác định được salon/chi nhánh"
                    description="Vui lòng chọn 1 chi nhánh cụ thể ở bộ lọc bên dưới để xem phân tích đánh giá."
                />
            )}

            {error && <Alert type="error" showIcon message="Lỗi tải dữ liệu" description={error} />}

            <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} bodyStyle={{ padding: '16px 20px' }}>
                <Space wrap size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap>
                        <Select
                            allowClear
                            placeholder="Tất cả chi nhánh (theo salon)"
                            style={{ width: 240 }}
                            value={branchId}
                            onChange={(v) => setBranchId(v || undefined)}
                            options={branches.map((b) => ({ value: b.id, label: b.name }))}
                        />
                        <DatePicker.RangePicker
                            picker="month"
                            value={monthRange}
                            onChange={(dates) => dates && setMonthRange(dates)}
                            allowClear={false}
                        />
                        <DatePicker
                            picker="month"
                            value={selectedMonth}
                            onChange={(date) => date && setSelectedMonth(date)}
                            allowClear={false}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            (Tháng bên phải dùng cho Word Cloud)
                        </Text>
                    </Space>
                    <Space>
                        <Button icon={<ReloadOutlined spin={loading} />} onClick={loadAll} loading={loading}>
                            Làm mới
                        </Button>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
                            Export CSV
                        </Button>
                    </Space>
                </Space>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin size="large" tip="Đang tải dữ liệu phân tích đánh giá..." />
                </div>
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <RatingTrendChart points={trend?.points || []} />
                        </Col>
                        <Col xs={24} lg={8}>
                            <StarDistributionChart distribution={aggregatedDistribution} />
                        </Col>
                    </Row>

                    <TopReviewsPanel
                        topPositive={topReviews?.topPositive || []}
                        topNegative={topReviews?.topNegative || []}
                    />

                    {branchComparison && (
                        <BranchComparisonTable branches={branchComparison.branches || []} />
                    )}

                    <WordCloudPanel
                        keywords={wordCloud?.keywords || []}
                        yearMonth={wordCloud?.yearMonth}
                    />
                </>
            )}
        </div>
    );
}
