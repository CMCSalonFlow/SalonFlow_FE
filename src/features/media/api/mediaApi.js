import api from "@/core/api/axios";
import { API_BASE_URL, ENDPOINTS } from "@/core/api/endpoints";


export const uploadMediaApi = async (file) => {

    const formData = new FormData();

    formData.append("file", file);


    const res = await api.post(
        `${API_BASE_URL}${ENDPOINTS.MEDIA_UPLOAD}`,
        formData,
        {
            headers:{
                "Content-Type":"multipart/form-data"
            }
        }
    );


    return res.data;
};



export const getInvoiceUrl = async (objectName) => {

    const res = await api.get(
        `${API_BASE_URL}${ENDPOINTS.MEDIA_INVOICE}`,
        {
            params:{
                objectName
            }
        }
    );


    return res.data;
};