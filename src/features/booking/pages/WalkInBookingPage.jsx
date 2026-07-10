import { useEffect, useState } from "react";
import {
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    Select,
    TimePicker,
    message,
} from "antd";
import dayjs from "dayjs";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getServicesByBranchApi } from "@/features/service/api/serviceApi";
import { createWalkInBookingApi } from "../api/bookingApi";

const { TextArea } = Input;

export default function WalkInBookingPage() {

    const [form] = Form.useForm();

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(null);

    const [staffs, setStaffs] = useState([]);
    const [services, setServices] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {

            const branchData = await getMyBranchesApi();

            setBranches(branchData);

            if (branchData.length > 0) {

                const firstBranch = branchData[0];

                setBranchId(firstBranch.id);

                form.setFieldValue("branchId", firstBranch.id);

                await loadData(firstBranch.id);
            }

        } catch (e) {

            console.error(e);

            message.error("Không lấy được danh sách chi nhánh.");

        }
    };

    const loadData = async (id) => {

        try {

            const staffData = await getStaffByBranchApi(id);
            const serviceData = await getServicesByBranchApi(id);

            setStaffs(staffData);
            setServices(serviceData);

        } catch (e) {

            console.error(e);

            message.error("Không tải được dữ liệu.");

        }
    };

    const handleBranchChange = async (value) => {

        setBranchId(value);

        form.setFieldValue("staffId", undefined);
        form.setFieldValue("serviceIds", []);

        await loadData(value);

    };

    const onFinish = async (values) => {

        if (!branchId) {
            message.error("Vui lòng chọn chi nhánh.");
            return;
        }

        try {

            setLoading(true);

            const payload = {

                customerName: values.customerName,
                customerPhone: values.customerPhone,

                staffId: values.staffId,

                bookingDate: values.bookingDate.format("YYYY-MM-DD"),

                startTime: values.startTime.format("HH:mm:ss"),

                serviceIds: values.serviceIds,

                note: values.note

            };

            console.log(payload);

            await createWalkInBookingApi(branchId, payload);

            message.success("Tạo booking thành công.");

            form.resetFields();

            form.setFieldValue("branchId", branchId);

        } catch (e) {

            console.error(e);

            message.error(
                e?.response?.data?.message ??
                "Có lỗi xảy ra."
            );

        } finally {

            setLoading(false);

        }

    };

    return (
        <Card
            title="Đặt lịch Walk-in"
            style={{ maxWidth: 800, margin: "0 auto" }}
        >

            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
            >

                <Form.Item
                    label="Chi nhánh"
                    name="branchId"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn chi nhánh"
                        }
                    ]}
                >
                    <Select
                        placeholder="Chọn chi nhánh"
                        onChange={handleBranchChange}
                        options={branches.map(branch => ({
                            value: branch.id,
                            label: branch.name
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Tên khách hàng"
                    name="customerName"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên khách hàng"
                        }
                    ]}
                >
                    <Input />
                </Form.Item>

               <Form.Item
            label="Số điện thoại"
             name="customerPhone"
              rules={[
             {
                        required: true,
                        message: "Vui lòng nhập số điện thoại"
             },
             {
                        pattern: /^0\d{9}$/,
                         message: "Số điện thoại phải gồm 10 số và bắt đầu bằng 0"
             }
            ]}
>
              <Input
                       placeholder="Nhập số điện thoại"
                     maxLength={10}
                     inputMode="numeric"
                     onInput={(e) => {
                     e.target.value = e.target.value.replace(/\D/g, "");
                  }}
            />
                </Form.Item>

                <Form.Item
                    label="Nhân viên"
                    name="staffId"
                >
                    <Select
                        allowClear
                        placeholder="Bất kỳ nhân viên"
                        options={staffs.map(staff => ({
                            value: staff.id,
                            label: staff.name
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Dịch vụ"
                    name="serviceIds"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn dịch vụ"
                        }
                    ]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Chọn dịch vụ"
                        options={services.map(service => ({
                            value: service.id,
                            label: service.name
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    label="Ngày đặt"
                    name="bookingDate"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn ngày"
                        }
                    ]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        disabledDate={(current) =>
                            current &&
                            current < dayjs().startOf("day")
                        }
                    />
                </Form.Item>

                <Form.Item
                    label="Giờ bắt đầu"
                    name="startTime"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn giờ"
                        }
                    ]}
                >
                    <TimePicker
                        style={{ width: "100%" }}
                        format="HH:mm"
                        use12Hours={false}
                        minuteStep={15}
                    />
                </Form.Item>

                <Form.Item
                    label="Ghi chú"
                    name="note"
                >
                    <TextArea rows={4} />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                >
                    Tạo Booking
                </Button>

            </Form>

        </Card>
    );
}