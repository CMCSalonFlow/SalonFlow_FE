import { useEffect, useState } from "react";
import {
    getBranchUsers,
    assignUser,
    removeUser
} from "../api/branchApi";

export default function useBranchUsers(branchId) {

    const [users, setUsers] = useState([]);

    const load = async () => {
        if (!branchId) return;

        const data = await getBranchUsers(branchId);
        setUsers(data);
    };

    useEffect(() => {
        load();
    }, [branchId]);

    const addUser = async (userId) => {
        await assignUser(branchId, userId);
        load();
    };

    const deleteUser = async (userId) => {
        await removeUser(branchId, userId);
        load();
    };

    return {
        users,
        reload: load,
        addUser,
        deleteUser
    };
}