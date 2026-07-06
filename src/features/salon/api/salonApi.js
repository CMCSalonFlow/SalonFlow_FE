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
