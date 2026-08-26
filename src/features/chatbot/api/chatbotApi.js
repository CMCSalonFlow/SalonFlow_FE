import api from "@/core/api/axios";

export const sendChatbotMessageApi = async (payload) => {
    const response = await api.post("/api/v1/chatbot/message", payload);
    return response.data;
};
