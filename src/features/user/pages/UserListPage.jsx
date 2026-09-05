import {
    useEffect,
    useState
} from "react";

import {
    Button,
    Space,
    message,
    Typography,
    Grid,
    Card
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

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

    const screens = Grid.useBreakpoint();

    return (
        <div style={{ padding: screens.xs ? "8px 4px" : "16px 20px" }}>
            <div style={{
                display: "flex",
                flexDirection: screens.xs ? "column" : "row",
                justifyContent: "space-between",
                alignItems: screens.xs ? "stretch" : "center",
                gap: 12,
                marginBottom: 20
            }}>
                <div>
                    <Title level={screens.xs ? 4 : 3} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                        Quản Lý Người Dùng
                    </Title>
                    <Text type="secondary" style={{ fontSize: screens.xs ? 12 : 14 }}>
                        Quản trị tài khoản, thông tin liên hệ và phân quyền người dùng trong hệ thống.
                    </Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    size={screens.xs ? "middle" : "large"}
                    style={{ borderRadius: 8 }}
                >
                    Thêm người dùng mới
                </Button>
            </div>

            <Card bordered={false} style={{ borderRadius: screens.xs ? 10 : 16, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }} bodyStyle={{ padding: screens.xs ? 8 : 16 }}>
                <UserTable
                    users={users}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>

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