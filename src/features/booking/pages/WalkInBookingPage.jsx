import { useEffect, useState, useMemo } from "react";
import {
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    Select,
    message,
    Row,
    Col,
    Typography,
    Tag,
    Divider,
    Space,
    Radio,
    Modal,
    Avatar,
    Spin,
    Badge
} from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    ScissorOutlined,
    ShopOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    PrinterOutlined,
    PlusOutlined,
    CreditCardOutlined,
    FileTextOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getServicesByBranchApi } from "@/features/service/api/serviceApi";
import {
    createWalkInBookingApi,
    getAvailabilityApi,
} from "../api/bookingApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function WalkInBookingPage() {
    const [form] = Form.useForm();

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(null);

    const [staffs, setStaffs] = useState([]);
    const [services, setServices] = useState([]);

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successBooking, setSuccessBooking] = useState(null);

    // Dynamic Selected State for POS Summary Cart
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("PAY_AT_COUNTER");

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            const branchData = await getMyBranchesApi();
            setBranches(branchData || []);

            if (branchData && branchData.length > 0) {
                const first = branchData[0];
                setBranchId(first.id);
                form.setFieldValue("branchId", first.id);
                await loadData(first.id);
            }
        } catch (e) {
            console.error(e);
            message.error("Không lấy được danh sách chi nhánh.");
        }
    };

    const loadData = async (id) => {
        try {
            const [staffData, serviceData] = await Promise.all([
                getStaffByBranchApi(id),
                getServicesByBranchApi(id)
            ]);
            setStaffs(staffData || []);
            setServices(serviceData || []);
        } catch (e) {
            console.error(e);
            message.error("Không tải được dữ liệu nhân viên hoặc dịch vụ.");
        }
    };

    const handleBranchChange = async (id) => {
        setBranchId(id);
        setSelectedServiceIds([]);
        setSelectedStaffId(null);
        setSelectedSlot(null);
        setAvailableSlots([]);

        form.setFieldsValue({
            staffId: undefined,
            serviceIds: [],
            bookingDate: undefined,
            startTime: undefined,
        });

        await loadData(id);
    };

    const loadAvailability = async () => {
        const values = form.getFieldsValue();
        const currentServiceIds = values.serviceIds || [];

        setSelectedServiceIds(currentServiceIds);
        setSelectedStaffId(values.staffId);

        if (
            !branchId ||
            !values.bookingDate ||
            currentServiceIds.length === 0
        ) {
            setAvailableSlots([]);
            return;
        }

        try {
            setLoadingSlots(true);
            const response = await getAvailabilityApi(branchId, {
                date: values.bookingDate.format("YYYY-MM-DD"),
                serviceIds: currentServiceIds,
                staffId: values.staffId,
            });

            const slots = response.availableStartTimes || [];
            setAvailableSlots(
                slots.map((time) => ({
                    value: time,
                    label: time.substring(0, 5),
                }))
            );
        } catch (e) {
            console.error(e);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    // Selected Services Data Objects
    const selectedServicesList = useMemo(() => {
        return services.filter(s => selectedServiceIds.includes(s.id));
    }, [services, selectedServiceIds]);

    const totalPrice = useMemo(() => {
        return selectedServicesList.reduce((sum, item) => sum + (item.price || 0), 0);
    }, [selectedServicesList]);

    const totalDuration = useMemo(() => {
        return selectedServicesList.reduce((sum, item) => sum + (item.durationMinutes || item.duration || 0), 0);
    }, [selectedServicesList]);

    const selectedStaffObj = useMemo(() => {
        return staffs.find(s => s.id === selectedStaffId);
    }, [staffs, selectedStaffId]);

    const selectedBranchObj = useMemo(() => {
        return branches.find(b => b.id === branchId);
    }, [branches, branchId]);

    const onFinish = async (values) => {
        try {
            setSubmitting(true);

            const payload = {
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                preferredStaffId: values.staffId,
                staffId: values.staffId,
                bookingDate: values.bookingDate.format("YYYY-MM-DD"),
                startTime: values.startTime,
                serviceIds: values.serviceIds,
                notes: values.note || values.notes || "",
            };

            const createdRes = await createWalkInBookingApi(branchId, payload);
            
            setSuccessBooking({
                id: createdRes?.id || "WALK-IN",
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                branchName: selectedBranchObj?.name || "Chi nhánh",
                staffName: selectedStaffObj?.name || "Bất kỳ nhân viên",
                date: values.bookingDate.format("DD/MM/YYYY"),
                time: values.startTime ? values.startTime.substring(0, 5) : "",
                totalPrice: totalPrice,
                totalDuration: totalDuration,
                services: selectedServicesList,
                paymentMethod: paymentMethod === "PAY_AT_COUNTER" ? "Tiền mặt tại quầy" : "Chuyển khoản QR"
            });

            message.success("Tạo lịch đặt tại quầy thành công!");

            // Reset form for next walk-in booking
            form.resetFields();
            form.setFieldValue("branchId", branchId);
            setSelectedServiceIds([]);
            setSelectedStaffId(null);
            setSelectedSlot(null);
            setAvailableSlots([]);
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message ?? "Đã xảy ra lỗi khi tạo lịch vãng lai.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 40 }}>
            {/* Header POS Terminal Banner */}
            <Card
                style={{
                    marginBottom: 20,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #001529 0%, #003a8c 100%)",
                    color: "#fff",
                    border: 0,
                    boxShadow: "0 4px 16px rgba(0, 21, 41, 0.15)"
                }}
                bodyStyle={{ padding: "20px 24px" }}
            >
                <Row align="middle" justify="space-between">
                    <Col>
                        <Space size={12} align="center">
                            <Avatar
                                size={48}
                                icon={<ShopOutlined />}
                                style={{ backgroundColor: "#1890ff" }}
                            />
                            <div>
                                <Title level={3} style={{ color: "#fff", margin: 0 }}>
                                    Hệ Thống POS Đặt Lịch Tại Quầy (Walk-in Counter)
                                </Title>
                                <Text style={{ color: "#8c8c8c", fontSize: 13 }}>
                                    Dành cho Staff & Quản lý tiếp nhận khách vãng lai, xếp lịch phục vụ tức thì
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Tag color="green" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 20 }}>
                            ● POS OPERATIONAL
                        </Tag>
                    </Col>
                </Row>
            </Card>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ paymentMethod: "PAY_AT_COUNTER" }}
            >
                <Row gutter={24}>
                    {/* LEFT PANEL: POS Selection Inputs */}
                    <Col xs={24} lg={15}>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            {/* Card 1: Chọn Chi Nhánh & Thông Tin Khách Hàng */}
                            <Card
                                title={
                                    <Space>
                                        <UserOutlined style={{ color: "#1890ff" }} />
                                        <span>1. Thông Tin Khách Hàng Vãng Lai & Chi Nhánh</span>
                                    </Space>
                                }
                                style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Chi nhánh thực hiện"
                                            name="branchId"
                                            rules={[{ required: true, message: "Vui lòng chọn chi nhánh" }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Chọn chi nhánh"
                                                onChange={handleBranchChange}
                                                options={branches.map((b) => ({
                                                    value: b.id,
                                                    label: b.name
                                                }))}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Tên khách hàng vãng lai"
                                            name="customerName"
                                            rules={[{ required: true, message: "Nhập tên khách hàng" }]}
                                        >
                                            <Input
                                                size="large"
                                                prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
                                                placeholder="Ví dụ: Anh Nam / Chị Lan"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Số điện thoại liên hệ"
                                            name="customerPhone"
                                            rules={[
                                                { required: true, message: "Nhập số điện thoại" },
                                                { pattern: /^0\d{9}$/, message: "SĐT gồm 10 chữ số (bắt đầu bằng 0)" }
                                            ]}
                                        >
                                            <Input
                                                size="large"
                                                maxLength={10}
                                                prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                                                placeholder="09xxxxxxxx"
                                                onInput={(e) => (e.target.value = e.target.value.replace(/\D/g, ""))}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item label="Ghi chú dịch vụ (nếu có)" name="note">
                                            <Input
                                                size="large"
                                                prefix={<FileTextOutlined style={{ color: "#bfbfbf" }} />}
                                                placeholder="Yêu cầu cắt kĩ, uốn nhẹ..."
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Card 2: Chọn Dịch Vụ & Nhân Viên */}
                            <Card
                                title={
                                    <Space>
                                        <ScissorOutlined style={{ color: "#52c41a" }} />
                                        <span>2. Chọn Dịch Vụ & Nhân Viên Đảm Nhận</span>
                                    </Space>
                                }
                                style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Form.Item
                                    label="Dịch vụ làm đẹp (Chọn 1 hoặc nhiều)"
                                    name="serviceIds"
                                    rules={[{ required: true, message: "Hãy chọn ít nhất 1 dịch vụ" }]}
                                >
                                    <Select
                                        size="large"
                                        mode="multiple"
                                        placeholder="Bấm chọn dịch vụ..."
                                        onChange={loadAvailability}
                                        options={services.map((s) => ({
                                            value: s.id,
                                            label: `${s.name} - ${(s.price || 0).toLocaleString("vi-VN")} VND (${s.durationMinutes || s.duration || 30} phút)`
                                        }))}
                                        style={{ width: "100%" }}
                                    />
                                </Form.Item>

                                <Form.Item label="Nhân viên cắt/làm tóc (Tùy chọn)" name="staffId">
                                    <Select
                                        size="large"
                                        allowClear
                                        placeholder="Bất kỳ nhân viên khả dụng (Hệ thống tự gán)"
                                        onChange={loadAvailability}
                                        options={staffs.map((s) => ({
                                            value: s.id,
                                            label: `Stylist: ${s.name}`
                                        }))}
                                    />
                                </Form.Item>
                            </Card>

                            {/* Card 3: Chọn Ngày & Khung Giờ */}
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                                        <span>3. Chọn Ngày & Khung Giờ Phục Vụ</span>
                                    </Space>
                                }
                                style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Ngày thực hiện"
                                            name="bookingDate"
                                            rules={[{ required: true, message: "Chọn ngày" }]}
                                        >
                                            <DatePicker
                                                size="large"
                                                style={{ width: "100%" }}
                                                format="DD/MM/YYYY"
                                                onChange={loadAvailability}
                                                disabledDate={(current) => current && current < dayjs().startOf("day")}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Khung giờ trống khả dụng"
                                            name="startTime"
                                            rules={[{ required: true, message: "Chọn khung giờ" }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Chọn khung giờ"
                                                onChange={(val) => setSelectedSlot(val)}
                                                options={availableSlots}
                                                loading={loadingSlots}
                                                notFoundContent={
                                                    loadingSlots ? (
                                                        <Spin size="small" />
                                                    ) : (
                                                        <Text type="secondary">
                                                            Chưa chọn đủ Dịch vụ / Ngày hoặc đã kín lịch
                                                        </Text>
                                                    )
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {/* Quick Slots Grid Preview */}
                                {availableSlots.length > 0 && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                                            Các khung giờ còn trống (Bấm nhanh để chọn):
                                        </Text>
                                        <Space wrap size={[8, 8]}>
                                            {availableSlots.map((slot) => (
                                                <Button
                                                    key={slot.value}
                                                    type={selectedSlot === slot.value ? "primary" : "default"}
                                                    size="middle"
                                                    onClick={() => {
                                                        form.setFieldValue("startTime", slot.value);
                                                        setSelectedSlot(slot.value);
                                                    }}
                                                    style={{ borderRadius: 6 }}
                                                >
                                                    {slot.label}
                                                </Button>
                                            ))}
                                        </Space>
                                    </div>
                                )}
                            </Card>
                        </Space>
                    </Col>

                    {/* RIGHT PANEL: Sticky POS Summary Counter Ticket Cart */}
                    <Col xs={24} lg={9}>
                        <Card
                            title={
                                <Space justify="space-between" style={{ width: "100%" }}>
                                    <Space>
                                        <DollarOutlined style={{ color: "#faad14" }} />
                                        <span>PHIẾU TẠO ĐƠN POS</span>
                                    </Space>
                                    <Tag color="gold">COUNTER CART</Tag>
                                </Space>
                            }
                            style={{
                                borderRadius: 12,
                                border: "1px solid #ffe58f",
                                background: "#fffbe6",
                                sticky: "top",
                                position: "sticky",
                                top: 20,
                                boxShadow: "0 4px 12px rgba(250, 173, 20, 0.15)"
                            }}
                        >
                            {/* Summary Branch & Customer Info */}
                            <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                <Row justify="space-between" style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Chi nhánh:</Text>
                                    <Text bold>{selectedBranchObj?.name || "Chưa chọn"}</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text type="secondary">Khách vãng lai:</Text>
                                    <Text bold>{form.getFieldValue("customerName") || "Chưa nhập"}</Text>
                                </Row>
                            </div>

                            {/* Selected Services Itemized Breakdown */}
                            <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                                Danh sách dịch vụ ({selectedServicesList.length}):
                            </Title>

                            {selectedServicesList.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "#bfbfbf" }}>
                                    <ScissorOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                    <div>Chưa chọn dịch vụ nào</div>
                                </div>
                            ) : (
                                <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                    {selectedServicesList.map((item, idx) => (
                                        <Row key={item.id || idx} justify="space-between" align="middle" style={{ padding: "6px 0", borderBottom: idx < selectedServicesList.length - 1 ? "1px dashed #f0f0f0" : 0 }}>
                                            <Col span={14}>
                                                <Text style={{ fontSize: 13 }}>{item.name}</Text>
                                                <div>
                                                    <Tag color="blue" style={{ fontSize: 10 }}>
                                                        {item.durationMinutes || item.duration || 30} phút
                                                    </Tag>
                                                </div>
                                            </Col>
                                            <Col span={10} style={{ textAlign: "right" }}>
                                                <Text bold style={{ color: "#d4b106" }}>
                                                    {(item.price || 0).toLocaleString("vi-VN")} đ
                                                </Text>
                                            </Col>
                                        </Row>
                                    ))}
                                </div>
                            )}

                            <Divider style={{ margin: "12px 0" }} />

                            {/* Total Calculation */}
                            <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
                                <Text style={{ fontSize: 13 }}>Tổng thời gian:</Text>
                                <Text bold style={{ fontSize: 14 }}>{totalDuration} phút</Text>
                            </Row>

                            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 15, fontWeight: 700 }}>Tổng tiền dịch vụ:</Text>
                                <Text bold style={{ fontSize: 20, color: "#cf1322" }}>
                                    {totalPrice.toLocaleString("vi-VN")} VND
                                </Text>
                            </Row>

                            {/* Payment Method Selector */}
                            <div style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
                                    Hình thức thu tiền tại quầy:
                                </Text>
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={{ width: "100%" }}
                                >
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Radio value="PAY_AT_COUNTER" style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, width: "100%" }}>
                                            <Space>
                                                <DollarOutlined style={{ color: "#52c41a" }} />
                                                <span>Tiền mặt tại quầy</span>
                                            </Space>
                                        </Radio>
                                        <Radio value="ONLINE_QR" style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, width: "100%" }}>
                                            <Space>
                                                <CreditCardOutlined style={{ color: "#1890ff" }} />
                                                <span>Chuyển khoản QR / Thẻ POS</span>
                                            </Space>
                                        </Radio>
                                    </Space>
                                </Radio.Group>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                block
                                icon={<CheckCircleOutlined />}
                                style={{
                                    height: 48,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: "#52c41a",
                                    borderColor: "#52c41a",
                                    boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)"
                                }}
                            >
                                XÁC NHẬN TẠO LỊCH POS
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Form>

            {/* Success Modal Preview / Printable Ticket */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 22 }} />
                        <span>TẠO BOOKING TẠI QUẦY THÀNH CÔNG!</span>
                    </Space>
                }
                open={!!successBooking}
                onCancel={() => setSuccessBooking(null)}
                footer={[
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
                        In Phiếu Lịch Hẹn
                    </Button>,
                    <Button key="new" type="primary" icon={<PlusOutlined />} onClick={() => setSuccessBooking(null)}>
                        Tạo Booking Tiếp Theo
                    </Button>
                ]}
                width={520}
            >
                {successBooking && (
                    <div style={{ padding: "12px 0" }}>
                        <Card size="small" style={{ background: "#f6ffed", borderColor: "#b7eb8f", marginBottom: 16 }}>
                            <Row justify="space-between">
                                <Text type="secondary">Mã đơn đặt:</Text>
                                <Text bold style={{ color: "#52c41a" }}>#{successBooking.id}</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Khách hàng:</Text>
                                <Text bold>{successBooking.customerName} ({successBooking.customerPhone})</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Thời gian hẹn:</Text>
                                <Text bold>{successBooking.time} - Ngày {successBooking.date}</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Nhân viên phục vụ:</Text>
                                <Text bold>{successBooking.staffName}</Text>
                            </Row>
                        </Card>

                        <Title level={5} style={{ fontSize: 14 }}>Chi tiết dịch vụ:</Title>
                        {successBooking.services.map((s) => (
                            <Row key={s.id} justify="space-between" style={{ padding: "4px 0" }}>
                                <Text>{s.name}</Text>
                                <Text bold>{(s.price || 0).toLocaleString("vi-VN")} VND</Text>
                            </Row>
                        ))}

                        <Divider style={{ margin: "12px 0" }} />

                        <Row justify="space-between" align="middle">
                            <Text bold style={{ fontSize: 16 }}>TỔNG CỘNG THU KHÁCH:</Text>
                            <Text bold style={{ fontSize: 20, color: "#cf1322" }}>
                                {successBooking.totalPrice.toLocaleString("vi-VN")} VND
                            </Text>
                        </Row>
                        <Row justify="space-between" style={{ marginTop: 4 }}>
                            <Text type="secondary">Hình thức:</Text>
                            <Tag color="green">{successBooking.paymentMethod}</Tag>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
}