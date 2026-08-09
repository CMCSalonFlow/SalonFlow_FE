import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getCustomerOverviewApi = async (branchId = null) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    const res = await api.get(ENDPOINTS.CUSTOMER_ANALYTICS_OVERVIEW, { params });
    return res.data;
};

export const getCustomerFunnelApi = async (branchId = null) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    const res = await api.get(ENDPOINTS.CUSTOMER_ANALYTICS_FUNNEL, { params });
    return res.data;
};

export const getCustomersBySegmentApi = async (branchId = null, segmentType = "ALL", search = "", page = 0, size = 10) => {
    const params = { segmentType, page, size };
    if (branchId) params.branchId = branchId;
    if (search) params.search = search;
    const res = await api.get(ENDPOINTS.CUSTOMER_ANALYTICS_SEGMENTS, { params });
    return res.data;
};

export const generateAiCampaignApi = async (payload) => {
    const res = await api.post(ENDPOINTS.CUSTOMER_ANALYTICS_AI_GENERATE, payload);
    return res.data;
};

export const executeCampaignApi = async (payload) => {
    const res = await api.post(ENDPOINTS.CUSTOMER_ANALYTICS_EXECUTE_CAMPAIGN, payload);
    return res.data;
};

export const getCampaignHistoryApi = async (branchId = null) => {
    const params = {};
    if (branchId) params.branchId = branchId;
    const res = await api.get(ENDPOINTS.CUSTOMER_ANALYTICS_CAMPAIGN_HISTORY, { params });
    return res.data;
};
