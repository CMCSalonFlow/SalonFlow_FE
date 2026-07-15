import api from "@/core/api/axios";

// ── Standard Services (Branch-scoped) ────────────────────────
export const getServicesByBranchApi = async (branchId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/services`);
    return response.data;
};

export const getPublicServicesByBranchApi = async (branchId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/services/public`, {
        skipAuth: true
    });
    return response.data;
};

export const createServiceApi = async (branchId, payload) => {
    const response = await api.post(`/api/v1/branches/${branchId}/services`, payload);
    return response.data;
};

export const updateServiceApi = async (branchId, serviceId, payload) => {
    const response = await api.put(`/api/v1/branches/${branchId}/services/${serviceId}`, payload);
    return response.data;
};

export const deleteServiceApi = async (branchId, serviceId) => {
    const response = await api.delete(`/api/v1/branches/${branchId}/services/${serviceId}`);
    return response.data;
};

// ── Service Bundles (Branch-scoped) ──────────────────────────
export const getBundlesByBranchApi = async (branchId, activeOnly = false) => {
    const response = await api.get(`/api/v1/branches/${branchId}/bundles`, {
        params: { activeOnly }
    });
    return response.data;
};

export const getPublicBundlesByBranchApi = async (branchId) => {
    const response = await api.get(`/api/v1/branches/${branchId}/bundles/public`, {
        skipAuth: true
    });
    return response.data;
};

export const createBundleApi = async (branchId, payload) => {
    const response = await api.post(`/api/v1/branches/${branchId}/bundles`, payload);
    return response.data;
};

export const updateBundleApi = async (branchId, bundleId, payload) => {
    const response = await api.put(`/api/v1/branches/${branchId}/bundles/${bundleId}`, payload);
    return response.data;
};

export const deleteBundleApi = async (branchId, bundleId) => {
    const response = await api.delete(`/api/v1/branches/${branchId}/bundles/${bundleId}`);
    return response.data;
};

export const getCategoriesApi = async () => {
    const response = await api.get("/api/v1/categories");
    return response.data;
};
