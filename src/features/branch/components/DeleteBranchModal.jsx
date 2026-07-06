import {
    Modal
} from "antd";

export default function DeleteBranchModal({
    open,
    onCancel,
    onDelete
}) {

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            onOk={onDelete}
            title="Xóa chi nhánh"
        >
            Bạn có chắc chắn muốn xóa chi nhánh này?
        </Modal>
    );
}