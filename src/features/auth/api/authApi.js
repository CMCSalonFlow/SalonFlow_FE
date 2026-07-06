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

export const sendOtpApi = async (email) => {

    const response = await api.post(
        ENDPOINTS.SEND_OTP,
        {
            email,
        }
    );

    return response.data;
};

export const verifyEmailApi = async (
    email,
    otp
) => {

    const response = await api.post(
        ENDPOINTS.VERIFY_EMAIL,
        {
            email,
            otp,
        }
    );

    return response.data;
};

export const forgotPasswordApi =
    async (email) => {

        const response = await api.post(
            ENDPOINTS.FORGOT_PASSWORD,
            {
                email,
            }
        );

        return response.data;
    };

export const resetPasswordApi =
    async (
        token,
        newPassword
    ) => {

        const response = await api.post(
            ENDPOINTS.RESET_PASSWORD,
            {
                token,
                newPassword,
            }
        );

        return response.data;
    };