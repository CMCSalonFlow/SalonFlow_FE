import api from "@/core/api/axios";

/**
 * Gọi API sinh URL thanh toán trực tuyến.
 *
 * @param {Object} payload { bookingId, paymentMethod, idempotencyKey, returnUrl }
 */
export const createPaymentUrlApi = async (payload) => {
    const response = await api.post("/api/v1/payments/create-url", payload);
    return response.data;
};

/**
 * Lấy trạng thái thanh toán mới nhất của một lịch hẹn.
 *
 * @param {number|string} bookingId
 */
export const getPaymentStatusApi = async (bookingId) => {
    const response = await api.get(`/api/v1/payments/status/${bookingId}`);
    return response.data;
};
