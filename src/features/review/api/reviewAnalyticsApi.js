import api from "@/core/api/axios";

const BASE = "/api/v1/analytics/reviews";

export const getReviewTrendApi = async ({ salonId, branchId, fromMonth, toMonth }) => {
    const params = {};
    if (salonId) params.salonId = salonId;
    if (branchId) params.branchId = branchId;
    if (fromMonth) params.fromMonth = fromMonth;
    if (toMonth) params.toMonth = toMonth;
    const res = await api.get(`${BASE}/trend`, { params });
    return res.data;
};

export const getTopReviewsApi = async ({ salonId, branchId, limit = 5 }) => {
    const params = { limit };
    if (salonId) params.salonId = salonId;
    if (branchId) params.branchId = branchId;
    const res = await api.get(`${BASE}/top`, { params });
    return res.data;
};

export const getBranchComparisonApi = async (salonId) => {
    const res = await api.get(`${BASE}/compare-branches`, { params: { salonId } });
    return res.data;
};

export const getWordCloudApi = async ({ salonId, branchId, yearMonth, limit = 30 }) => {
    const params = { limit };
    if (salonId) params.salonId = salonId;
    if (branchId) params.branchId = branchId;
    if (yearMonth) params.yearMonth = yearMonth;
    const res = await api.get(`${BASE}/keywords`, { params });
    return res.data;
};

export const exportReviewsCsvApi = async ({ salonId, branchId }) => {
    const params = {};
    if (salonId) params.salonId = salonId;
    if (branchId) params.branchId = branchId;
    // responseType blob để tải file, không parse JSON
    const res = await api.get(`${BASE}/export`, { params, responseType: "blob" });
    return res.data;
};
