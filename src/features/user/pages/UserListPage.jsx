import {
    useEffect,
    useState
} from "react";

import {
    Button,
    Space,
    message
} from "antd";

import UserTable
from "../components/UserTable";

import UserModal
from "../components/UserModal";

import {
    getUsersApi,
    createUserApi,
    updateUserApi,
    deleteUserApi
}
from "../api/userApi";

export default function UserListPage() {

    const [users, setUsers] =
        useState([]);

    const [open,
        setOpen] =
        useState(false);

    const [editingUser,
        setEditingUser] =
        useState(null);

    const loadUsers =
        async () => {

            try {

                const data =
                    await getUsersApi();

                setUsers(data);

            } catch {

                message.error(
                    "Load users failed"
                );
            }
        };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreate =
        () => {

            setEditingUser(
                null
            );

            setOpen(true);
        };

    const handleEdit =
        (user) => {

            setEditingUser(
                user
            );

            setOpen(true);
        };

    const handleSubmit =
        async (values) => {

            try {

                if (
                    editingUser
                ) {

                    await updateUserApi(
                        editingUser.id,
                        values
                    );

                } else {

                    await createUserApi(
                        values
                    );
                }

                message.success(
                    "Success"
                );

                setOpen(false);

                loadUsers();

            } catch {

                message.error(
                    "Save failed"
                );
            }
        };

    const handleDelete =
        async (id) => {

            try {

                await deleteUserApi(
                    id
                );

                message.success(
                    "Deleted"
                );

                loadUsers();

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
                    marginBottom: 20
                }}
            >

                <Button
                    type="primary"
                    onClick={
                        handleCreate
                    }
                >
                    Create User
                </Button>

            </Space>

            <UserTable
                users={users}
                onEdit={
                    handleEdit
                }
                onDelete={
                    handleDelete
                }
            />

            <UserModal
                open={open}
                initialValues={
                    editingUser
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