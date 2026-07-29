import api from "@/core/api/axios";

// Tạo mới một đặt lịch hẹn (Booking)
export const createBookingApi = async (branchId, payload) => {
    const response = await api.post(`/api/v1/branches/${branchId}/bookings`, payload);
    return response.data;
};

// Tạo booking public không gắn Authorization header
export const createPublicBookingApi = async (branchId, payload) => {
    const response = await api.post(`/api/v1/branches/${branchId}/guest-bookings`, payload, {
        skipAuth: true
    });
    return response.data;
};

// Lấy danh sách lịch hẹn đặt chỗ của một chi nhánh
export const getBookingsByBranchApi = async (branchId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/bookings`);
    return response.data;
};

// Lấy thông tin chi tiết của một lịch hẹn đặt chỗ
export const getBookingByIdApi = async (branchId, bookingId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/bookings/${bookingId}`);
    return response.data;
};

// Lấy danh sách các khung giờ rảnh
export const getAvailabilityApi = async (branchId, params) => {
    const response = await api.get(
        `/api/v1/branches/${branchId}/bookings/availability`,
        { params }
    );

    return response.data;
};

// Lấy danh sách các khung giờ rảnh cho luồng public theo staff được chọn
export const getPublicAvailabilityApi = async (branchId, staffId, params) => {
    const response = await api.get(
        `/api/v1/branches/${branchId}/staff/${staffId}/availability`,
        { params, skipAuth: true }
    );

    return response.data;
};

// Hủy booking
export const cancelBookingApi = async (bookingId, reason = "") => {
    const response = await api.post(
        `/api/v1/bookings/${bookingId}/cancel`,
        reason || null
    );

    return response.data;
};

// Xác nhận lịch hẹn thủ công (Staff / Owner)
export const confirmBookingApi = async (bookingId) => {
    const response = await api.put(`/api/v1/bookings/${bookingId}/confirm`);
    return response.data;
};

// Chính sách hủy
export const getCancellationPolicyApi = async (salonId) => {
    const response = await api.get(
        `/api/v1/salons/${salonId}/cancellation-policy`
    );

    return response.data;
};

export const updateCancellationPolicyApi = async (salonId, payload) => {
    const response = await api.put(
        `/api/v1/salons/${salonId}/cancellation-policy`,
        payload
    );

    return response.data;
};

export const createWalkInBookingApi = async (branchId, payload) => {
    const response = await api.post(
        `/api/v1/branches/${branchId}/walk-in-bookings`,
        payload
    );

    return response.data;
};

// Recurring Bookings
export const previewRecurringBookingApi = async (payload) => {
    const response = await api.post("/api/v1/recurring-bookings/preview", payload);
    return response.data;
};

export const confirmRecurringBookingApi = async (payload) => {
    const response = await api.post("/api/v1/recurring-bookings/confirm", payload);
    return response.data;
};

export const cancelRecurringBookingApi = async (id) => {
    const response = await api.delete(`/api/v1/recurring-bookings/${id}`);
    return response.data;
};
