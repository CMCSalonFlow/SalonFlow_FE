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



/**
 * Chuẩn hóa URL hóa đơn, chuyển đổi internal docker host (http://minio:9000) thành public URL
 */
export const normalizeInvoiceUrl = (urlOrPath) => {
    if (!urlOrPath) return "";
    let url = String(urlOrPath).trim();

    // MinIO public base URL
    const publicMinioBase = import.meta.env.VITE_MINIO_URL || "https://salonflow.site/salon-images";

    // 1. Trường hợp trả về internal URL từ Docker backend (http://minio:9000/salon-images/...)
    if (url.includes("minio:9000")) {
        // Bỏ query string (chữ ký AWS HMAC không hợp lệ khi đổi host)
        const withoutQuery = url.split("?")[0];
        const match = withoutQuery.match(/\/salon-images\/(.+)$/);
        const objectPath = match ? match[1] : withoutQuery.replace(/^https?:\/\/minio:9000\/?(salon-images\/)?/, "");
        return `${publicMinioBase}/${objectPath}`;
    }

    // 2. Nếu đã là full URL hợp lệ (https:// hoặc http://) và không phải minio
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    // 3. Nếu là objectName / relative path (ví dụ: "invoice/2026/9/58-...pdf")
    let cleanPath = url.replace(/^\/?(salon-images\/)?/, "");
    cleanPath = cleanPath.split("?")[0];
    return `${publicMinioBase}/${cleanPath}`;
};

export const getInvoiceUrl = async (objectName) => {
    if (!objectName) return "";

    try {
        const res = await api.get(
            `${API_BASE_URL}${ENDPOINTS.MEDIA_INVOICE}`,
            {
                params: {
                    objectName
                }
            }
        );
        return normalizeInvoiceUrl(res.data);
    } catch (err) {
        console.error("Lỗi lấy invoice URL từ server:", err);
        // Fallback tự sinh public URL phía client
        return normalizeInvoiceUrl(objectName);
    }
};