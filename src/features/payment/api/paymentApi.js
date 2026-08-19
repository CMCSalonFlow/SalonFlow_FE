import api from "@/core/api/axios";

// Khởi tạo giao dịch thanh toán trực tuyến, trả về URL thanh toán VNPay
export const createPaymentUrlApi = async (payload, config = {}) => {
    const response = await api.post("/api/v1/payments/create-url", payload, config);
    return response.data;
};

// Xác thực chữ ký thanh toán và lấy kết quả trả về từ VNPay
export const verifyPaymentApi = async (params, config = {}) => {
    const response = await api.get("/api/v1/payments/vnpay-callback", { params, ...config });
    return response.data;
};

// Xử lý thanh toán tiền mặt tại quầy (POS Mode) do Staff xác nhận - không qua cổng trực tuyến
export const processPosCashPaymentApi = async (payload, config = {}) => {
    const response = await api.post("/api/v1/payments/pos/cash", payload, config);
    return response.data;
};

// Lấy trạng thái thanh toán mới nhất của đơn hàng
export const getPaymentStatusApi = async (bookingId, config = {}) => {
    const response = await api.get(`/api/v1/payments/status/${bookingId}`, config);
    return response.data;
};

// Tự động xác nhận thanh toán chuyển khoản VietQR
export const autoConfirmBankTransferApi = async (bookingId, config = {}) => {
    const response = await api.post(`/api/v1/payments/auto-confirm/${bookingId}`, {}, config);
    return response.data;
};
