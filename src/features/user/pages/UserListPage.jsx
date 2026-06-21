import {
    useEffect,
    useState
} from "react";

import {
    Button,
    Space,
    message
} from "antd";

import UserTable from "../components/UserTable";
import UserModal from "../components/UserModal";

import {
    getUsersApi,
    createUserApi,
    updateUserApi,
    deleteUserApi
} from "../api/userApi";
import { getRolesApi } from "@/features/role/api/roleApi";

export default function UserListPage() {

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // LOAD USERS
    const loadUsers = async () => {
        try {
            const data = await getUsersApi();
            setUsers(data);
        } catch {
            message.error("Load users failed");
        }
    };

    // LOAD ROLES
    const loadRoles = async () => {
        try {
            const data = await getRolesApi();
            setRoles(data);
        } catch {
            message.error("Load roles failed");
        }
    };

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    // CREATE
    const handleCreate = () => {
        setEditingUser(null);
        setOpen(true);
    };

    // EDIT (🔥 IMPORTANT PART)
    const handleEdit = (user) => {
        setEditingUser({
            ...user,

            // 🔥 convert backend roles ["ADMIN"] -> frontend roleIds
            roles: user.roles || []
        });

        setOpen(true);
    };

    // SUBMIT
    const handleSubmit = async (values) => {
        try {

            if (editingUser) {
                await updateUserApi(editingUser.id, values);
            } else {
                await createUserApi(values);
            }

            message.success("Success");

            setOpen(false);
            setEditingUser(null);

            loadUsers();

        } catch {
            message.error("Save failed");
        }
    };

    // DELETE
    const handleDelete = async (id) => {
        try {
            await deleteUserApi(id);
            message.success("Deleted");
            loadUsers();
        } catch {
            message.error("Delete failed");
        }
    };

    return (
        <div>

            <Space style={{ marginBottom: 20 }}>
                <Button
                    type="primary"
                    onClick={handleCreate}
                >
                    Create User
                </Button>
            </Space>

            <UserTable
                users={users}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <UserModal
                open={open}
                initialValues={editingUser}
                roles={roles}
                onCancel={() => setOpen(false)}
                onSubmit={handleSubmit}
            />

        </div>
    );
}