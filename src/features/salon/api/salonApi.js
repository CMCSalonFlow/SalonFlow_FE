import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getMySalonApi = async () => {
    const res = await api.get(ENDPOINTS.MY_SALON);
    return res.data;
};

export const createSalonApi = async (data) => {
    const res = await api.post(ENDPOINTS.SALONS, data);
    return res.data;
};

export const updateSalonApi = async (data) => {
    const res = await api.put(ENDPOINTS.MY_SALON, data);
    return res.data;
};

export const deleteSalonApi = async () => {
    return api.delete(ENDPOINTS.MY_SALON);
};

export const getAllSalonsApi = async () => {
    const res = await api.get(ENDPOINTS.SALONS);
    return res.data;
};

export const getSalonByIdApi = async (id) => {
    const res = await api.get(`${ENDPOINTS.SALONS}/${id}`);
    return res.data;
};

export const getPublicSalonsApi = async () => {
    const res = await api.get(`${ENDPOINTS.SALONS}/public`, {
        skipAuth: true
    });
    return res.data;
};

export const getSalonsByStatusApi = async (status) => {
    const res = await api.get(`${ENDPOINTS.SALONS}/admin/by-status?status=${status}`);
    return res.data;
};

export const approveSalonApi = async (id) => {
    const res = await api.post(`${ENDPOINTS.SALONS}/admin/${id}/approve`);
    return res.data;
};

export const rejectSalonApi = async (id, reason) => {
    const res = await api.post(`${ENDPOINTS.SALONS}/admin/${id}/reject`, { reason });
    return res.data;
};

export const getSalonAuditsApi = async (id) => {
    const res = await api.get(`${ENDPOINTS.SALONS}/admin/audits/${id}`);
    return res.data;
};

export const appealSalonApi = async () => {
    const res = await api.post(`${ENDPOINTS.SALONS}/me/appeal`);
    return res.data;
};
