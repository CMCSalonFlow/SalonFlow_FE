import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

export const getRolesApi =
    async () => {

        const res =
            await api.get(
                ENDPOINTS.ROLES
            );

        return res.data;
    };

export const createRoleApi =
    async (data) => {

        const res =
            await api.post(
                ENDPOINTS.ROLES,
                data
            );

        return res.data;
    };

export const updateRoleApi =
    async (
        id,
        data
    ) => {

        const res =
            await api.put(
                `${ENDPOINTS.ROLES}/${id}`,
                data
            );

        return res.data;
    };

export const deleteRoleApi =
    async (id) => {

        return api.delete(
            `${ENDPOINTS.ROLES}/${id}`
        );
    };