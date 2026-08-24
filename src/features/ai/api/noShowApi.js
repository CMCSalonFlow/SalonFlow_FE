import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * Lấy kết quả dự đoán No-Show cho 1 booking cụ thể
 * @param {number} bookingId 
 */
export const predictNoShowApi = async (bookingId) => {
    const response = await api.get(ENDPOINTS.NO_SHOW_PREDICT(bookingId));
    return response.data;
};

/**
 * Lấy danh sách booking nguy cơ No-Show cao của chi nhánh
 * @param {number} branchId 
 * @param {Object} params { page, size }
 */
export const getHighRiskBookingsApi = async (branchId, params = {}) => {
    const response = await api.get(ENDPOINTS.NO_SHOW_HIGH_RISK, {
        params: { branchId, ...params }
    });
    return response.data;
};

/**
 * Lấy tất cả log dự đoán AI No-Show
 * @param {number} branchId 
 * @param {Object} params 
 */
export const getNoShowLogsApi = async (branchId, params = {}) => {
    const response = await api.get(ENDPOINTS.NO_SHOW_LOGS, {
        params: { ...(branchId ? { branchId } : {}), ...params }
    });
    return response.data;
};

/**
 * Tự động/thủ công gửi Email/SMS nhắc nhở khách
 * @param {number} bookingId 
 */
export const sendNoShowReminderApi = async (bookingId) => {
    const response = await api.post(ENDPOINTS.NO_SHOW_SEND_REMINDER(bookingId));
    return response.data;
};

/**
 * Lấy cấu hình tham số Logistic Regression
 */
export const getNoShowConfigApi = async () => {
    const response = await api.get(ENDPOINTS.NO_SHOW_CONFIG);
    return response.data;
};

/**
 * Cập nhật trọng số mô hình Logistic Regression
 * @param {Object} dto { beta0, beta1, beta2, beta3, beta4, riskThreshold, autoSendReminder, description }
 */
export const updateNoShowConfigApi = async (dto) => {
    const response = await api.put(ENDPOINTS.NO_SHOW_CONFIG, dto);
    return response.data;
};

/**
 * Lấy báo cáo đánh giá Accuracy hàng tuần
 */
export const getNoShowEvaluationsApi = async () => {
    const response = await api.get(ENDPOINTS.NO_SHOW_EVALUATIONS);
    return response.data;
};

/**
 * Kích hoạt chạy đánh giá Accuracy tức thì cho testing/demo
 * @param {string} startDate 
 * @param {string} endDate 
 */
export const triggerNoShowEvaluationApi = async (startDate, endDate) => {
    const response = await api.post(ENDPOINTS.NO_SHOW_EVALUATION_TRIGGER, null, {
        params: { ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) }
    });
    return response.data;
};
