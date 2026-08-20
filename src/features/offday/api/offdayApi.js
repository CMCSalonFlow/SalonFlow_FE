import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

const offdayApi = {
    // --------------------------------------------------------
    // Ngày nghỉ chung Salon & Đóng cửa hệ thống (System / Branch)
    // --------------------------------------------------------
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
    },

    // --------------------------------------------------------
    // Đơn xin nghỉ phép cá nhân (Staff / Manager / Owner)
    // --------------------------------------------------------
    createLeaveRequest: async (data) => {
        const response = await api.post("/api/v1/staff-leaves", data);
        return response.data;
    },

    getMyLeaveRequests: async () => {
        const response = await api.get("/api/v1/staff-leaves/my-requests");
        return response.data;
    },

    cancelLeaveRequest: async (id) => {
        const response = await api.delete(`/api/v1/staff-leaves/${id}/cancel`);
        return response.data;
    },

    getApprovalLeaveRequests: async (params) => {
        const response = await api.get("/api/v1/staff-leaves/approval-list", { params });
        return response.data;
    },

    getApprovedLeaves: async (params) => {
        const response = await api.get("/api/v1/staff-leaves/approved", { params });
        return response.data;
    },

    approveLeaveRequest: async (id) => {
        const response = await api.patch(`/api/v1/staff-leaves/${id}/approve`);
        return response.data;
    },

    rejectLeaveRequest: async (id, rejectionReason) => {
        const response = await api.patch(`/api/v1/staff-leaves/${id}/reject`, { rejectionReason });
        return response.data;
    }
};

export default offdayApi;