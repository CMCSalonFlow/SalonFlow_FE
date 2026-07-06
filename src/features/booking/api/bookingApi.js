import api from "@/core/api/axios";

// Tạo mới một đặt lịch hẹn (Booking)
export const createBookingApi = async (branchId, payload) => {
    const response = await api.post(`/api/v1/branches/${branchId}/bookings`, payload);
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

// Lấy danh sách các khung giờ rảnh khả dụng thời gian thực
// Query params bao gồm: date (YYYY-MM-DD), serviceIds (mảng hoặc chuỗi phân tách bởi dấu phẩy), bundleId, staffId (nếu có)
export const getAvailabilityApi = async (branchId, params) => {
    const response = await api.get(`/api/v1/branches/${branchId}/bookings/availability`, {
        params
    });
    return response.data;
};
