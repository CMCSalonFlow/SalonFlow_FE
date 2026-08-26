import {
    Button,
    message,
    Space
} from "antd";

import {
    PlusOutlined
} from "@ant-design/icons";

import {
    useEffect,
    useState
} from "react";

import BranchTable from "../components/BranchTable";
import BranchModal from "../components/BranchModal";
import BranchUserModal from "../components/BranchUserModal";

import {
    useBranch
} from "../hooks/useBranch";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

export default function BranchListPage() {
    const { openLimitModal } = useSubscription();

    const {

        getBranches,

        createBranch,

        updateBranch,

        deleteBranch

    } = useBranch();

    const [

        branches,

        setBranches

    ] = useState([]);

    const [

        loading,

        setLoading

    ] = useState(false);

    const [

        open,

        setOpen

    ] = useState(false);

    const [

        editing,

        setEditing

    ] = useState(null);

    const [

        userModal,

        setUserModal

    ] = useState(false);

    const [

        selectedBranch,

        setSelectedBranch

    ] = useState();

    useEffect(() => {

        loadBranches();

    }, []);

    const loadBranches = async () => {

        setLoading(true);

        try {

            const data =
                await getBranches();

            setBranches(data);

        } finally {

            setLoading(false);

        }

    };

    const handleCreate = () => {

        setEditing(null);

        setOpen(true);

    };

    const handleEdit = (branch) => {

        setEditing(branch);

        setOpen(true);

    };

    const handleSubmit = async (values) => {
        try {
            if (editing) {
                await updateBranch(
                    editing.id,
                    values
                );
                message.success(
                    "Cập nhật thành công"
                );
            } else {
                await createBranch(
                    values
                );
                message.success(
                    "Thêm thành công"
                );
            }
            setOpen(false);
            loadBranches();
        } catch (error) {
            console.error("Submit error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Đã xảy ra lỗi khi lưu!";
            if (errorMsg.includes("Giới hạn") || errorMsg.includes("hạn mức") || errorMsg.includes("vượt quá") || errorMsg.includes("gói đăng ký")) {
                openLimitModal(errorMsg);
            } else {
                message.error(errorMsg);
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteBranch(id);
            message.success(
                "Đã xóa"
            );
            loadBranches();
        } catch (error) {
            console.error("Delete error:", error);
            const errorMsg = error.response?.data?.message || error.message || "Không thể xóa chi nhánh!";
            message.error(errorMsg);
        }
    };

    const handleToggleSms = async (branch, isSmsEnabled) => {
        try {
            await updateBranch(branch.id, {
                ...branch,
                isSmsEnabled
            });
            message.success(`Đã ${isSmsEnabled ? "bật" : "tắt"} SMS cho chi nhánh ${branch.name}`);
            loadBranches();
        } catch (error) {
            console.error("Toggle SMS error:", error);
            message.error("Không thể thay đổi trạng thái SMS!");
        }
    };

    const handleUsers = (branch) => {

        setSelectedBranch(branch);

        setUserModal(true);

    };

    return (

        <>

            <Space
                style={{
                    marginBottom: 20
                }}
            >

                <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={handleCreate}
                >

                    Thêm chi nhánh

                </Button>

            </Space>

            <BranchTable

                data={branches}

                loading={loading}

                onEdit={handleEdit}

                onDelete={handleDelete}

                onUsers={handleUsers}

                onToggleSms={handleToggleSms}

            />

            <BranchModal

                open={open}

                editing={editing}

                onCancel={() =>
                    setOpen(false)
                }

                onSubmit={handleSubmit}

            />

            <BranchUserModal

                open={userModal}

                branch={selectedBranch}

                onCancel={() =>
                    setUserModal(false)
                }

            />

        </>

    );

}