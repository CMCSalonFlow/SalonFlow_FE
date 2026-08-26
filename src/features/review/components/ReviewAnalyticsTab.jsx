import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Spin, Alert } from 'antd';
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


/**
 * ⚠️ GIẢ ĐỊNH CẦN XÁC NHẬN: component này cần salonId để gọi các API scope-theo-salon
 * (trend không branch, compare-branches, word cloud không branch). Đang lấy salonId
 * qua prop `salonId` truyền từ ngoài vào (ReviewAdminPage) — nơi đó cần tự lấy salonId
 * thật từ salonApi (ví dụ getMySalonApi()) rồi truyền xuống. Nếu salonId chưa có sẵn,
 * cần bổ sung logic lấy salon hiện tại trước khi dùng tab này.
 */
export default function ReviewAnalyticsTab({ salonId, branches = [], selectedBranchId }) {
    const [branchId, setBranchId] = useState(selectedBranchId || undefined);

    useEffect(() => {
        setBranchId(selectedBranchId || undefined);
    }, [selectedBranchId]);
    const [periodMonths, setPeriodMonths] = useState(6);

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
            const fromMonth = dayjs().subtract(periodMonths - 1, 'month').format('YYYY-MM');
            const toMonth = dayjs().format('YYYY-MM');
            const yearMonth = dayjs().format('YYYY-MM');

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
    }, [salonId, branchId, periodMonths]);

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
                    description="Vui lòng chọn chi nhánh ở bộ lọc bên trên để xem phân tích đánh giá."
                />
            )}

            {error && <Alert type="error" showIcon message="Lỗi tải dữ liệu" description={error} />}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Spin size="large" tip="Đang tải dữ liệu phân tích đánh giá..." />
                </div>
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={16}>
                            <RatingTrendChart
                                points={trend?.points || []}
                                periodMonths={periodMonths}
                                onPeriodChange={setPeriodMonths}
                            />
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
