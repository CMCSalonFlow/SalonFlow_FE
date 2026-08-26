import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getLoyaltySummaryApi = async (userId) => {
    const params = userId ? { userId } : {};
    const res = await api.get(ENDPOINTS.LOYALTY_SUMMARY, { params });
    return res.data;
};

export const getLoyaltyHistoryApi = async (userId) => {
    const params = userId ? { userId } : {};
    const res = await api.get(ENDPOINTS.LOYALTY_HISTORY, { params });
    return res.data;
};

export const redeemPointsApi = async (pointsToRedeem) => {
    const res = await api.post(ENDPOINTS.LOYALTY_REDEEM, { pointsToRedeem });
    return res.data;
};
