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

// Phân trang & tìm kiếm lịch hẹn đặt chỗ của chi nhánh
export const searchBookingsByBranchApi = async (branchId, params) => {
    const response = await api.get(`/api/v1/branches/${branchId}/bookings/search`, { params });
    return response.data;
};

// Lấy toàn bộ lịch hẹn cá nhân của khách hàng đang đăng nhập
export const getMyBookingsApi = async () => {
    const response = await api.get("/api/v1/bookings/my-bookings");
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
        { 
            params: { ...params, _t: Date.now() },
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
        }
    );

    return response.data;
};

// Lấy danh sách các khung giờ rảnh cho luồng public theo staff được chọn
export const getPublicAvailabilityApi = async (branchId, staffId, params) => {
    const response = await api.get(
        `/api/v1/branches/${branchId}/staff/${staffId}/availability`,
        { 
            params: { ...params, _t: Date.now() }, 
            skipAuth: true,
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
        }
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

// Đánh dấu khách đã đến
export const checkInBookingApi = async (bookingId) => {
    const response = await api.put(`/api/v1/bookings/${bookingId}/check-in`);
    return response.data;
};

// Check-in bằng QR từ email booking
export const checkInBookingByQrApi = async (bookingId, signature) => {
    const response = await api.post(
        `/api/v1/bookings/${bookingId}/checkin`,
        { signature }
    );

    return response.data;
};

// Hoàn tất dịch vụ và chuyển booking sang COMPLETED
export const completeBookingApi = async (bookingId) => {
    const response = await api.put(`/api/v1/bookings/${bookingId}/complete`);
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

// Giữ chỗ slot thời gian thực (lock 5 phút)
export const lockSlotApi = async (payload) => {
    const response = await api.post("/api/v1/bookings/lock", payload);
    return response.data;
};

// Hủy giữ chỗ slot (hỗ trợ cả 2 dạng: unlockSlotApi(slotKey, clientId) hoặc unlockSlotApi({ slotKey, clientId }))
export const unlockSlotApi = async (arg1, arg2) => {
    let slotKey = arg1;
    let clientId = arg2;
    if (typeof arg1 === "object" && arg1 !== null) {
        slotKey = arg1.slotKey;
        clientId = arg1.clientId;
    }
    if (!slotKey) return null;

    const params = { slotKey };
    if (clientId) {
        params.clientId = clientId;
    }
    const response = await api.delete("/api/v1/bookings/lock", { params });
    return response.data;
};

// Hủy giữ chỗ slot qua fetch keepalive để gửi thành công 100% khi reload/đóng tab
export const unlockSlotKeepAlive = (arg1, arg2) => {
    let slotKey = arg1;
    let clientId = arg2;
    if (typeof arg1 === "object" && arg1 !== null) {
        slotKey = arg1.slotKey;
        clientId = arg1.clientId;
    }
    if (!slotKey) return;

    try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        let url = `/api/v1/bookings/lock?slotKey=${encodeURIComponent(slotKey)}`;
        if (clientId) {
            url += `&clientId=${encodeURIComponent(clientId)}`;
        }
        fetch(url, {
            method: "DELETE",
            headers,
            keepalive: true
        }).catch(() => {});
    } catch (e) {
        console.warn("unlockSlotKeepAlive error:", e);
    }
};

// Kiểm tra trạng thái lock của slot
export const checkSlotLockApi = async (slotKey) => {
    const response = await api.get("/api/v1/bookings/lock", {
        params: { slotKey, _t: Date.now() },
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
    });
    return response.data;
};

