import { getMyBranchesApi }
from "../api/branchApi";

export const useBranch = () => {

    const getMyBranches =
        async () => {

            return await getMyBranchesApi();
        };

    const switchBranch =
        (branchId) => {

            localStorage.setItem(
                "currentBranchId",
                branchId
            );

            window.location.reload();
        };

    return {
        getMyBranches,
        switchBranch
    };
};