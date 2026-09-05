import {
    useEffect,
    useState
} from "react";
import {
    Button,
    message,
    Typography,
    Card,
    Grid
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import RoleTable from "../components/RoleTable";
import RoleModal from "../components/RoleModal";
import {
    getRolesApi,
    createRoleApi,
    updateRoleApi,
    deleteRoleApi
} from "../api/roleApi";

const { Title, Text } = Typography;

export default function RoleListPage() {
    const [roles, setRoles] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const loadRoles = async () => {
        try {
            const data = await getRolesApi();
            setRoles(data || []);
        } catch {
            message.error("Không thể tải danh sách vai trò!");
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleCreate = () => {
        setEditingRole(null);
        setOpen(true);
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        setOpen(true);
    };

    const handleSubmit = async (values) => {
        try {
            if (editingRole) {
                await updateRoleApi(editingRole.id, values);
            } else {
                await createRoleApi(values);
            }
            message.success("Lưu thông tin vai trò thành công!");
            setOpen(false);
            loadRoles();
        } catch {
            message.error("Lưu thông tin vai trò thất bại!");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteRoleApi(id);
            message.success("Đã xóa vai trò thành công!");
            loadRoles();
        } catch {
            message.error("Xóa vai trò thất bại!");
        }
    };

    const screens = Grid.useBreakpoint();

    return (
        <div style={{ padding: screens.xs ? "12px 8px" : "24px 32px", maxWidth: 1200, margin: "0 auto", minHeight: "100vh" }}>
            <div style={{
                marginBottom: 24,
                display: "flex",
                flexDirection: screens.xs ? "column" : "row",
                justifyContent: "space-between",
                alignItems: screens.xs ? "stretch" : "center",
                gap: 12
            }}>
                <div>
                    <Title level={screens.xs ? 4 : 3} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Phân Quyền Vai Trò Hệ Thống</Title>
                    <Text style={{ color: "#64748b", fontSize: screens.xs ? 12 : 14 }}>Quản lý danh sách các vai trò và quyền hạn quản trị trong hệ thống SalonFlow.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    size={screens.xs ? "middle" : "large"}
                    style={{ borderRadius: 8, fontWeight: 600, background: "#2563eb", border: "none" }}
                >
                    Thêm vai trò mới
                </Button>
            </div>

            <Card bordered={false} style={{ borderRadius: screens.xs ? 10 : 16, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }} bodyStyle={{ padding: 0 }}>
                <RoleTable
                    roles={roles}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>

            <RoleModal
                open={open}
                initialValues={editingRole}
                onCancel={() => setOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}