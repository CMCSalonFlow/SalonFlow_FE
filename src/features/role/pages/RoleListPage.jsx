import {
    useEffect,
    useState
} from "react";
import {
    Button,
    message,
    Typography,
    Card
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

    return (
        <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto", minHeight: "100vh" }}>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>Phân Quyền Vai Trò Hệ Thống</Title>
                    <Text style={{ color: "#64748b", fontSize: 14 }}>Quản lý danh sách các vai trò và quyền hạn quản trị trong hệ thống SalonFlow.</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    size="large"
                    style={{ borderRadius: 8, fontWeight: 600, background: "#2563eb", border: "none" }}
                >
                    Thêm vai trò mới
                </Button>
            </div>

            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }} bodyStyle={{ padding: 0 }}>
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