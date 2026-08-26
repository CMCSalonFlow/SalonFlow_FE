import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * Đăng đánh giá mới cho đơn đặt lịch đã hoàn thành
 * @param {number|string} bookingId 
 * @param {object} payload - { rating, comment, photos: [] }
 */
export const createBookingReviewApi = async (bookingId, payload) => {
    const response = await api.post(ENDPOINTS.BOOKING_REVIEWS(bookingId), payload);
    return response.data;
};

/**
 * Lấy chi tiết đánh giá của 1 booking
 * @param {number|string} bookingId 
 */
export const getBookingReviewApi = async (bookingId) => {
    const response = await api.get(ENDPOINTS.BOOKING_REVIEWS(bookingId));
    return response.data;
};

/**
 * Lấy danh sách đánh giá của Salon (có hỗ trợ phân trang)
 * @param {number|string} salonId 
 * @param {object} params - { page, size, sort }
 */
export const getSalonReviewsApi = async (salonId, params = {}) => {
    const response = await api.get(ENDPOINTS.SALON_REVIEWS(salonId), { params });
    return response.data;
};

/**
 * Lấy thống kê tổng quan điểm đánh giá của Salon
 * @param {number|string} salonId 
 */
export const getSalonReviewSummaryApi = async (salonId) => {
    const response = await api.get(ENDPOINTS.SALON_REVIEW_SUMMARY(salonId));
    return response.data;
};
