import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * Đề xuất Top 3 slot tối ưu bằng AI
 * @param {Object} payload { branchId, date, serviceIds, bundleId, preferredStaffId, userLat, userLng }
 */
export const recommendSmartSlotsApi = async (payload) => {
    const response = await api.post(ENDPOINTS.SMART_SCHEDULING_RECOMMEND, payload);
    return response.data;
};

/**
 * Lấy cấu hình trọng số AI hiện tại của chi nhánh
 * @param {number} branchId 
 */
export const getSmartSchedulingConfigApi = async (branchId) => {
    const response = await api.get(ENDPOINTS.SMART_SCHEDULING_CONFIG, {
        params: branchId ? { branchId } : {}
    });
    return response.data;
};

/**
 * Cập nhật cấu hình trọng số AI (Admin/Owner)
 * @param {number} branchId 
 * @param {Object} dto { workloadWeight, travelWeight, serviceFitWeight }
 */
export const updateSmartSchedulingConfigApi = async (branchId, dto) => {
    const response = await api.put(ENDPOINTS.SMART_SCHEDULING_CONFIG, dto, {
        params: branchId ? { branchId } : {}
    });
    return response.data;
};

/**
 * Xem lịch sử log gợi ý AI
 * @param {number} branchId 
 * @param {Object} params { page, size }
 */
export const getSmartSchedulingLogsApi = async (branchId, params = {}) => {
    const response = await api.get(ENDPOINTS.SMART_SCHEDULING_LOGS, {
        params: {
            ...(branchId ? { branchId } : {}),
            ...params
        }
    });
    return response.data;
};
