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
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // LOAD USERS
    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsersApi();
            setUsers(data || []);
        } catch {
            message.error("Tải danh sách người dùng thất bại");
        } finally {
            setLoading(false);
        }
    };

    // LOAD ROLES
    const loadRoles = async () => {
        try {
            const data = await getRolesApi();
            setRoles(data || []);
        } catch {
            message.error("Tải danh sách vai trò thất bại");
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
                message.success("Cập nhật thông tin người dùng thành công!");
            } else {
                await createUserApi(values);
                message.success("Thêm mới người dùng thành công!");
            }

            setOpen(false);
            setEditingUser(null);
            loadUsers();
        } catch (err) {
            const errMsg = err?.response?.data?.message || err?.message || "Lưu thông tin người dùng thất bại";
            message.error(errMsg);
        }
    };

    // DELETE
    const handleDelete = async (id) => {
        try {
            await deleteUserApi(id);
            message.success("Đã xóa người dùng thành công!");
            loadUsers();
        } catch (err) {
            const errMsg = err?.response?.data?.message || err?.message || "Xóa người dùng thất bại";
            message.error(errMsg);
        }
    };

    return (
        <div>
            <Space style={{ marginBottom: 20 }}>
                <Button
                    type="primary"
                    onClick={handleCreate}
                >
                    + Thêm người dùng mới
                </Button>
            </Space>

            <UserTable
                users={users}
                loading={loading}
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