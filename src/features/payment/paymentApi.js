import api from "@/core/api/axios";

/**
 * Xác nhận thanh toán tiền mặt tại quầy (POS mode).
 * Staff gọi sau khi đã nhận tiền từ khách.
 *
 * @param {number} branchId
 * @param {{ bookingId: number, staffId: number, note?: string }} payload
 */
export const confirmCashPaymentApi = async (branchId, payload) => {
    const response = await api.post(
        `/api/v1/branches/${branchId}/payments/cash`,
        payload
    );
    return response.data;
};

/**
 * Lấy thông tin payment theo bookingId (dùng để in lại hóa đơn).
 *
 * @param {number} branchId
 * @param {number} bookingId
 */
export const getPaymentByBookingIdApi = async (branchId, bookingId) => {
    const response = await api.get(
        `/api/v1/branches/${branchId}/payments/booking/${bookingId}`
    );
    return response.data;
};
