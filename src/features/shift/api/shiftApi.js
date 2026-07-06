import api from "@/core/api/axios";

// ── Shift Templates ──────────────────────────────────────────

export const getTemplates = async (userId, branchId) => {
    const response = await api.get("/api/v1/shifts/templates", {
        params: { userId, branchId },
    });
    return response.data;
};

export const getTemplateById = async (templateId) => {
    const response = await api.get(`/api/v1/shifts/templates/${templateId}`);
    return response.data;
};

export const createTemplate = async (data) => {
    const response = await api.post("/api/v1/shifts/templates", data);
    return response.data;
};

export const updateTemplate = async (templateId, data) => {
    const response = await api.put(`/api/v1/shifts/templates/${templateId}`, data);
    return response.data;
};

export const deleteTemplate = async (templateId) => {
    const response = await api.delete(`/api/v1/shifts/templates/${templateId}`);
    return response.data;
};

// ── Áp dụng template vào tuần ───────────────────────────────

export const applyTemplate = async (templateId, weekStartDate, overwrite = false) => {
    const response = await api.post(
        `/api/v1/shifts/templates/${templateId}/apply`,
        { weekStartDate, overwrite }
    );
    return response.data;
};

// ── Query shifts ─────────────────────────────────────────────

export const getShiftsByUserAndWeek = async (userId, weekStartDate) => {
    const response = await api.get(`/api/v1/shifts/user/${userId}/week`, {
        params: { weekStartDate },
    });
    return response.data;
};

export const getAvailabilitySlots = async (branchId, date) => {
    const response = await api.get(
        `/api/v1/shifts/branch/${branchId}/availability`,
        { params: { date } }
    );
    return response.data;
};