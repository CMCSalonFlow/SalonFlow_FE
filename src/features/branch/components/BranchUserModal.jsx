import {
    Button,
    Modal,
    Select,
    Space,
    Table,
    Popconfirm,
    message,
    Grid
} from "antd";
import { useEffect, useState } from "react";

import { useBranch } from "../hooks/useBranch";
import { getUsersApi } from "@/features/user/api/userApi";

export default function BranchUserModal({
    open,
    onCancel,
    branch
}) {
    const screens = Grid.useBreakpoint();
    const {
        getBranchUsers,
        assignUser,
        removeUser
    } = useBranch();

    const [users, setUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState();

    useEffect(() => {
        if (open && branch) {
            loadUsers();
            loadAllUsers();
        }
    }, [open, branch]);

    const loadUsers = async () => {
        const data = await getBranchUsers(branch.id);
        setUsers(data);
    };

    const loadAllUsers = async () => {
        const data = await getUsersApi();
        setAllUsers(data);
    };

    const handleAssign = async () => {
        if (!selectedUser) {
            return;
        }
        await assignUser(
            branch.id,
            selectedUser
        );
        message.success(
            "Thêm nhân viên thành công"
        );
        setSelectedUser(undefined);
        loadUsers();
    };

    const handleRemove = async (userId) => {
        await removeUser(
            branch.id,
            userId
        );
        message.success(
            "Đã xóa nhân viên"
        );
        loadUsers();
    };

    const columns = [
        {
            title: "Họ tên",
            dataIndex: "fullName",
            width: 180
        },
        {
            title: "Email",
            dataIndex: "email",
            width: 220
        },
        {
            title: "Điện thoại",
            dataIndex: "phone",
            width: 140
        },
        {
            title: "Thao tác",
            width: 100,
            fixed: screens.md ? "right" : false,
            render: (_, record) => (
                <Popconfirm
                    title="Xóa nhân viên?"
                    onConfirm={() =>
                        handleRemove(record.id)
                    }
                >
                    <Button
                        danger
                        type="link"
                    >
                        Xóa
                    </Button>
                </Popconfirm>
            )
        }
    ];

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            width={screens.xs ? "95%" : 800}
            title={
                branch
                    ? `Nhân viên - ${branch.name}`
                    : "Nhân viên"
            }
        >
            <Space
                direction={screens.xs ? "vertical" : "horizontal"}
                style={{
                    marginBottom: 16,
                    width: "100%"
                }}
            >
                <Select
                    style={{
                        width: screens.xs ? "100%" : 350
                    }}
                    value={selectedUser}
                    onChange={setSelectedUser}
                    placeholder="Chọn nhân viên"
                    options={allUsers.map(user => ({
                        value: user.id,
                        label: user.fullName
                    }))}
                />
                <Button
                    type="primary"
                    onClick={handleAssign}
                    style={{ width: screens.xs ? "100%" : "auto" }}
                >
                    Thêm
                </Button>
            </Space>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={users}
                pagination={false}
                scroll={{ x: 640 }}
            />
        </Modal>
    );
}