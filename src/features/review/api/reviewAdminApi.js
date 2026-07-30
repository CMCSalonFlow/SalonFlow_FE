import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getAdminReviewsApi = async (params = {}) => {
    const response = await api.get(
        ENDPOINTS.ADMIN_REVIEWS,
        { params }
    );

    return response.data;
};

export const getAdminReviewByIdApi = async (reviewId) => {
    const response = await api.get(
        `${ENDPOINTS.ADMIN_REVIEWS}/${reviewId}`
    );

    return response.data;
};

export const getAdminReviewSummaryApi = async (branchId) => {
    const response = await api.get(
        ENDPOINTS.ADMIN_REVIEW_SUMMARY,
        {
            params: branchId ? { branchId } : {}
        }
    );

    return response.data;
};

export const triggerOwnerReviewAiApi = async () => {
    const response = await api.post(ENDPOINTS.OWNER_REVIEW_AI_TRIGGER);
    return response.data;
};
