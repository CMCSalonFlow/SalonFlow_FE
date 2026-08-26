import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const searchBranchesApi = async (params) => {

    const response = await api.get(
        ENDPOINTS.SEARCH_BRANCHES,
        {
            params
        }
    );

    return response.data;

};