import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";
export const getUsersApi = async () => {
    const res = await api.get(
        ENDPOINTS.USERS
    );

    return res.data;
};

export const getUserByIdApi =
    async (id) => {

        const res =
            await api.get(
                `${ENDPOINTS.USERS}/${id}`
            );

        return res.data;
    };

export const createUserApi =
    async (data) => {

        const res =
            await api.post(
                ENDPOINTS.USERS,
                data
            );

        return res.data;
    };

export const updateUserApi =
    async (id, data) => {

        const res =
            await api.put(
                `${ENDPOINTS.USERS}/${id}`,
                data
            );

        return res.data;
    };

export const deleteUserApi =
    async (id) => {

        return api.delete(
            `${ENDPOINTS.USERS}/${id}`
        );
    };

export const assignRolesApi =
    async (
        userId,
        roleIds
    ) => {

        return api.post(
            `${ENDPOINTS.USERS}/${userId}/roles`,
            roleIds
        );
    };

export const removeRoleApi =
    async (
        userId,
        roleId
    ) => {

        return api.delete(
            `${ENDPOINTS.USERS}/${userId}/roles/${roleId}`
        );
    };