import {
    getUsersApi,
    createUserApi,
    updateUserApi,
    deleteUserApi
}
from "../api/userApi";
import { getRolesApi } from "../api/roleApi";

export const useUsers = () => {

    const getUsers =
        () => getUsersApi();

    const createUser =
        (data) =>
            createUserApi(data);

    const updateUser =
        (id, data) =>
            updateUserApi(id, data);

    const deleteUser =
        (id) =>
            deleteUserApi(id);

    return {
        getUsers,
        createUser,
        updateUser,
        deleteUser
    };
};

export const useRoles = () => {

    const getRoles = () => getRolesApi();

    return {
        getRoles
    };
};