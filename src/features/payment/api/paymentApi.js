import api from "@/core/api/axios";

// Khởi tạo giao dịch thanh toán trực tuyến, trả về URL thanh toán VNPay
export const createPaymentUrlApi = async (payload) => {
    const response = await api.post("/api/v1/payments/create-url", payload);
    return response.data;
};

// Xác thực chữ ký thanh toán và lấy kết quả trả về từ VNPay
export const verifyPaymentApi = async (params) => {
    const response = await api.get("/api/v1/payments/vnpay-callback", { params });
    return response.data;
};
