import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getMyBranchesApi = async () => {

    const response = await api.get(
        ENDPOINTS.MY_BRANCHES
    );

    return response.data;
};