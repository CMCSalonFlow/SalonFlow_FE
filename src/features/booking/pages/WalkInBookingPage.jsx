import { useEffect, useState } from "react";
import {
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    Select,
    message,
} from "antd";
import dayjs from "dayjs";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getServicesByBranchApi } from "@/features/service/api/serviceApi";
import {
    createWalkInBookingApi,
    getAvailabilityApi,
} from "../api/bookingApi";

const { TextArea } = Input;

export default function WalkInBookingPage() {

    const [form] = Form.useForm();

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState();

    const [staffs, setStaffs] = useState([]);
    const [services, setServices] = useState([]);

    const [availableSlots, setAvailableSlots] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {

            const branchData = await getMyBranchesApi();

            setBranches(branchData);

            if (branchData.length > 0) {

                const first = branchData[0];

                setBranchId(first.id);

                form.setFieldValue("branchId", first.id);

                await loadData(first.id);

            }

        } catch (e) {

            console.error(e);

            message.error("Không lấy được chi nhánh.");

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

    const handleBranchChange = async (id) => {

        setBranchId(id);

        form.setFieldsValue({
            staffId: undefined,
            serviceIds: [],
            bookingDate: undefined,
            startTime: undefined,
        });

        setAvailableSlots([]);

        await loadData(id);

    };

    const loadAvailability = async () => {

        const values = form.getFieldsValue();

        if (
            !branchId ||
            !values.bookingDate ||
            !values.serviceIds ||
            values.serviceIds.length === 0
        ) {
            setAvailableSlots([]);
            return;
        }

        try {

            const response = await getAvailabilityApi(branchId, {

                date: values.bookingDate.format("YYYY-MM-DD"),

                serviceIds: values.serviceIds,

                staffId: values.staffId,

            });

            console.log("Availability:", response);

            const slots = response.availableStartTimes || [];

            setAvailableSlots(
                slots.map((time) => ({
                    value: time,
                    label: time.substring(0, 5), // 08:30:00 -> 08:30
                }))
            );

        } catch (e) {

            console.error(e);

            setAvailableSlots([]);

        }

    };

    const onFinish = async (values) => {

        try {

            setLoading(true);

            const payload = {

                customerName: values.customerName,

                customerPhone: values.customerPhone,

                staffId: values.staffId,

                bookingDate: values.bookingDate.format("YYYY-MM-DD"),

                startTime: values.startTime,

                serviceIds: values.serviceIds,

                note: values.note,

            };

            console.log(payload);

            await createWalkInBookingApi(branchId, payload);

            message.success("Tạo booking thành công");

            form.resetFields();

            form.setFieldValue("branchId", branchId);

            setAvailableSlots([]);

        } catch (e) {

            console.error(e);

            message.error(
                e?.response?.data?.message ??
                "Có lỗi xảy ra"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <Card
            title="Đặt lịch Walk-in"
            style={{
                maxWidth: 800,
                margin: "0 auto"
            }}
        >

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >

                <Form.Item
                    label="Chi nhánh"
                    name="branchId"
                    rules={[
                        {
                            required: true,
                            message: "Chọn chi nhánh"
                        }
                    ]}
                >

                    <Select
                        placeholder="Chọn chi nhánh"
                        onChange={handleBranchChange}
                        options={branches.map((b) => ({
                            value: b.id,
                            label: b.name
                        }))}
                    />

                </Form.Item>

                <Form.Item
                    label="Tên khách hàng"
                    name="customerName"
                    rules={[
                        {
                            required: true,
                            message: "Nhập tên khách hàng"
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
                            message: "Nhập số điện thoại"
                        },
                        {
                            pattern: /^0\d{9}$/,
                            message: "SĐT không hợp lệ"
                        }
                    ]}
                >
                    <Input
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="09xxxxxxxx"
                        onInput={(e) =>
                            e.target.value =
                                e.target.value.replace(/\D/g, "")
                        }
                    />
                </Form.Item>

                <Form.Item
                    label="Nhân viên"
                    name="staffId"
                >

                    <Select
                        allowClear
                        placeholder="Bất kỳ nhân viên"
                        onChange={loadAvailability}
                        options={staffs.map((s) => ({
                            value: s.id,
                            label: s.name
                        }))}
                    />

                </Form.Item>

                <Form.Item
                    label="Dịch vụ"
                    name="serviceIds"
                    rules={[
                        {
                            required: true,
                            message: "Chọn dịch vụ"
                        }
                    ]}
                >

                    <Select
                        mode="multiple"
                        placeholder="Chọn dịch vụ"
                        onChange={loadAvailability}
                        options={services.map((s) => ({
                            value: s.id,
                            label: s.name
                        }))}
                    />

                </Form.Item>

                <Form.Item
                    label="Ngày"
                    name="bookingDate"
                    rules={[
                        {
                            required: true,
                            message: "Chọn ngày"
                        }
                    ]}
                >

                    <DatePicker
                        style={{
                            width: "100%"
                        }}
                        format="DD/MM/YYYY"
                        onChange={loadAvailability}
                        disabledDate={(current) =>
                            current &&
                            current < dayjs().startOf("day")
                        }
                    />

                </Form.Item>

                <Form.Item
                    label="Khung giờ còn trống"
                    name="startTime"
                    rules={[
                        {
                            required: true,
                            message: "Chọn giờ"
                        }
                    ]}
                >

                    <Select
                        placeholder="Chọn khung giờ"
                        options={availableSlots}
                        notFoundContent="Chưa có khung giờ"
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