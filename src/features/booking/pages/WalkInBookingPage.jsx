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
    QrcodeOutlined,
    ThunderboltOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getServicesByBranchApi, getBundlesByBranchApi } from "@/features/service/api/serviceApi";
import {
    createWalkInBookingApi,
    getAvailabilityApi,
} from "../api/bookingApi";
import { getAvailabilitySlots } from "@/features/shift/api/shiftApi";
import { processPosCashPaymentApi } from "@/features/payment/api/paymentApi";
import StepServiceSelection from "../components/StepServiceSelection";

import offdayApi from "@/features/offday/api/offdayApi";

const { Title, Text } = Typography;

export default function WalkInBookingPage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const thermalReceiptRef = useRef(null);

    const [systemOffDays, setSystemOffDays] = useState([]);

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(null);

    const [staffs, setStaffs] = useState([]);
    const [workingStaffIds, setWorkingStaffIds] = useState([]);
    const [services, setServices] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [bookingType, setBookingType] = useState("service");
    const [selectedBundle, setSelectedBundle] = useState(null);

    const [availableSlots, setAvailableSlots] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [availableTimeSet, setAvailableTimeSet] = useState(new Set());
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic Selected State for POS Summary Cart
    const watchedCustomerName = Form.useWatch("customerName", form);
    const watchedCustomerPhone = Form.useWatch("customerPhone", form);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("CASH");

    // Cash Given by Customer for POS Cash Payment Change Calculation
    const [cashReceived, setCashReceived] = useState(null);

    // Success State including Thermal Receipt Data & Payment Record Info
    const [successData, setSuccessData] = useState(null);

    const staffUsername = localStorage.getItem("username") || "Staff";
    const staffUserId = localStorage.getItem("userId");

    const currentUserStaffObj = useMemo(() => {
        if (!staffUserId || staffs.length === 0) return null;
        return staffs.find(s => String(s.userId) === String(staffUserId) || String(s.id) === String(staffUserId));
    }, [staffs, staffUserId]);

    const staffFullName = useMemo(() => {
        if (currentUserStaffObj?.name && currentUserStaffObj.name.trim()) {
            return currentUserStaffObj.name.trim();
        }

        const rawName =
            localStorage.getItem("fullName") ||
            JSON.parse(localStorage.getItem("user") || "{}")?.fullName ||
            JSON.parse(localStorage.getItem("auth") || "{}")?.fullName ||
            localStorage.getItem("username") ||
            "Nhân viên POS";

        if (rawName.includes("@")) {
            const usernamePart = rawName.split("@")[0];
            return usernamePart.replace(".", " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        }
        return rawName;
    }, [currentUserStaffObj, staffs]);

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
                form.setFieldValue("bookingDate", dayjs());
                await loadData(first.id);
            }
        } catch (e) {
            console.error(e);
            message.error("Không lấy được danh sách chi nhánh.");
        }
    };

    const loadData = async (id) => {
        try {
            const today = dayjs();
            const todayStr = today.format("YYYY-MM-DD");
            const nextRangeStr = dayjs().add(90, "day").format("YYYY-MM-DD");
            const [staffData, serviceData, bundlesData, offDaysData, slotsData] = await Promise.all([
                getStaffByBranchApi(id),
                getServicesByBranchApi(id),
                getBundlesByBranchApi(id, true).catch(() => []),
                offdayApi.getOffDaysForBranchRange(id, todayStr, nextRangeStr).catch(() => []),
                getAvailabilitySlots(id, todayStr).catch(() => [])
            ]);
            setStaffs(staffData || []);
            setServices(serviceData || []);
            setBundles(bundlesData || []);
            setSystemOffDays(Array.isArray(offDaysData) ? offDaysData : []);

            const userIds = [...new Set((slotsData || []).map(s => s.userId || s.staffId))];
            setWorkingStaffIds(userIds);
        } catch (e) {
            console.error(e);
            message.error("Không tải được dữ liệu nhân viên hoặc dịch vụ.");
        }
    };

    const fetchWorkingStaff = async (bId, targetDate) => {
        const dateObj = targetDate || dayjs();
        if (!bId) {
            setWorkingStaffIds([]);
            return;
        }
        try {
            const dateStr = dateObj.format("YYYY-MM-DD");
            const slots = await getAvailabilitySlots(bId, dateStr);
            const userIds = [...new Set((slots || []).map(s => s.userId || s.staffId))];
            setWorkingStaffIds(userIds);
        } catch (error) {
            console.error("Lỗi khi tải lịch làm việc của nhân viên:", error);
            setWorkingStaffIds([]);
        }
    };

    const handleBranchChange = async (id) => {
        setBranchId(id);
        setSelectedServiceIds([]);
        setSelectedBundle(null);
        setSelectedStaffId(null);
        setSelectedSlot(null);
        setAvailableSlots([]);

        form.setFieldsValue({
            staffId: undefined,
            serviceIds: undefined,
            bookingDate: dayjs(),
            startTime: undefined,
        });

        await loadData(id);
    };

    const handleBookingTypeChange = (type) => {
        setBookingType(type);
        setSelectedBundle(null);
        setSelectedServiceIds([]);
        form.setFieldValue("serviceIds", undefined);
        loadAvailability([], selectedStaffId);
    };

    const handleSetSelectedServices = (newServices) => {
        const ids = newServices.map(s => s.id);
        setSelectedServiceIds(ids);
        form.setFieldValue("serviceIds", ids.length > 0 ? ids : undefined);
        form.validateFields(["serviceIds"]);
        loadAvailability(ids, selectedStaffId);
    };

    const handleSetSelectedBundle = (bundle) => {
        if (!bundle || selectedBundle?.id === bundle.id) {
            setSelectedBundle(null);
            setSelectedServiceIds([]);
            form.setFieldValue("serviceIds", undefined);
            form.validateFields(["serviceIds"]);
            loadAvailability([], selectedStaffId);
        } else {
            setSelectedBundle(bundle);
            const bundleServiceIds = (bundle.items || []).map(i => i.serviceId || i.id);
            setSelectedServiceIds(bundleServiceIds);
            form.setFieldValue("serviceIds", bundleServiceIds.length > 0 ? bundleServiceIds : undefined);
            form.validateFields(["serviceIds"]);
            loadAvailability(bundleServiceIds, selectedStaffId);
        }
    };

    const generateAllSlotsForDay = (openTimeStr = "08:00", closeTimeStr = "19:00") => {
        const slots = [];
        const open = openTimeStr.length === 5 ? `${openTimeStr}:00` : openTimeStr;
        const close = closeTimeStr.length === 5 ? `${closeTimeStr}:00` : closeTimeStr;

        let current = dayjs(`2020-01-01T${open}`);
        const end = dayjs(`2020-01-01T${close}`);

        while (current.isBefore(end)) {
            const val = current.format("HH:mm:ss");
            const lbl = current.format("HH:mm");
            slots.push({ value: val, label: lbl });
            current = current.add(15, "minute");
        }
        return slots;
    };

    const handleSelectSlot = (slotValue) => {
        form.setFieldValue("startTime", slotValue);
        setSelectedSlot(slotValue);
        form.validateFields(["startTime"]);
    };

    const handleSelectEarliestSlot = () => {
        if (availableSlots && availableSlots.length > 0) {
            handleSelectSlot(availableSlots[0].value);
            message.success(`Đã chọn khung giờ sớm nhất (${availableSlots[0].label})!`);
        }
    };

    const loadAvailability = async (overrideServiceIds, overrideStaffId, overrideDate) => {
        const values = form.getFieldsValue();
        const currentServiceIds = overrideServiceIds !== undefined ? overrideServiceIds : (values.serviceIds || []);
        const currentStaffId = overrideStaffId !== undefined ? overrideStaffId : values.staffId;
        const currentDate = overrideDate || values.bookingDate || dayjs();

        if (!form.getFieldValue("bookingDate")) {
            form.setFieldValue("bookingDate", currentDate);
        }

        setSelectedServiceIds(currentServiceIds);
        setSelectedStaffId(currentStaffId);

        if (
            !branchId ||
            !currentDate ||
            currentServiceIds.length === 0
        ) {
            setAvailableSlots([]);
            setAllSlots([]);
            setAvailableTimeSet(new Set());
            form.setFieldValue("startTime", undefined);
            setSelectedSlot(null);
            return;
        }

        try {
            setLoadingSlots(true);
            const response = await getAvailabilityApi(branchId, {
                date: currentDate.format("YYYY-MM-DD"),
                serviceIds: currentServiceIds,
                staffId: currentStaffId,
            });

            const rawTimes = response.availableStartTimes || [];
            const openT = response.openTime || "08:00:00";
            const closeT = response.closeTime || "19:00:00";

            const timeSet = new Set(rawTimes.map(t => t.substring(0, 5)));
            setAvailableTimeSet(timeSet);

            const generatedSlots = generateAllSlotsForDay(openT, closeT);
            setAllSlots(generatedSlots);

            const now = dayjs();
            const targetDateStr = currentDate.format("YYYY-MM-DD");
            const isToday = targetDateStr === now.format("YYYY-MM-DD");

            const validAvailable = generatedSlots.filter(s => {
                const isAvail = timeSet.has(s.label);
                if (!isAvail) return false;
                if (isToday) {
                    const slotDateTime = dayjs(`${targetDateStr}T${s.label}:00`);
                    if (!slotDateTime.isValid() || !slotDateTime.isAfter(now.subtract(5, "minute"))) {
                        return false;
                    }
                }
                return true;
            });

            setAvailableSlots(validAvailable);

            // Do NOT auto pick slot: reset startTime and selectedSlot on new availability fetch
            const currentSlotInForm = form.getFieldValue("startTime");
            const isStillValid = validAvailable.some(s => s.value === currentSlotInForm || s.label === currentSlotInForm);
            if (!currentSlotInForm || !isStillValid) {
                form.setFieldValue("startTime", undefined);
                setSelectedSlot(null);
            }
        } catch (e) {
            console.error(e);
            setAvailableSlots([]);
            setAllSlots([]);
            setAvailableTimeSet(new Set());
            form.setFieldValue("startTime", undefined);
            setSelectedSlot(null);
        } finally {
            setLoadingSlots(false);
        }
    };

    // Selected Services Data Objects for Cart Summary
    const selectedServicesList = useMemo(() => {
        if (bookingType === "bundle" && selectedBundle) {
            return selectedBundle.items?.map(i => ({
                id: i.serviceId || i.id,
                name: i.name || i.serviceName,
                price: i.price || 0,
                durationMinutes: i.durationMinutes || i.duration || 0
            })) || [];
        }
        return services.filter(s => selectedServiceIds.includes(s.id));
    }, [services, selectedServiceIds, bookingType, selectedBundle]);

    // Trích xuất danh mục dịch vụ / chuyên môn của Stylist để hiển thị thay cho SĐT
    const getStaffServiceTags = (staff) => {
        if (staff.specialties && staff.specialties.trim()) {
            return staff.specialties.trim();
        }
        const cats = [...new Set((staff.services || []).map(srv => srv.categoryName || srv.name).filter(Boolean))];
        if (cats.length > 0) {
            return cats.join(", ");
        }
        return "Tất cả dịch vụ";
    };

    // Lọc danh sách nhân viên có quyền thực hiện các dịch vụ đã chọn & có lịch làm việc trong ngày
    const qualifiedStaffs = useMemo(() => {
        const requiredServiceIds = selectedServicesList.map(s => s.id);

        return staffs.filter(staff => {
            // 1. Kiểm tra kỹ năng / quyền thực hiện tất cả dịch vụ đã chọn
            if (requiredServiceIds.length > 0) {
                const allowedIds = (staff.services || []).map(s => s.id);
                const hasSkill = requiredServiceIds.every(id => allowedIds.includes(id));
                if (!hasSkill) return false;
            }

            // 2. Kiểm tra lịch làm việc trong ngày đã chọn
            const isWorking = workingStaffIds.includes(staff.userId) || workingStaffIds.includes(staff.id);
            if (!isWorking) return false;

            return true;
        });
    }, [staffs, selectedServicesList, workingStaffIds]);

    // Tự động bỏ chọn nhân viên nếu không còn đủ điều kiện/lịch làm việc
    useEffect(() => {
        if (selectedStaffId) {
            const isStillQualified = qualifiedStaffs.some(s => s.id === selectedStaffId || s.userId === selectedStaffId);
            if (!isStillQualified) {
                setSelectedStaffId(null);
                form.setFieldValue("staffId", undefined);
                loadAvailability(selectedServiceIds, undefined);
            }
        }
    }, [qualifiedStaffs, selectedStaffId, selectedServiceIds, form]);

    const totalPrice = useMemo(() => {
        if (bookingType === "bundle" && selectedBundle) {
            return parseFloat(selectedBundle.price || 0);
        }
        return selectedServicesList.reduce((sum, item) => sum + (item.price || 0), 0);
    }, [selectedServicesList, bookingType, selectedBundle]);

    const totalDuration = useMemo(() => {
        if (bookingType === "bundle" && selectedBundle) {
            return selectedBundle.totalDurationMinutes || selectedServicesList.reduce((sum, item) => sum + (item.durationMinutes || item.duration || 0), 0);
        }
        return selectedServicesList.reduce((sum, item) => sum + (item.durationMinutes || item.duration || 0), 0);
    }, [selectedServicesList, bookingType, selectedBundle]);

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

            const finalStaffId = (values.staffId === "ANY" || !values.staffId) ? null : values.staffId;

            // 1. Tạo đơn Đặt lịch Walk-in tại quầy
            const payload = {
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                preferredStaffId: finalStaffId,
                staffId: finalStaffId,
                bookingDate: values.bookingDate.format("YYYY-MM-DD"),
                startTime: values.startTime,
                serviceIds: values.serviceIds,
                notes: values.note || values.notes || "",
            };

            await createWalkInBookingApi(branchId, payload);

            message.success("Đã tạo lịch hẹn thành công! Đã chuyển sang màn Check-in & Phục vụ.");

            // Reset form cho đơn tiếp theo
            form.resetFields();
            form.setFieldValue("branchId", branchId);
            setSelectedServiceIds([]);
            setSelectedBundle(null);
            setBookingType("service");
            setSelectedStaffId(null);
            setSelectedSlot(null);
            setCashReceived(null);
            setAvailableSlots([]);

            // Chuyển sang màn hình Check-in & Phục vụ
            navigate("/manager/bookings");
        } catch (e) {
            console.error(e);
            message.error(e?.response?.data?.message ?? "Đã xảy ra lỗi khi tạo đặt lịch tại quầy.");
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
                                    Đặt Lịch & Thu Tiền Tại Quầy (POS)
                                </Title>
                                <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                                    Nhân viên thực hiện: {staffFullName}
                                </Text>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ paymentMethod: "CASH", bookingDate: dayjs() }}
            >
                <Row gutter={24}>
                    {/* LEFT PANEL: Selection Forms */}
                    <Col xs={24} lg={15}>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            {/* Card 1: Thông tin khách */}
                            <Card
                                title={
                                    <Space>
                                        <UserOutlined style={{ color: "#1890ff" }} />
                                        <span>1. Thông Tin Khách</span>
                                    </Space>
                                }
                                style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Row gutter={16}>
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

                                    <Col xs={24}>
                                        <Form.Item label="Ghi chú đơn hàng" name="note" style={{ marginBottom: 0 }}>
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
                                    name="serviceIds"
                                    rules={[{ required: true, message: "Hãy chọn ít nhất 1 dịch vụ" }]}
                                    style={{ marginBottom: 24 }}
                                >
                                    <StepServiceSelection
                                        bookingType={bookingType}
                                        setBookingType={handleBookingTypeChange}
                                        services={services}
                                        selectedServices={selectedServicesList}
                                        setSelectedServices={handleSetSelectedServices}
                                        bundles={bundles}
                                        selectedBundle={selectedBundle}
                                        setSelectedBundle={handleSetSelectedBundle}
                                    />
                                </Form.Item>

                                <Form.Item label="Stylist đảm nhận (Tùy chọn)" name="staffId" style={{ marginTop: 16 }}>
                                    <Select
                                        size="large"
                                        allowClear
                                        placeholder="Tự động phân bổ Stylist trống"
                                        onChange={(val) => {
                                            const actualId = (val === "ANY" || !val) ? null : val;
                                            loadAvailability(undefined, actualId);
                                        }}
                                        options={[
                                            {
                                                value: "ANY",
                                                label: "Bất kỳ nhân viên nào (Tự động phân bổ)"
                                            },
                                            ...qualifiedStaffs.map((s) => {
                                                const serviceTags = getStaffServiceTags(s);
                                                return {
                                                    value: s.id,
                                                    label: `Stylist: ${s.name} ${serviceTags ? `(${serviceTags})` : ""}`
                                                };
                                            })
                                        ]}
                                        notFoundContent={
                                            <Text type="secondary">
                                                {selectedServicesList.length === 0
                                                    ? "Chưa chọn dịch vụ"
                                                    : "Không có Stylist đáp ứng dịch vụ & lịch làm việc"}
                                            </Text>
                                        }
                                    />
                                </Form.Item>
                            </Card>

                            {/* Card 3: Khung Giờ Khả Dụng */}
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined style={{ color: "#fa8c16" }} />
                                        <span>3. Khung Giờ Khả Dụng (Hôm Nay)</span>
                                    </Space>
                                }
                                style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                            >
                                <Form.Item name="bookingDate" noStyle initialValue={dayjs()}>
                                    <Input type="hidden" />
                                </Form.Item>
                                <Form.Item
                                    name="startTime"
                                    noStyle
                                    rules={[{ required: true, message: "Vui lòng chọn khung giờ thực hiện" }]}
                                >
                                    <Input type="hidden" />
                                </Form.Item>

                                <Row gutter={16}>
                                    {systemOffDays.length > 0 && (
                                        <Col span={24} style={{ marginBottom: 12 }}>
                                            <div style={{ padding: '8px 12px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8 }}>
                                                <Text strong style={{ color: '#d46b08', fontSize: 13 }}>📢 Thông báo Ngày nghỉ lễ / Đóng cửa:</Text>
                                                {systemOffDays.map(off => (
                                                    <div key={off.id} style={{ fontSize: 12, color: '#8c6b00', marginTop: 2 }}>
                                                        • <b>{off.title}</b> ({dayjs(off.dateFrom).format("DD/MM/YYYY")} ➔ {dayjs(off.dateTo).format("DD/MM/YYYY")})
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>
                                    )}

                                    {/* Status Notice Banner & ASAP Quick Action Button */}
                                    <Col span={24} style={{ marginBottom: 12 }}>
                                        {selectedServicesList.length === 0 ? (
                                            <div style={{ padding: "12px 16px", background: "#f5f5f5", borderRadius: 8, border: "1px solid #d9d9d9" }}>
                                                <Text type="secondary">👉 Vui lòng chọn ít nhất 1 dịch vụ ở Bước 2 để hiển thị khung giờ khả dụng.</Text>
                                            </div>
                                        ) : loadingSlots ? (
                                            <div style={{ padding: "12px 16px", background: "#f0f5ff", borderRadius: 8, border: "1px solid #adc6ff", display: "flex", alignItems: "center", gap: 10 }}>
                                                <Spin size="small" />
                                                <Text type="secondary">Đang quét ca làm việc & khung giờ rảnh hôm nay...</Text>
                                            </div>
                                        ) : availableSlots.length > 0 ? (
                                            <div style={{ padding: "14px 18px", background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                                                <div>
                                                    <Text strong style={{ color: "#389e0d", fontSize: 14 }}>
                                                        {selectedStaffObj ? `🎯 Stylist chỉ định: ${selectedStaffObj.name}` : "✨ Tự động phân bổ thợ rảnh khả dụng"}
                                                    </Text>
                                                    <br />
                                                    <Text style={{ fontSize: 13, color: "#262626" }}>
                                                        🟢 Khung giờ sớm nhất hôm nay: <b style={{ color: "#52c41a", fontSize: 17 }}>{availableSlots[0].label}</b>
                                                    </Text>
                                                </div>
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a", borderRadius: 8, fontWeight: 600 }}
                                                    icon={<ThunderboltOutlined />}
                                                    onClick={handleSelectEarliestSlot}
                                                >
                                                    Phục vụ ngay
                                                </Button>
                                            </div>
                                        ) : (
                                            <div style={{ padding: "12px 16px", background: "#fff2f0", border: "1px solid #ffccc7", borderRadius: 8 }}>
                                                <Text type="danger" strong>
                                                    🔴 {selectedStaffObj ? `Stylist ${selectedStaffObj.name} hiện đã kín lịch hôm nay.` : "Salon đã kín tất cả các khung giờ khả dụng hôm nay."}
                                                </Text>
                                            </div>
                                        )}
                                    </Col>

                                    {/* Interactive Time Chips Grid showing all slots for the day */}
                                    {selectedServicesList.length > 0 && allSlots.length > 0 && (
                                        <Col span={24}>
                                            <Text strong style={{ fontSize: 14, display: "block", marginBottom: 12, color: "#262626" }}>
                                                Chọn khung giờ thực hiện hôm nay:
                                            </Text>
                                            <Space wrap size={[10, 10]}>
                                                {allSlots.map((slot) => {
                                                    const now = dayjs();
                                                    const targetDateStr = dayjs().format("YYYY-MM-DD");
                                                    const slotDateTime = dayjs(`${targetDateStr}T${slot.label}:00`);

                                                    const isPast = slotDateTime.isValid() && !slotDateTime.isAfter(now.subtract(5, "minute"));
                                                    const isAvailable = availableTimeSet.has(slot.label);
                                                    const isDisabled = isPast || !isAvailable;

                                                    const isSelected = Boolean(selectedSlot) && (selectedSlot === slot.value || selectedSlot === slot.label) && !isDisabled;
                                                    const isEarliest = availableSlots.length > 0 && (availableSlots[0].value === slot.value || availableSlots[0].label === slot.label);

                                                    if (isDisabled) {
                                                        return (
                                                            <Button
                                                                key={slot.value}
                                                                disabled
                                                                size="large"
                                                                style={{
                                                                    borderRadius: 8,
                                                                    fontWeight: 400,
                                                                    borderColor: "#d9d9d9",
                                                                    backgroundColor: isPast ? "#f5f5f5" : "#fafafa",
                                                                    color: "#bfbfbf",
                                                                    cursor: "not-allowed",
                                                                    minWidth: 72
                                                                }}
                                                                title={isPast ? "Khung giờ đã qua trong ngày" : "Khung giờ không khả dụng (Đã kín lịch)"}
                                                            >
                                                                {slot.label}
                                                            </Button>
                                                        );
                                                    }

                                                    return (
                                                        <Button
                                                            key={slot.value}
                                                            type={isSelected ? "primary" : "default"}
                                                            size="large"
                                                            style={{
                                                                borderRadius: 8,
                                                                fontWeight: isSelected ? 600 : 500,
                                                                borderColor: isSelected ? "#1890ff" : "#b7eb8f",
                                                                color: isSelected ? "#fff" : "#389e0d",
                                                                backgroundColor: isSelected ? "#1890ff" : "#f6ffed",
                                                                boxShadow: isSelected ? "0 2px 6px rgba(24,144,255,0.25)" : "none",
                                                                minWidth: 72
                                                            }}
                                                            onClick={() => handleSelectSlot(slot.value)}
                                                        >
                                                            {slot.label}
                                                        </Button>
                                                    );
                                                })}
                                            </Space>
                                        </Col>
                                    )}
                                </Row>
                            </Card>
                        </Space>
                    </Col>

                    {/* RIGHT PANEL: Sticky Walk-in Booking Ticket */}
                    <Col xs={24} lg={9}>
                        <Card
                            title={
                                <Space align="center">
                                    <CalendarOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                                    <span style={{ fontWeight: 700, fontSize: 15, color: "#002c8c" }}>THÔNG TIN ĐẶT LỊCH</span>
                                </Space>
                            }
                            style={{
                                borderRadius: 12,
                                border: "1px solid #91caff",
                                background: "#f0f5ff",
                                sticky: "top",
                                position: "sticky",
                                top: 20,
                                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.15)"
                            }}
                        >
                            {/* Summary Branch, Staff & Customer info */}
                            <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
                                    <Text type="secondary">Tên khách hàng:</Text>
                                    <Text bold style={{ color: "#262626" }}>
                                        {watchedCustomerName ? watchedCustomerName : <Text type="secondary" italic>Chưa nhập tên</Text>}
                                    </Text>
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
                                    <Text type="secondary">Số điện thoại:</Text>
                                    <Text bold style={{ color: "#262626" }}>
                                        {watchedCustomerPhone ? watchedCustomerPhone : <Text type="secondary" italic>Chưa nhập SĐT</Text>}
                                    </Text>
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
                                    <Text type="secondary">Stylist đảm nhận:</Text>
                                    <Text bold style={{ color: selectedStaffObj ? "#722ed1" : "#595959" }}>
                                        {selectedStaffObj ? selectedStaffObj.name : "Nhân viên ngẫu nhiên"}
                                    </Text>
                                </Row>
                                <Row justify="space-between" align="middle" style={{ marginBottom: 6 }}>
                                    <Text type="secondary">Nhân viên tiếp đón:</Text>
                                    <Text bold style={{ color: "#1890ff" }}>{staffFullName}</Text>
                                </Row>
                                <Row justify="space-between" align="middle">
                                    <Text type="secondary">Chi nhánh:</Text>
                                    <Text bold>{selectedBranchObj?.name || "Chưa chọn"}</Text>
                                </Row>
                            </div>

                            {/* Itemized Services Breakdown */}
                            <Title level={5} style={{ fontSize: 14, marginBottom: 8 }}>
                                Dịch vụ đăng ký ({selectedServicesList.length}):
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
                                                <Text bold style={{ color: "#1890ff" }}>
                                                    {(item.price || 0).toLocaleString("vi-VN")} đ
                                                </Text>
                                            </Col>
                                        </Row>
                                    ))}
                                </div>
                            )}

                            <Divider style={{ margin: "12px 0" }} />

                            {/* Total Amount Summary */}
                            <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 15, fontWeight: 600 }}>Dự kiến giá tiền:</Text>
                                <Text bold style={{ fontSize: 20, color: "#1890ff" }}>
                                    {totalPrice.toLocaleString("vi-VN")} VND
                                </Text>
                            </Row>

                            <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, marginBottom: 20, textAlign: "center" }}>
                                <Text type="secondary" style={{ fontSize: 13, display: "block" }}>
                                    🕒 Khách sẽ thanh toán tại màn hình Check-in & Phục vụ sau khi hoàn tất dịch vụ.
                                </Text>
                            </div>

                            {/* Button Xác Nhận Đặt Lịch Tại Quầy */}
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                block
                                icon={<CheckCircleOutlined />}
                                style={{
                                    height: 50,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: "#1890ff",
                                    borderColor: "#1890ff",
                                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.35)"
                                }}
                            >
                                XÁC NHẬN ĐẶT LỊCH TẠI QUẦY
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