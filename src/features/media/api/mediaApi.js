import api from "@/core/api/axios";
import { API_BASE_URL } from "@/core/api/endpoints";

export const uploadMediaApi = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(
        `${API_BASE_URL}/api/v1/media/upload`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return res.data; // { id, url }
};