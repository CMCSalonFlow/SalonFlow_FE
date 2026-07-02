import React, { useEffect, useState } from "react";
import {
    Button,
    Select,
    message,
    Card,
    Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import OffDayFormModal from "../components/OffDayFormModal";
import OffDayTable from "../components/OffDayTable";

import { useOffDays } from "../hooks/useOffDays";
import offdayApi from "../api/offdayApi";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";

const { Title } = Typography;

const OffDayManagementPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [staffList, setStaffList] = useState([]);

    const [selectedStaffId, setSelectedStaffId] =
        useState(null);

    const {
        offDays,
        loading,
        reload,
    } = useOffDays(selectedStaffId);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Lấy danh sách chi nhánh của tài khoản
            const branches = await getMyBranchesApi();

            if (!branches || branches.length === 0) {
                message.warning(
                    "Bạn chưa được gán vào chi nhánh."
                );
                return;
            }

            // Lấy chi nhánh đầu tiên
            const currentBranchId = branches[0].id;

            // Lấy danh sách nhân viên của chi nhánh
            const staffs =
                await getStaffByBranchApi(currentBranchId);

            setStaffList(staffs);
        } catch (error) {
            console.error(error);

            message.error(
                "Không tải được danh sách nhân viên."
            );
        }
    };

    const handleCreate = async (values) => {
        try {
            await offdayApi.createOffDay(
                selectedStaffId,
                values
            );

            message.success(
                "Tạo ngày nghỉ thành công!"
            );

            setIsModalOpen(false);

            reload();
        } catch (error) {
            console.error(error);

            message.error(
                error.response?.data?.message ||
                    "Tạo ngày nghỉ thất bại!"
            );
        }
    };

    const handleDelete = async (offDayId) => {
        try {
            await offdayApi.deleteOffDay(offDayId);

            message.success(
                "Xóa ngày nghỉ thành công!"
            );

            reload();
        } catch (error) {
            console.error(error);

            message.error(
                error.response?.data?.message ||
                    "Xóa ngày nghỉ thất bại!"
            );
        }
    };

    return (
        <div className="p-6">
            <Title level={2}>
                Quản lý ngày nghỉ nhân viên
            </Title>

            <Card className="mb-6">
                <div className="flex items-center gap-4">
                    <span className="font-medium w-32">
                        Nhân viên:
                    </span>

                    <Select
                        style={{ width: 350 }}
                        placeholder="Chọn nhân viên"
                        value={selectedStaffId}
                        onChange={setSelectedStaffId}
                        allowClear
                    >
                        {staffList.map((staff) => (
                            <Select.Option
                                key={staff.id}
                                value={staff.id}
                            >
                                {staff.name}
                            </Select.Option>
                        ))}
                    </Select>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        disabled={!selectedStaffId}
                        onClick={() =>
                            setIsModalOpen(true)
                        }
                    >
                        Thêm ngày nghỉ
                    </Button>
                </div>
            </Card>

            {selectedStaffId ? (
                <OffDayTable
                    offDays={offDays}
                    loading={loading}
                    onDelete={handleDelete}
                />
            ) : (
                <Card>
                    <p className="text-center text-gray-500 py-10">
                        Vui lòng chọn nhân viên để
                        xem ngày nghỉ.
                    </p>
                </Card>
            )}

            <OffDayFormModal
                open={isModalOpen}
                onCancel={() =>
                    setIsModalOpen(false)
                }
                onSubmit={handleCreate}
            />
        </div>
    );
};

export default OffDayManagementPage;