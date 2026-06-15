import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const loginApi = async (data) => {

    const response = await api.post(
        ENDPOINTS.LOGIN,
        data
    );

    return response.data;
};

export const registerApi = async (data) => {

    const response = await api.post(
        ENDPOINTS.REGISTER,
        data
    );

    return response.data;
};

export const refreshTokenApi = async (
    refreshToken
) => {

    const response = await api.post(
        ENDPOINTS.REFRESH_TOKEN,
        {
            refreshToken,
        }
    );

    return response.data;
};

export const logoutApi = async (
    userId
) => {

    return api.post(
        `${ENDPOINTS.LOGOUT}/${userId}`
    );
};