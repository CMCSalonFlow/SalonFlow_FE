import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getMyBranchesApi = async () => {
    const response = await api.get(
        ENDPOINTS.MY_BRANCHES
    );
    return response.data;
};

export const getBranchesApi = async () => {
    const response = await api.get(
        ENDPOINTS.BRANCHES
    );
    return response.data;
};

export const getBranchApi = async (id) => {
    const response = await api.get(
        `${ENDPOINTS.BRANCHES}/${id}`
    );
    return response.data;
};

export const createBranchApi = async (data) => {
    const response = await api.post(
        ENDPOINTS.BRANCHES,
        data
    );
    return response.data;
};

export const updateBranchApi = async (
    id,
    data
) => {
    const response = await api.put(
        `${ENDPOINTS.BRANCHES}/${id}`,
        data
    );
    return response.data;
};

export const deleteBranchApi = async (id) => {
    return api.delete(
        `${ENDPOINTS.BRANCHES}/${id}`
    );
};

export const getBranchUsersApi = async (
    branchId
) => {
    const response = await api.get(
        `${ENDPOINTS.BRANCHES}/${branchId}/users`
    );

    return response.data;
};

export const assignUserApi = async (
    branchId,
    userId
) => {
    return api.post(
        `${ENDPOINTS.BRANCHES}/${branchId}/users/${userId}`
    );
};

export const removeUserApi = async (
    branchId,
    userId
) => {
    return api.delete(
        `${ENDPOINTS.BRANCHES}/${branchId}/users/${userId}`
    );
};
export const getUsersApi = async () => {
    const response = await api.get(
        ENDPOINTS.USERS
    );

    return response.data;
};