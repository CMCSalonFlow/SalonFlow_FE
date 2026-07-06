import {
    getMyBranchesApi,
    getBranchesApi,
    getBranchApi,
    createBranchApi,
    updateBranchApi,
    deleteBranchApi,
    getBranchUsersApi,
    assignUserApi,
    removeUserApi
} from "../api/branchApi";

export const useBranch = () => {

    const getMyBranches = async () => {
        return await getMyBranchesApi();
    };

    const switchBranch = (branchId) => {

        localStorage.setItem(
            "currentBranchId",
            branchId
        );

        window.location.reload();
    };

    const getBranches = async () => {
        return await getBranchesApi();
    };

    const getBranch = async (id) => {
        return await getBranchApi(id);
    };

    const createBranch = async (data) => {
        return await createBranchApi(data);
    };

    const updateBranch = async (
        id,
        data
    ) => {
        return await updateBranchApi(
            id,
            data
        );
    };

    const deleteBranch = async (id) => {
        return await deleteBranchApi(id);
    };

    const getBranchUsers = async (
        branchId
    ) => {
        return await getBranchUsersApi(
            branchId
        );
    };

    const assignUser = async (
        branchId,
        userId
    ) => {
        return await assignUserApi(
            branchId,
            userId
        );
    };

    const removeUser = async (
        branchId,
        userId
    ) => {
        return await removeUserApi(
            branchId,
            userId
        );
    };

    return {
        getMyBranches,
        switchBranch,

        getBranches,
        getBranch,
        createBranch,
        updateBranch,
        deleteBranch,

        getBranchUsers,
        assignUser,
        removeUser
    };
};