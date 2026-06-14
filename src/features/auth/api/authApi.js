import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const registerApi = async (data) => {

    const response = await api.post(
        ENDPOINTS.REGISTER,
        data
    );

    return response.data;
};

export const loginApi = async (data) => {

    const response = await api.post(
        ENDPOINTS.LOGIN,
        data
    );

    return response.data;
};