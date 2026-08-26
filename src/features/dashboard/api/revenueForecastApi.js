import api from "@/core/api/axios";

const revenueBase = (branchId) => `/api/v1/branches/${branchId}/revenue`;

export const getRevenueHistoryApi = async (branchId, months = 2) => {
    const response = await api.get(`${revenueBase(branchId)}/history`, {
        params: { months }
    });
    return response.data;
};

export const getRevenueForecastApi = async (branchId, months = 2, periods = 7) => {
    const response = await api.get(`${revenueBase(branchId)}/forecast`, {
        params: { months, periods }
    });
    return response.data;
};

export const getSavedRevenueForecastApi = async (branchId, months = 2, periods = 7) => {
    const response = await api.get(`${revenueBase(branchId)}/forecast/saved`, {
        params: { months, periods }
    });
    return response.data;
};

export const trainRevenueForecastApi = async (branchId, months = 2) => {
    const response = await api.post(`${revenueBase(branchId)}/forecast/train`, null, {
        params: { months }
    });
    return response.data;
};

export const getRevenueForecastModelStatusApi = async (branchId) => {
    const response = await api.get(`${revenueBase(branchId)}/forecast/model-status`);
    return response.data;
};
