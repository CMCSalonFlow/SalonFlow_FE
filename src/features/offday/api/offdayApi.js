import api from "@/core/api/axios";

const offdayApi = {
    createOffDay: async (staffId, data) => {
        const response = await api.patch(
            `/api/v1/staff/${staffId}/off-days`,
            data
        );
        return response.data;
    },

    getOffDaysByStaff: async (staffId) => {
        const response = await api.get(
            `/api/v1/staff/${staffId}/off-days`
        );
        return response.data;
    },

    updateOffDay: async (offDayId, data) => {
        const response = await api.put(
            `/api/v1/staff/off-days/${offDayId}`,
            data
        );
        return response.data;
    },

    deleteOffDay: async (offDayId) => {
        const response = await api.delete(
            `/api/v1/staff/off-days/${offDayId}`
        );
        return response.data;
    },
};

export default offdayApi;