import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    InputNumber
} from "antd";
import {
    UserOutlined,
    PhoneOutlined,
    ClockCircleOutlined,
    ScissorOutlined,
    ShopOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    PrinterOutlined,
    PlusOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    SafetyCertificateOutlined,
    QrcodeOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getServicesByBranchApi } from "@/features/service/api/serviceApi";
import {
    createWalkInBookingApi,
    getAvailabilityApi,
} from "../api/bookingApi";
import { processPosCashPaymentApi } from "@/features/payment/api/paymentApi";

const { Title, Text } = Typography;

export default function WalkInBookingPage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const thermalReceiptRef = useRef(null);

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(null);

    const [staffs, setStaffs] = useState([]);
    const [services, setServices] = useState([]);

    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic Selected State for POS Summary Cart
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    // Cash Given by Customer for POS Cash Payment Change Calculation
    const [cashReceived, setCashReceived] = useState(null);

    // Success State including Thermal Receipt Data & Payment Record Info
    const [successData, setSuccessData] = useState(null);

    const staffUsername = localStorage.getItem("username") || "Staff";
    const staffFullName = localStorage.getItem("fullName") || staffUsername;
    const staffUserId = localStorage.getItem("userId");

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

    // Change Return calculation
    const changeAmount = useMemo(() => {
        if (!cashReceived || cashReceived < totalPrice) return 0;
        return cashReceived - totalPrice;
    }, [cashReceived, totalPrice]);

    const selectedStaffObj = useMemo(() => {
        return staffs.find(s => s.id === selectedStaffId);
    }, [staffs, selectedStaffId]);

    const selectedBranchObj = useMemo(() => {
        return branches.find(b => b.id === branchId);
    }, [branches, branchId]);

    const onFinish = async (values) => {
        try {
            setSubmitting(true);

            // 1. Tạo đơn Đặt lịch Walk-in
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

            const createdBooking = await createWalkInBookingApi(branchId, payload);
            const bookingId = createdBooking?.id;

            let paymentRecord = null;

            // 2. Nếu thanh toán tiền mặt (POS CASH MODE) -> Gọi endpoint riêng không qua payment gateway
            if (paymentMethod === "CASH" || paymentMethod === "PAY_AT_COUNTER") {
                paymentRecord = await processPosCashPaymentApi({
                    bookingId: bookingId,
                    amount: totalPrice,
                    notes: `Staff ${staffFullName} (ID: ${staffUserId}) thu tiền mặt tại quầy POS`
                });
            }

            // 3. Chuẩn bị thông tin In Hóa Đơn Nhiệt K80
            const receipt = {
                bookingId: bookingId,
                paymentId: paymentRecord?.paymentId || "POS-CASH",
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                branchName: selectedBranchObj?.name || "SalonFlow Branch",
                branchAddress: selectedBranchObj?.address || "",
                staffOperatorName: staffFullName,
                staffOperatorId: staffUserId,
                assignedStaffName: selectedStaffObj?.name || "Bất kỳ nhân viên",
                date: values.bookingDate.format("DD/MM/YYYY"),
                time: values.startTime ? values.startTime.substring(0, 5) : "",
                services: selectedServicesList,
                totalPrice: totalPrice,
                totalDuration: totalDuration,
                cashReceived: cashReceived || totalPrice,
                changeAmount: changeAmount,
                paymentMethod: "TIỀN MẶT TẠI CỬA HÀNG (POS CASH)",
                confirmedByStaffId: staffUserId,
                createdAtFormatted: dayjs().format("DD/MM/YYYY HH:mm:ss")
            };

            setSuccessData(receipt);
            message.success("Đã xác nhận thu tiền mặt và tạo đơn POS thành công!");

            // Reset form cho đơn tiếp theo
            form.resetFields();
            form.setFieldValue("branchId", branchId);
            setSelectedServiceIds([]);
            setSelectedStaffId(null);
            setSelectedSlot(null);
            setCashReceived(null);
            setAvailableSlots([]);
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message ?? "Đã xảy ra lỗi khi xử lý đơn POS.");
        } finally {
            setSubmitting(false);
        }
    };

    // Hàm in hóa đơn nhiệt K80 chuẩn máy in hóa đơn quầy (Print Thermal Receipt)
    const handlePrintThermalReceipt = () => {
        const printContent = thermalReceiptRef.current;
        if (!printContent) return;

        const printWindow = window.open("", "_blank", "width=400,height=600");
        printWindow.document.write(`
            <html>
                <head>
                    <title>In Hóa Đơn Nhiệt POS - SalonFlow</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            width: 78mm;
                            margin: 0 auto;
                            padding: 8px;
                            font-size: 12px;
                            color: #000;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 6px 0; }
                        .double-divider { border-top: 2px solid #000; margin: 6px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
                        th, td { text-align: left; padding: 2px 0; font-size: 11px; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 40 }}>
            {/* Header POS Banner */}
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
                                    Trạm POS Thu Tiền Mặt & Xếp Lịch Tại Quầy
                                </Title>
                                <Text style={{ color: "#8c8c8c", fontSize: 13 }}>
                                    Thu tiền mặt trực tiếp do Nhân viên {staffFullName} (ID: {staffUserId || "N/A"}) xác nhận
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Tag color="green" style={{ fontSize: 13, padding: "4px 12px", borderRadius: 20 }}>
                            ● POS CASH MODE READY
                        </Tag>
                    </Col>
                </Row>
            </Card>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ paymentMethod: "CASH" }}
            >
                <Row gutter={24}>
                    {/* LEFT PANEL: Selection Forms */}
                    <Col xs={24} lg={15}>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            {/* Card 1: Khách vãng lai & Chi nhánh */}
                            <Card
                                title={
                                    <Space>
                                        <UserOutlined style={{ color: "#1890ff" }} />
                                        <span>1. Thông Tin Khách Vãng Lai & Chi Nhánh</span>
                                    </Space>
                                }
                                style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Row gutter={16}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Chi nhánh làm việc"
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
                                                placeholder="Ví dụ: Anh Nam / Chị Minh"
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
                                        <Form.Item label="Ghi chú đơn hàng" name="note">
                                            <Input
                                                size="large"
                                                prefix={<FileTextOutlined style={{ color: "#bfbfbf" }} />}
                                                placeholder="Cắt ngắn 2p, sấy nếp..."
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Card 2: Dịch vụ & Stylist */}
                            <Card
                                title={
                                    <Space>
                                        <ScissorOutlined style={{ color: "#52c41a" }} />
                                        <span>2. Dịch Vụ Phục Vụ & Stylist Đảm Nhận</span>
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
                                        placeholder="Chọn các dịch vụ thực hiện..."
                                        onChange={loadAvailability}
                                        options={services.map((s) => ({
                                            value: s.id,
                                            label: `${s.name} - ${(s.price || 0).toLocaleString("vi-VN")} VND (${s.durationMinutes || s.duration || 30} phút)`
                                        }))}
                                    />
                                </Form.Item>

                                <Form.Item label="Stylist đảm nhận (Tùy chọn)" name="staffId">
                                    <Select
                                        size="large"
                                        allowClear
                                        placeholder="Tự động phân bổ Stylist trống"
                                        onChange={loadAvailability}
                                        options={staffs.map((s) => ({
                                            value: s.id,
                                            label: `Stylist: ${s.name}`
                                        }))}
                                    />
                                </Form.Item>
                            </Card>

                            {/* Card 3: Ngày & Giờ */}
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                                        <span>3. Ngày & Khung Giờ Khả Dụng</span>
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
                                            label="Khung giờ trống"
                                            name="startTime"
                                            rules={[{ required: true, message: "Chọn giờ" }]}
                                        >
                                            <Select
                                                size="large"
                                                placeholder="Chọn giờ bắt đầu"
                                                onChange={(val) => setSelectedSlot(val)}
                                                options={availableSlots}
                                                loading={loadingSlots}
                                                notFoundContent={
                                                    loadingSlots ? (
                                                        <Spin size="small" />
                                                    ) : (
                                                        <Text type="secondary">Chưa có khung giờ phù hợp</Text>
                                                    )
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Space>
                    </Col>

                    {/* RIGHT PANEL: Sticky POS Cash Counter Ticket */}
                    <Col xs={24} lg={9}>
                        <Card
                            title={
                                <Space justify="space-between" style={{ width: "100%" }}>
                                    <Space>
                                        <DollarOutlined style={{ color: "#52c41a" }} />
                                        <span>POS CASH COUNTER CART</span>
                                    </Space>
                                    <Tag color="green">TIỀN MẶT</Tag>
                                </Space>
                            }
                            style={{
                                borderRadius: 12,
                                border: "1px solid #b7eb8f",
                                background: "#f6ffed",
                                sticky: "top",
                                position: "sticky",
                                top: 20,
                                boxShadow: "0 4px 12px rgba(82, 196, 26, 0.15)"
                            }}
                        >
                            {/* Summary Branch & Staff Operator info */}
                            <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                <Row justify="space-between" style={{ marginBottom: 4 }}>
                                    <Text type="secondary">Thu ngân trực POS:</Text>
                                    <Text bold style={{ color: "#1890ff" }}>{staffFullName}</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text type="secondary">Chi nhánh:</Text>
                                    <Text bold>{selectedBranchObj?.name || "Chưa chọn"}</Text>
                                </Row>
                            </div>

                            {/* Itemized Services Breakdown */}
                            <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                                Dịch vụ thanh toán ({selectedServicesList.length}):
                            </Title>

                            {selectedServicesList.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "#bfbfbf" }}>
                                    <ScissorOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                                    <div>Chưa chọn dịch vụ</div>
                                </div>
                            ) : (
                                <div style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                    {selectedServicesList.map((item, idx) => (
                                        <Row key={item.id || idx} justify="space-between" align="middle" style={{ padding: "6px 0", borderBottom: idx < selectedServicesList.length - 1 ? "1px dashed #f0f0f0" : 0 }}>
                                            <Col span={14}>
                                                <Text style={{ fontSize: 13 }}>{item.name}</Text>
                                            </Col>
                                            <Col span={10} style={{ textAlign: "right" }}>
                                                <Text bold style={{ color: "#52c41a" }}>
                                                    {(item.price || 0).toLocaleString("vi-VN")} đ
                                                </Text>
                                            </Col>
                                        </Row>
                                    ))}
                                </div>
                            )}

                            <Divider style={{ margin: "12px 0" }} />

                            {/* Total Amount & Cash Change Calculator */}
                            <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                                <Text style={{ fontSize: 16, fontWeight: 700 }}>Tổng tiền phải thu:</Text>
                                <Text bold style={{ fontSize: 22, color: "#cf1322" }}>
                                    {totalPrice.toLocaleString("vi-VN")} VND
                                </Text>
                            </Row>

                            {/* Payment Method Selector */}
                            <div style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                                    Phương thức thanh toán POS:
                                </Text>
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={{ width: "100%" }}
                                >
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Radio value="CASH" style={{ background: "#fff", padding: "8px 12px", borderRadius: 6, width: "100%" }}>
                                            <Space>
                                                <DollarOutlined style={{ color: "#52c41a" }} />
                                                <span>Thanh toán tiền mặt tại quầy (Direct Cash)</span>
                                            </Space>
                                        </Radio>
                                    </Space>
                                </Radio.Group>
                            </div>

                            {/* Input Tiền Khách Đưa & Tự Tính Tiền Thừa */}
                            <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 20 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: 600 }}>Tiền khách đưa (VND):</Text>
                                    <InputNumber
                                        size="large"
                                        style={{ width: "100%", marginTop: 4 }}
                                        formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                        parser={(val) => val.replace(/\$\s?|(,*)/g, "")}
                                        placeholder={`Gợi ý: ${totalPrice.toLocaleString("vi-VN")}`}
                                        value={cashReceived}
                                        onChange={(val) => setCashReceived(val)}
                                        min={0}
                                    />
                                </div>
                                <Row justify="space-between" align="middle">
                                    <Text type="secondary">Tiền thừa trả khách:</Text>
                                    <Text bold style={{ fontSize: 16, color: changeAmount >= 0 ? "#52c41a" : "#ff4d4f" }}>
                                        {changeAmount.toLocaleString("vi-VN")} VND
                                    </Text>
                                </Row>
                            </div>

                            {/* Button Xác Nhận Thu Tiền Mặt */}
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                block
                                icon={<SafetyCertificateOutlined />}
                                style={{
                                    height: 50,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: "#52c41a",
                                    borderColor: "#52c41a",
                                    boxShadow: "0 4px 12px rgba(82, 196, 26, 0.35)"
                                }}
                            >
                                XÁC NHẬN ĐÃ THU TIỀN MẶT
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Form>

            {/* Thermal Receipt Print Modal (Chuẩn Máy In Hóa Đơn Nhiệt K80 80mm) */}
            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 22 }} />
                        <span>XÁC NHẬN THU TIỀN MẶT & TẠO ĐƠN POS THÀNH CÔNG!</span>
                    </Space>
                }
                open={!!successData}
                onCancel={() => setSuccessData(null)}
                footer={[
                    <Button key="checkout" icon={<QrcodeOutlined />} style={{ color: "#fa8c16", borderColor: "#fa8c16" }} onClick={() => navigate(`/manager/checkout/${successData?.bookingId}`)}>
                        Trang Checkout (VietQR)
                    </Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintThermalReceipt} style={{ background: "#1890ff" }}>
                        In Hóa Đơn (K80)
                    </Button>,
                    <Button key="new" icon={<PlusOutlined />} onClick={() => setSuccessData(null)}>
                        Tạo Đơn Mới
                    </Button>
                ]}
                width={480}
            >
                {successData && (
                    <div>
                        <Card size="small" style={{ background: "#f6ffed", borderColor: "#b7eb8f", marginBottom: 16 }}>
                            <Row justify="space-between">
                                <Text type="secondary">Trạng thái thanh toán:</Text>
                                <Tag color="green">● ĐÃ XÁC NHẬN THU TIỀN MẶT (PAID)</Tag>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Staff xác nhận (Confirmed By):</Text>
                                <Text bold>{successData.staffOperatorName} (ID: {successData.confirmedByStaffId})</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Mã giao dịch Payment:</Text>
                                <Text bold style={{ color: "#52c41a" }}>#{successData.paymentId}</Text>
                            </Row>
                        </Card>

                        {/* Hidden Printable Thermal K80 Container */}
                        <div ref={thermalReceiptRef} style={{ background: "#fff", padding: 12, border: "1px solid #d9d9d9", borderRadius: 8 }}>
                            <div className="text-center bold" style={{ fontSize: 16, marginBottom: 2 }}>
                                {successData.branchName}
                            </div>
                            <div className="text-center" style={{ fontSize: 11, marginBottom: 6 }}>
                                {successData.branchAddress}
                            </div>
                            <div className="text-center bold" style={{ fontSize: 14, marginBottom: 4 }}>
                                HÓA ĐƠN THU TIỀN MẶT POS
                            </div>
                            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

                            <div><strong>Mã đơn:</strong> #{successData.bookingId}</div>
                            <div><strong>Thời gian:</strong> {successData.time} - {successData.date}</div>
                            <div><strong>Khách hàng:</strong> {successData.customerName} ({successData.customerPhone})</div>
                            <div><strong>Thu ngân:</strong> {successData.staffOperatorName}</div>
                            <div><strong>Stylist:</strong> {successData.assignedStaffName}</div>

                            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

                            <table style={{ width: "100%", fontSize: 11 }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #000" }}>
                                        <th style={{ textAlign: "left" }}>Dịch vụ</th>
                                        <th style={{ textAlign: "right" }}>Giá tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {successData.services.map((item, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: "3px 0" }}>{item.name}</td>
                                            <td style={{ textAlign: "right", padding: "3px 0" }}>
                                                {(item.price || 0).toLocaleString("vi-VN")} đ
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

                            <div style={{ display: "flex", justify: "space-between", fontWeight: "bold", fontSize: 13 }}>
                                <span>TỔNG CỘNG:</span>
                                <span>{successData.totalPrice.toLocaleString("vi-VN")} VND</span>
                            </div>
                            <div style={{ display: "flex", justify: "space-between", fontSize: 11 }}>
                                <span>Tiền khách đưa:</span>
                                <span>{successData.cashReceived.toLocaleString("vi-VN")} VND</span>
                            </div>
                            <div style={{ display: "flex", justify: "space-between", fontSize: 11 }}>
                                <span>Tiền thừa trả khách:</span>
                                <span>{successData.changeAmount.toLocaleString("vi-VN")} VND</span>
                            </div>

                            <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />
                            <div className="text-center" style={{ fontSize: 11, fontStyle: "italic" }}>
                                Chân thành cảm ơn & Hẹn gặp lại quý khách!
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}