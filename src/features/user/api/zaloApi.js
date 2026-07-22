import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getZaloConnectUrlApi = async () => {
    const res = await api.get(ENDPOINTS.ZALO_CONNECT_URL);
    return res.data;
};

export const connectZaloAccountApi = async (zaloUserId) => {
    const res = await api.post(ENDPOINTS.ZALO_CONNECT, { zaloUserId });
    return res.data;
};

export const sendTestZnsApi = async ({ phone, templateId, customerName }) => {
    const res = await api.post(ENDPOINTS.ZALO_TEST_ZNS, { phone, templateId, customerName });
    return res.data;
};
