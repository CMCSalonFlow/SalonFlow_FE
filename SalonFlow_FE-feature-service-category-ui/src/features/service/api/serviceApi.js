import api from "@/core/api/axios";

// ── Services ────────────────────────────────────────────────

export const getServicesBySalon = async (salonId) => {
    const response = await api.get(`/api/v1/salons/${salonId}/services`);
    return response.data;
};

export const getServiceById = async (salonId, serviceId) => {
    const response = await api.get(`/api/v1/salons/${salonId}/services/${serviceId}`);
    return response.data;
};

export const createService = async (salonId, data) => {
    const response = await api.post(`/api/v1/salons/${salonId}/services`, data);
    return response.data;
};

export const updateService = async (salonId, serviceId, data) => {
    const response = await api.put(`/api/v1/salons/${salonId}/services/${serviceId}`, data);
    return response.data;
};

export const deleteService = async (salonId, serviceId) => {
    const response = await api.delete(`/api/v1/salons/${salonId}/services/${serviceId}`);
    return response.data;
};

// ── Upload ảnh lên MinIO ─────────────────────────────────────

export const uploadServiceImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/v1/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // { id, url }
};

// ── Categories (dùng cho dropdown trong form) ────────────────

export const getCategories = async () => {
    const response = await api.get("/api/v1/categories");
    return response.data;
};
