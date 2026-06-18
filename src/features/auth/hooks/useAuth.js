import {
    loginApi,
    registerApi,
    sendOtpApi,
    verifyEmailApi,
    forgotPasswordApi,
    resetPasswordApi,
    logoutApi
} from "../api/authApi";

export const useAuth = () => {

    const saveAuthData = (
        response
    ) => {

        localStorage.setItem(
            "accessToken",
            response.accessToken
        );

        localStorage.setItem(
            "refreshToken",
            response.refreshToken
        );

        localStorage.setItem(
            "userId",
            response.userId
        );

        localStorage.setItem(
            "username",
            response.username
        );

        localStorage.setItem(
            "email",
            response.email
        );

        localStorage.setItem(
            "roles",
            JSON.stringify(
                response.roles
            )
        );
    };

    const login = async (
        email,
        password
    ) => {

        const response =
            await loginApi({
                email,
                password,
            });

        saveAuthData(response);

        return response;
    };

    const register =
        async (data) => {

            const response =
                await registerApi(data);

            return response;
        };

    const sendOtp = async (email) => {

        return await sendOtpApi(email);
    };

    const verifyEmail = async (
        email,
        otp
    ) => {

        return await verifyEmailApi(
            email,
            otp
        );
    };

    const forgotPassword =
        async (email) => {

            return await forgotPasswordApi(
                email
            );
        };

    const resetPassword =
        async (
            token,
            newPassword
        ) => {

            return await resetPasswordApi(
                token,
                newPassword
            );
        };

        const logout = async () => {

            const userId = localStorage.getItem("userId");

            try {
                if (userId) {
                    await logoutApi(userId);
                }
            } finally {
                localStorage.clear();
            }
        };

    return {
        login,
        logout,
        register,
        sendOtp,
        verifyEmail,
        forgotPassword,
        resetPassword
    };

    
};