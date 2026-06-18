import {
    useEffect,
    useState
} from "react";

import {
    Button,
    Space,
    message
} from "antd";

import RoleTable
from "../components/RoleTable";

import RoleModal
from "../components/RoleModal";

import {
    getRolesApi,
    createRoleApi,
    updateRoleApi,
    deleteRoleApi
}
from "../api/roleApi";

export default function RoleListPage() {

    const [roles, setRoles] =
        useState([]);

    const [open,
        setOpen] =
        useState(false);

    const [editingRole,
        setEditingRole] =
        useState(null);

    const loadRoles =
        async () => {

            try {

                const data =
                    await getRolesApi();

                setRoles(data);

            } catch {

                message.error(
                    "Load roles failed"
                );
            }
        };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleCreate =
        () => {

            setEditingRole(
                null
            );

            setOpen(true);
        };

    const handleEdit =
        (role) => {

            setEditingRole(
                role
            );

            setOpen(true);
        };

    const handleSubmit =
        async (values) => {

            try {

                if (
                    editingRole
                ) {

                    await updateRoleApi(
                        editingRole.id,
                        values
                    );

                } else {

                    await createRoleApi(
                        values
                    );
                }

                message.success(
                    "Success"
                );

                setOpen(false);

                loadRoles();

            } catch {

                message.error(
                    "Save failed"
                );
            }
        };

    const handleDelete =
        async (id) => {

            try {

                await deleteRoleApi(
                    id
                );

                message.success(
                    "Deleted"
                );

                loadRoles();

            } catch {

                message.error(
                    "Delete failed"
                );
            }
        };

    return (

        <div>

            <Space
                style={{
                    marginBottom: 16
                }}
            >

                <Button
                    type="primary"
                    onClick={
                        handleCreate
                    }
                >
                    Create Role
                </Button>

            </Space>

            <RoleTable
                roles={roles}
                onEdit={
                    handleEdit
                }
                onDelete={
                    handleDelete
                }
            />

            <RoleModal
                open={open}
                initialValues={
                    editingRole
                }
                onCancel={() =>
                    setOpen(false)
                }
                onSubmit={
                    handleSubmit
                }
            />

        </div>
    );
}