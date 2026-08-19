import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

const offdayApi = {
    getSystemOffDays: async () => {
        const response = await api.get(ENDPOINTS.SYSTEM_OFF_DAYS);
        return response.data;
    },

    createSystemOffDay: async (data) => {
        const response = await api.post(ENDPOINTS.SYSTEM_OFF_DAYS, data);
        return response.data;
    },

    deleteSystemOffDay: async (id) => {
        const response = await api.delete(`${ENDPOINTS.SYSTEM_OFF_DAYS}/${id}`);
        return response.data;
    },

    checkBranchClosed: async (branchId, date) => {
        const response = await api.get(`${ENDPOINTS.SYSTEM_OFF_DAYS}/check-branch`, {
            params: { branchId, date }
        });
        return response.data;
    },

    getOffDaysForBranchRange: async (branchId, startDate, endDate) => {
        const response = await api.get(`${ENDPOINTS.SYSTEM_OFF_DAYS}/branch-range`, {
            params: { branchId, startDate, endDate }
        });
        return response.data;
    }
};

export default offdayApi;