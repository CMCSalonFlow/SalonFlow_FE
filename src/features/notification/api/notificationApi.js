import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getMyNotificationsApi = async () => {
    const response = await api.get(ENDPOINTS.NOTIFICATIONS);
    return response.data;
};

export const getUnreadNotificationCountApi = async () => {
    const response = await api.get(ENDPOINTS.NOTIFICATION_UNREAD_COUNT);
    return response.data;
};

export const markNotificationAsReadApi = async (notificationId) => {
    const response = await api.patch(ENDPOINTS.NOTIFICATION_MARK_READ(notificationId));
    return response.data;
};

export const markAllNotificationsAsReadApi = async () => {
    const response = await api.post(ENDPOINTS.NOTIFICATION_READ_ALL);
    return response.data;
};

export const getMyFcmTokensApi = async () => {
    const response = await api.get(ENDPOINTS.FCM_TOKENS);
    return response.data;
};

export const registerFcmTokenApi = async (payload) => {
    const response = await api.post(ENDPOINTS.FCM_TOKENS, payload);
    return response.data;
};

export const revokeFcmTokenApi = async (token) => {
    await api.delete(ENDPOINTS.FCM_TOKENS, {
        params: { token }
    });
};
