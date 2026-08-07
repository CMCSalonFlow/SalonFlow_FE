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
