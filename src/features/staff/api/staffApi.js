import api from "@/core/api/axios";

// Lấy danh sách nhân viên của một chi nhánh
export const getStaffByBranchApi = async (branchId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/staff`);
    return response.data;
};

// Lấy chi tiết thông tin một nhân viên
export const getStaffByIdApi = async (branchId, staffId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/staff/${staffId}`);
    return response.data;
};

// Thêm nhân viên mới vào chi nhánh
export const createStaffApi = async (branchId, payload) => {
    const response = await api.post(`/api/v1/branches/${branchId}/staff`, payload);
    return response.data;
};

// Cập nhật thông tin nhân viên
export const updateStaffApi = async (branchId, staffId, payload) => {
    const response = await api.put(`/api/v1/branches/${branchId}/staff/${staffId}`, payload);
    return response.data;
};

// Xóa nhân viên khỏi chi nhánh
export const deleteStaffApi = async (branchId, staffId) => {
    const response = await api.delete(`/api/v1/branches/${branchId}/staff/${staffId}`);
    return response.data;
};
