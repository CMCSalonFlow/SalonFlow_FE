import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getServiceDescriptionQuotaApi = async (salonId) => {
    const response = await api.get(ENDPOINTS.SERVICE_DESCRIPTION_QUOTA(salonId));
    return response.data;
};

export const generateServiceDescriptionApi = async (salonId, payload) => {
    const response = await api.post(ENDPOINTS.SERVICE_DESCRIPTION_GENERATE(salonId), payload);
    return response.data;
};
