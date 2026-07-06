import api from "@/core/api/axios";

/**
 * recurringBookingApi.js
 *
 * Mapping đúng với BE endpoints:
 *   POST /api/v1/recurring-bookings/preview
 *   POST /api/v1/recurring-bookings/confirm
 *   DELETE /api/v1/recurring-bookings/{id}
 *
 * branchId KHÔNG nằm trong URL mà nằm trong request body (field pattern.branchId)
 */

// Preview — không ghi DB
// payload khớp RecurringBookingRequest: { branchId, staffId, serviceId, pattern, startDate, endDate, startTime, endTime }
export const previewRecurringBookingApi = async (payload) => {
    const response = await api.post(`/api/v1/recurring-bookings/preview`, payload);
    return response.data;
};

// Confirm — ghi DB
// payload khớp RecurringBookingConfirmRequest: { pattern: RecurringBookingRequest, occurrences: OccurrenceDecision[] }
export const confirmRecurringBookingApi = async (payload) => {
    const response = await api.post(`/api/v1/recurring-bookings/confirm`, payload);
    return response.data;
};

// Huỷ toàn bộ chuỗi recurring booking (DELETE, không phải PUT)
export const cancelRecurringBookingApi = async (recurringBookingId) => {
    const response = await api.delete(`/api/v1/recurring-bookings/${recurringBookingId}`);
    return response.data;
};