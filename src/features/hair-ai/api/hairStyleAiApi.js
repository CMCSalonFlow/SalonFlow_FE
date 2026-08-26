import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const analyzeHairStyleApi = async (payload) => {
    const response = await api.post(ENDPOINTS.HAIR_STYLE_ANALYZE, payload);
    return response.data;
};

export const confirmHairStyleApi = async (payload) => {
    const response = await api.post(ENDPOINTS.HAIR_STYLE_CONFIRM, payload);
    return response.data;
};

export const getHairStyleProfileApi = async () => {
    const response = await api.get(ENDPOINTS.HAIR_STYLE_PROFILE);
    return response.data;
};
