import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

/**
 * Lấy danh sách các chi nhánh / salon gần nhất dựa theo tọa độ GPS và bán kính (mét).
 * @param {Object} params
 * @param {number} params.lat Vĩ độ người dùng
 * @param {number} params.lng Kinh độ người dùng
 * @param {number} [params.radius=5000] Bán kính tìm kiếm (mét, mặc định 5000m)
 * @param {number} [params.limit=50] Số lượng tối đa
 * @returns {Promise<Array>} Danh sách salon & chi nhánh kèm khoảng cách
 */
export const getNearbySalonsApi = async ({ lat, lng, radius = 5000, limit = 50 }) => {
    const response = await api.get(ENDPOINTS.SALONS_NEARBY, {
        params: {
            lat,
            lng,
            radius,
            limit
        }
    });
    return response.data;
};
