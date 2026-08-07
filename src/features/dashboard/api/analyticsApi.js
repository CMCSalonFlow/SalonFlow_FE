import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getOverviewAnalyticsApi = async (branchId = null) => {
    const params = {};
    if (branchId) {
        params.branchId = branchId;
    }
    const res = await api.get(ENDPOINTS.ANALYTICS_OVERVIEW, { params });
    return res.data;
};

export const getRevenueAnalyticsApi = async (period = 'daily', from = null, to = null, branchId = null) => {
    const params = { period };
    if (from) params.from = from;
    if (to) params.to = to;
    if (branchId) params.branchId = branchId;

    const res = await api.get(ENDPOINTS.ANALYTICS_REVENUE, { params });
    return res.data;
};
