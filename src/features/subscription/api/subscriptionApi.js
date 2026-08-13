import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * Lấy thông tin gói đăng ký hiện tại (Active Subscription) của Salon
 */
export const getActiveSubscriptionApi = async () => {
    const res = await api.get(ENDPOINTS.SUBSCRIPTION_ME);
    return res.data;
};

/**
 * Xem lịch sử đăng ký của Salon
 */
export const getSubscriptionHistoryApi = async () => {
    const res = await api.get(ENDPOINTS.SUBSCRIPTION_HISTORY);
    return res.data;
};

/**
 * Tạo phiên thanh toán nâng cấp (Stripe Checkout)
 * @param {Object} payload 
 * @param {string} payload.plan Gói nâng cấp (PRO)
 * @param {string} payload.billingCycle Chu kỳ (MONTHLY hoặc YEARLY)
 * @param {string} payload.successUrl Redirect URL khi thành công
 * @param {string} payload.cancelUrl Redirect URL khi hủy bỏ
 */
export const createStripeCheckoutApi = async (payload) => {
    const res = await api.post(ENDPOINTS.SUBSCRIPTION_CHECKOUT, payload);
    return res.data;
};

/**
 * Tạo phiên quản lý hóa đơn/hủy gói (Stripe Customer Portal)
 * @param {string} returnUrl URL quay lại sau khi thoát Portal
 */
export const createCustomerPortalApi = async (returnUrl) => {
    const url = `${ENDPOINTS.SUBSCRIPTION_PORTAL}?returnUrl=${encodeURIComponent(returnUrl)}`;
    const res = await api.post(url);
    return res.data;
};

/**
 * Kích hoạt thủ công cho Enterprise (Dành cho Admin Dashboard)
 * @param {Object} payload
 * @param {number} payload.salonId ID của Salon cần nâng cấp
 * @param {string} payload.plan "ENTERPRISE"
 * @param {string} payload.billingCycle "MANUAL"
 * @param {number} payload.price Số tiền đã thu
 * @param {number} payload.durationDays Thời hạn kích hoạt (ngày)
 */
export const activateManualEnterpriseApi = async (payload) => {
    const res = await api.post(ENDPOINTS.SUBSCRIPTION_ADMIN_MANUAL, payload);
    return res.data;
};

/**
 * Lấy danh sách toàn bộ gói đăng ký (Phân trang & Lọc) - Dành cho Admin
 * @param {Object} params
 * @param {number} [params.salonId]
 * @param {string} [params.plan]
 * @param {string} [params.status]
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @param {string} [params.sort]
 */
export const getSubscriptionsAdminApi = async (params) => {
    const res = await api.get(ENDPOINTS.SUBSCRIPTION_ADMIN_LIST, { params });
    return res.data;
};

/**
 * Cập nhật thông tin gói đăng ký - Dành cho Admin
 * @param {number|string} id
 * @param {Object} payload
 */
export const updateSubscriptionAdminApi = async (id, payload) => {
    const res = await api.put(ENDPOINTS.SUBSCRIPTION_ADMIN_BY_ID(id), payload);
    return res.data;
};

/**
 * Hủy/Thu hồi gói đăng ký của Salon - Dành cho Admin
 * @param {number|string} id
 */
export const deleteSubscriptionAdminApi = async (id) => {
    const res = await api.delete(ENDPOINTS.SUBSCRIPTION_ADMIN_BY_ID(id));
    return res.data;
};
