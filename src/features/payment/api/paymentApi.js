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
