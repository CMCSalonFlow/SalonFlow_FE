import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Steps, Select, Button, Typography, Row, Col, Space, Divider, DatePicker, message, Spin, Grid, Radio, Avatar, Tag, Input } from "antd";
import { ShopOutlined, AppstoreOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined, SmileOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getPublicBranchesApi } from "@/features/branch/api/branchApi";
import { getPublicSalonsApi } from "@/features/salon/api/salonApi";
import { getServicesByBranchApi, getBundlesByBranchApi } from "@/features/service/api/serviceApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getAvailabilityApi, createBookingApi } from "../api/bookingApi";
import { createPaymentUrlApi } from "@/features/payment/api/paymentApi";
import { getAvailabilitySlots } from "@/features/shift/api/shiftApi";
import { API_BASE_URL } from "@/core/api/endpoints";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

/**
 * Trang Đặt lịch hẹn dành cho Khách hàng (BookingPage).
 * Triển khai quy trình Step Wizard 3 bước: Chọn Dịch vụ -> Chọn Thợ & Ngày -> Chọn Giờ & Đặt lịch.
 */
export default function BookingPage() {
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("PAY_AT_COUNTER");

    // Dữ liệu nguồn
    const [salons, setSalons] = useState([]);
    const [selectedSalonId, setSelectedSalonId] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [services, setServices] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [staffList, setStaffList] = useState([]);

    // Lựa chọn của khách hàng
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [bookingType, setBookingType] = useState("service"); // "service" hoặc "bundle"

    const [selectedStaff, setSelectedStaff] = useState(null); // null = "Bất kỳ nhân viên"
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [notes, setNotes] = useState("");

    // Khung giờ rảnh
    const [availableTimes, setAvailableTimes] = useState([]);
    const [openTime, setOpenTime] = useState(null);
    const [closeTime, setCloseTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [workingStaffIds, setWorkingStaffIds] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // WebSocket listener for real-time slot updates
    useEffect(() => {
        let socket = null;
        let reconnectTimer = null;

        const connectWS = () => {
            const wsBase = API_BASE_URL.replace(/^http/, "ws");
            const socketUrl = `${wsBase}/ws/bookings`;

            socket = new WebSocket(socketUrl);

            socket.onopen = () => {
                console.log("WebSocket connected to bookings room.");
            };

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === "BOOKING_UPDATE") {
                        console.log("Booking update notification received:", msg);
                        const matchBranch = String(msg.branchId) === String(selectedBranchId);
                        const matchDate = selectedDate && msg.date === selectedDate.format("YYYY-MM-DD");
                        const matchStaff = !selectedStaff || !msg.staffId || String(msg.staffId) === String(selectedStaff.id);

                        if (matchBranch && matchDate && matchStaff) {
                            console.log("Refreshing availability slots...");
                            setRefreshCounter(prev => prev + 1);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing WebSocket message:", e);
                }
            };

            socket.onclose = () => {
                console.log("WebSocket connection closed. Reconnecting in 3s...");
                reconnectTimer = setTimeout(connectWS, 3000);
            };

            socket.onerror = (err) => {
                console.error("WebSocket error:", err);
                socket.close();
            };
        };

        connectWS();

        return () => {
            if (socket) {
                socket.onclose = null;
                socket.close();
            }
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, [selectedBranchId, selectedDate, selectedStaff]);

    // 1. Tải danh sách Salon khi vào trang
    useEffect(() => {
        const loadSalons = async () => {
            try {
                setLoading(true);
                const data = await getPublicSalonsApi();
                setSalons(data);
                // Bỏ tự động chọn salon đầu tiên để bắt người dùng phải chọn thủ công
            } catch {
                message.error("Không thể tải danh sách Salon.");
            } finally {
                setLoading(false);
            }
        };
        loadSalons();
    }, []);

    // 2. Tải danh sách chi nhánh khi thay đổi Salon
    useEffect(() => {
        if (!selectedSalonId) return;

        const loadBranches = async () => {
            try {
                setLoading(true);
                const data = await getPublicBranchesApi(selectedSalonId);
                setBranches(data);
                // Bỏ tự động chọn chi nhánh đầu tiên, bắt chọn thủ công
                setSelectedBranchId(null);
            } catch {
                message.error("Lỗi tải danh sách chi nhánh của Salon này.");
            } finally {
                setLoading(false);
            }
        };

        loadBranches();
    }, [selectedSalonId]);

    // 2. Tải thông tin dịch vụ, combo và nhân viên khi thay đổi chi nhánh
    useEffect(() => {
        if (!selectedBranchId) return;

        const loadBranchData = async () => {
            try {
                setLoading(true);
                // Reset các lựa chọn cũ
                setSelectedServices([]);
                setSelectedBundle(null);
                setSelectedStaff(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setAvailableTimes([]);

                const [servicesData, bundlesData, staffData] = await Promise.all([
                    getServicesByBranchApi(selectedBranchId),
                    getBundlesByBranchApi(selectedBranchId, true), // Chỉ lấy combo đang hoạt động
                    getStaffByBranchApi(selectedBranchId)
                ]);

                setServices(servicesData.filter(s => s.isActive));
                setBundles(bundlesData);
                setStaffList(staffData);
            } catch {
                message.error("Lỗi tải thông tin dịch vụ và nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        loadBranchData();
    }, [selectedBranchId]);

    // Tải danh sách nhân viên làm việc vào ngày đã chọn
    useEffect(() => {
        if (!selectedBranchId || !selectedDate) {
            setWorkingStaffIds([]);
            return;
        }

        const fetchWorkingStaff = async () => {
            try {
                setLoadingStaff(true);
                const dateStr = selectedDate.format("YYYY-MM-DD");
                const slots = await getAvailabilitySlots(selectedBranchId, dateStr);
                // Lấy ra danh sách userId duy nhất của các ca làm việc
                const userIds = [...new Set(slots.map(s => s.userId))];
                setWorkingStaffIds(userIds);
            } catch (error) {
                console.error("Lỗi khi tải lịch làm việc của nhân viên:", error);
            } finally {
                setLoadingStaff(false);
            }
        };

        fetchWorkingStaff();
    }, [selectedBranchId, selectedDate]);

    // 3. Tải danh sách khung giờ rảnh khi có đóng Ngày, Dịch vụ/Combo, và Thợ
    useEffect(() => {
        if (!selectedBranchId || !selectedDate) return;
        if (bookingType === "service" && selectedServices.length === 0) return;
        if (bookingType === "bundle" && !selectedBundle) return;

        const fetchSlots = async () => {
            try {
                setLoadingSlots(true);
                setSelectedTime(null);

                const dateStr = selectedDate.format("YYYY-MM-DD");
                const params = {
                    date: dateStr
                };

                if (bookingType === "service") {
                    params.serviceIds = selectedServices.map(s => s.id).join(",");
                } else {
                    params.bundleId = selectedBundle.id;
                }

                if (selectedStaff) {
                    params.staffId = selectedStaff.id;
                }

                const data = await getAvailabilityApi(selectedBranchId, params);
                setAvailableTimes(data.availableStartTimes || []);
                setOpenTime(data.openTime || null);
                setCloseTime(data.closeTime || null);
            } catch {
                message.error("Không thể quét lịch trống lúc này.");
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedBranchId, selectedDate, selectedServices, selectedBundle, selectedStaff, bookingType, refreshCounter]);

    // Sinh tất cả các khung giờ hoạt động trong ngày (cách nhau 15 phút) từ openTime đến closeTime
    const generateAllTimeSlots = () => {
        if (!openTime || !closeTime) return [];

        const slots = [];
        let current = dayjs(`2020-01-01T${openTime}`);
        const end = dayjs(`2020-01-01T${closeTime}`);

        while (current.isBefore(end)) {
            slots.push(current.format("HH:mm:ss"));
            current = current.add(15, "minute");
        }
        return slots;
    };

    // Lọc danh sách nhân viên có đủ kỹ năng thực hiện các dịch vụ đã chọn và có lịch làm việc
    const getQualifiedStaff = () => {
        return staffList.filter(staff => {
            const allowedIds = (staff.services || []).map(s => s.id);
            let hasSkill = false;
            if (bookingType === "bundle") {
                if (!selectedBundle) return false;
                const reqIds = (selectedBundle.items || []).map(item => item.serviceId);
                hasSkill = reqIds.every(id => allowedIds.includes(id));
            } else {
                if (selectedServices.length === 0) return false;
                hasSkill = selectedServices.every(s => allowedIds.includes(s.id));
            }

            if (!hasSkill) return false;

            // Nếu đã chọn ngày hẹn, chỉ hiển thị nhân viên có ca làm việc vào ngày đó
            if (selectedDate) {
                return workingStaffIds.includes(staff.userId);
            }

            return true;
        });
    };

    // Tính tổng tiền và tổng thời gian đặt lịch
    const getBookingSummary = () => {
        if (bookingType === "bundle") {
            return {
                price: selectedBundle ? parseFloat(selectedBundle.price) : 0,
                duration: selectedBundle ? selectedBundle.totalDurationMinutes : 0
            };
        } else {
            const price = selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0);
            const duration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
            return { price, duration };
        }
    };

    // Tính tiền cọc dựa trên cấu hình từng dịch vụ.
    const getServiceDepositAmount = (service) => {
        const price = Number(service?.price || 0);
        const depositRequired = service?.depositRequired;
        const depositPercentage = Number(service?.depositPercentage || 0);

        if (!depositRequired || !depositPercentage) {
            return 0;
        }

        return Math.round((price * depositPercentage) / 100);
    };

    const getBookingDepositAmount = () => {
        if (bookingType === "service") {
            return selectedServices.reduce(
                (sum, service) => sum + getServiceDepositAmount(service),
                0
            );
        }

        if (!selectedBundle) {
            return 0;
        }

        return (selectedBundle.items || []).reduce((sum, item) => {
            const service = services.find(s => String(s.id) === String(item.serviceId));
            return sum + getServiceDepositAmount(service);
        }, 0);
    };

    // Xử lý chuyển bước tiếp theo
    const handleNext = () => {
        if (currentStep === 0) {
            if (bookingType === "service" && selectedServices.length === 0) {
                message.warning("Vui lòng chọn ít nhất một dịch vụ!");
                return;
            }
            if (bookingType === "bundle" && !selectedBundle) {
                message.warning("Vui lòng chọn một gói combo!");
                return;
            }
        }
        if (currentStep === 1) {
            if (!selectedDate) {
                message.warning("Vui lòng chọn ngày hẹn!");
                return;
            }
        }
        setCurrentStep(currentStep + 1);
    };

    // Xử lý quay lại bước trước
    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    // Gửi yêu cầu đặt lịch hẹn lên Backend
    const handleConfirmBooking = async () => {
        if (!selectedTime) {
            message.warning("Vui lòng chọn giờ hẹn!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                bookingDate: selectedDate.format("YYYY-MM-DD"),
                startTime: selectedTime,
                preferredStaffId: selectedStaff ? selectedStaff.id : null,
                notes: notes
            };

            if (bookingType === "service") {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else {
                payload.bundleId = selectedBundle.id;
            }

            const res = await createBookingApi(selectedBranchId, payload);
            
            if (paymentMethod === "VNPAY") {
                message.loading({ content: "Đang chuyển hướng sang cổng thanh toán VNPay...", key: "payment_redirect" });
                
                const idempotencyKey = "vnpay_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
                const returnUrl = window.location.origin + "/payment/callback";
                const depositAmount = Number(res.depositAmount || getBookingDepositAmount() || res.totalPrice || 0);
                
                const paymentPayload = {
                    bookingId: res.id,
                    paymentMethod: "VNPAY",
                    amount: depositAmount,
                    idempotencyKey: idempotencyKey,
                    returnUrl: returnUrl
                };
                
                const paymentRes = await createPaymentUrlApi(paymentPayload);
                if (paymentRes.paymentUrl) {
                    window.location.href = paymentRes.paymentUrl;
                } else {
                    throw new Error("Không thể tạo liên kết thanh toán VNPay.");
                }
            } else {
                sessionStorage.setItem("salonflow_last_pay_at_counter_booking", JSON.stringify(res));
                message.success("Đặt lịch hẹn thành công!");
                navigate("/booking/pay-at-counter-success", { state: { booking: res } });
            }
        } catch (error) {
            message.error({ content: error.response?.data?.message || error.message || "Lỗi khi tạo đặt lịch hẹn.", key: "payment_redirect" });
        } finally {
            setLoading(false);
        }
    };

    const { price: totalPrice, duration: totalDuration } = getBookingSummary();
    const depositAmount = getBookingDepositAmount();
    const payableAmount = depositAmount > 0 ? depositAmount : totalPrice;

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 0" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
                ✂️ Đặt lịch dịch vụ làm đẹp
            </Title>

            <Steps
                current={currentStep}
                responsive
                style={{ marginBottom: 40 }}
                items={[
                    { title: "Chọn dịch vụ", icon: <AppstoreOutlined /> },
                    { title: "Chọn ngày & nhân viên", icon: <TeamOutlined /> },
                    { title: "Chọn giờ & hoàn tất", icon: <CalendarOutlined /> }
                ]}
            />

            <Row gutter={[24, 24]}>
                {/* Cột trái: Form thao tác chính của từng bước */}
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", minHeight: 480 }}>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "100px 0" }}>
                                <Spin size="large" tip="Đang tải dữ liệu..." />
                            </div>
                        ) : (
                            <>
                                {/* ── BƯỚC 1: CHỌN CHI NHÁNH & DỊCH VỤ ──────────────── */}
                                {currentStep === 0 && (
                                    <div>
                                        <Row gutter={16} style={{ marginBottom: 24 }}>
                                            <Col xs={24} sm={12}>
                                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Bước 1a: Chọn Hệ thống Salon</label>
                                                <Select
                                                    style={{ width: "100%" }}
                                                    size="large"
                                                    value={selectedSalonId}
                                                    onChange={(value) => {
                                                        setSelectedSalonId(value);
                                                        setBranches([]);
                                                        setSelectedBranchId(null);
                                                    }}
                                                    options={salons.map(s => ({ label: s.name, value: s.id }))}
                                                    placeholder="Chọn hệ thống Salon..."
                                                />
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Bước 1b: Chọn Chi nhánh</label>
                                                <Select
                                                    style={{ width: "100%" }}
                                                    size="large"
                                                    value={selectedBranchId}
                                                    onChange={setSelectedBranchId}
                                                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                                                    placeholder={selectedSalonId ? "Chọn chi nhánh..." : "Vui lòng chọn hệ thống Salon trước"}
                                                    disabled={!selectedSalonId}
                                                />
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: "24px 0" }} />

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                            <label style={{ fontWeight: 600 }}>Bước 2: Chọn dịch vụ muốn đặt</label>
                                            <Radio.Group value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
                                                <Radio.Button value="service">Dịch vụ lẻ</Radio.Button>
                                                <Radio.Button value="bundle">Gói Combo</Radio.Button>
                                            </Radio.Group>
                                        </div>

                                        {bookingType === "service" ? (
                                            <Row gutter={[16, 16]}>
                                                {services.map(s => {
                                                    const isSelected = selectedServices.some(item => item.id === s.id);
                                                    return (
                                                        <Col xs={24} sm={12} key={s.id}>
                                                            <Card
                                                                hoverable
                                                                style={{
                                                                    borderRadius: 12,
                                                                    border: isSelected ? "2px solid #1890ff" : "1px solid #f0f0f0",
                                                                    backgroundColor: isSelected ? "#e6f7ff" : "#fff"
                                                                }}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedServices(selectedServices.filter(item => item.id !== s.id));
                                                                    } else {
                                                                        setSelectedServices([...selectedServices, s]);
                                                                    }
                                                                }}
                                                            >
                                                                <Text strong style={{ fontSize: 16 }}>{s.name}</Text>
                                                                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                    <Tag color="blue">{s.durationMinutes} phút</Tag>
                                                                    <Text strong style={{ color: "#faad14" }}>{parseFloat(s.price).toLocaleString()} đ</Text>
                                                                </div>
                                                            </Card>
                                                        </Col>
                                                    );
                                                })}
                                                {services.length === 0 && <Col span={24} style={{ textAlign: "center", padding: 40 }}><Text type="secondary">Chi nhánh chưa có dịch vụ nào.</Text></Col>}
                                            </Row>
                                        ) : (
                                            <Row gutter={[16, 16]}>
                                                {bundles.map(b => {
                                                    const isSelected = selectedBundle?.id === b.id;
                                                    return (
                                                        <Col xs={24} key={b.id}>
                                                            <Card
                                                                hoverable
                                                                style={{
                                                                    borderRadius: 12,
                                                                    border: isSelected ? "2px solid #52c41a" : "1px solid #f0f0f0",
                                                                    backgroundColor: isSelected ? "#f6ffed" : "#fff"
                                                                }}
                                                                onClick={() => setSelectedBundle(b)}
                                                            >
                                                                <Row justify="space-between" align="middle">
                                                                    <Col xs={24} sm={16}>
                                                                        <Text strong style={{ fontSize: 17 }}>{b.name}</Text>
                                                                        <div style={{ marginTop: 8 }}>
                                                                            {b.items?.map(item => (
                                                                                <Tag color="cyan" key={item.serviceId}>{item.name}</Tag>
                                                                            ))}
                                                                        </div>
                                                                    </Col>
                                                                    <Col xs={24} sm={8} style={{ textAlign: screens.xs ? "left" : "right", marginTop: screens.xs ? 12 : 0 }}>
                                                                        <Text delete style={{ color: "#bfbfbf", marginRight: 8 }}>{parseFloat(b.originalPrice).toLocaleString()} đ</Text>
                                                                        <br />
                                                                        <Text strong style={{ color: "#52c41a", fontSize: 18 }}>{parseFloat(b.price).toLocaleString()} đ</Text>
                                                                        <br />
                                                                        <Tag color="blue">{b.totalDurationMinutes} phút</Tag>
                                                                    </Col>
                                                                </Row>
                                                            </Card>
                                                        </Col>
                                                    );
                                                })}
                                                {bundles.length === 0 && <Col span={24} style={{ textAlign: "center", padding: 40 }}><Text type="secondary">Chi nhánh chưa có gói combo ưu đãi nào.</Text></Col>}
                                            </Row>
                                        )}
                                    </div>
                                )}

                                {/* ── BƯỚC 2: CHỌN NHÂN VIÊN & NGÀY HẸN ────────────── */}
                                {currentStep === 1 && (
                                    <div>
                                        <div style={{ marginBottom: 24 }}>
                                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Ngày hẹn</label>
                                            <DatePicker
                                                style={{ width: "100%" }}
                                                size="large"
                                                format="YYYY-MM-DD"
                                                disabledDate={current => current && current.valueOf() < Date.now() - 24*60*60*1000}
                                                value={selectedDate}
                                                onChange={(date) => {
                                                    setSelectedDate(date);
                                                    setSelectedStaff(null); // Reset nhân viên khi đổi ngày
                                                }}
                                                placeholder="Chọn ngày bạn muốn hẹn lịch..."
                                            />
                                        </div>

                                        <Divider style={{ margin: "24px 0" }} />

                                        {!selectedDate ? (
                                            <div style={{ 
                                                padding: "40px 20px", 
                                                background: "#fafafa", 
                                                borderRadius: 16, 
                                                textAlign: "center",
                                                border: "1px dashed #d9d9d9"
                                            }}>
                                                <CalendarOutlined style={{ fontSize: 32, color: "#bfbfbf", marginBottom: 12 }} />
                                                <div>
                                                    <Text type="secondary" style={{ fontSize: 16, fontWeight: 500 }}>
                                                        Vui lòng chọn ngày hẹn trước để hiển thị danh sách nhân viên khả dụng.
                                                    </Text>
                                                </div>
                                            </div>
                                        ) : loadingStaff ? (
                                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                                <Spin tip="Đang kiểm tra lịch làm việc của nhân viên..." />
                                            </div>
                                        ) : (
                                            <div>
                                                <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Chọn Nhân viên thực hiện</label>
                                                <Row gutter={[16, 16]}>
                                                    {/* Thẻ chọn "Bất kỳ ai" */}
                                                    <Col xs={24} sm={12}>
                                                        <Card
                                                            hoverable
                                                            style={{
                                                                borderRadius: 12,
                                                                border: selectedStaff === null ? "2px solid #1890ff" : "1px solid #f0f0f0",
                                                                backgroundColor: selectedStaff === null ? "#e6f7ff" : "#fff"
                                                            }}
                                                            onClick={() => setSelectedStaff(null)}
                                                        >
                                                            <Space size="middle">
                                                                <Avatar size={48} icon={<SmileOutlined />} style={{ backgroundColor: "#87d068" }} />
                                                                <div>
                                                                    <Text strong style={{ fontSize: 16 }}>Bất kỳ ai</Text>
                                                                    <br />
                                                                    <Text type="secondary" style={{ fontSize: 12 }}>Tự động phân bổ thợ đang rảnh</Text>
                                                                </div>
                                                            </Space>
                                                        </Card>
                                                    </Col>

                                                    {/* Danh sách thợ đủ điều kiện kỹ năng */}
                                                    {getQualifiedStaff().map(staff => {
                                                        const isSelected = selectedStaff?.id === staff.id;
                                                        return (
                                                            <Col xs={24} sm={12} key={staff.id}>
                                                                <Card
                                                                    hoverable
                                                                    style={{
                                                                        borderRadius: 12,
                                                                        border: isSelected ? "2px solid #1890ff" : "1px solid #f0f0f0",
                                                                        backgroundColor: isSelected ? "#e6f7ff" : "#fff"
                                                                    }}
                                                                    onClick={() => setSelectedStaff(staff)}
                                                                >
                                                                    <Space size="middle">
                                                                        <Avatar size={48} src={staff.avatarUrl} icon={<TeamOutlined />} style={{ backgroundColor: "#1890ff" }} />
                                                                        <div>
                                                                            <Text strong style={{ fontSize: 16 }}>{staff.name}</Text>
                                                                            <br />
                                                                            <Text type="secondary" style={{ fontSize: 12, display: "inline-block", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                                {staff.specialties || "Thợ làm tóc chuyên nghiệp"}
                                                                            </Text>
                                                                        </div>
                                                                    </Space>
                                                                </Card>
                                                            </Col>
                                                        );
                                                    })}
                                                </Row>
                                                {getQualifiedStaff().length === 0 && (
                                                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                                                        <Text type="secondary">Không có nhân viên nào hoạt động hoặc có ca làm việc vào ngày này.</Text>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── BƯỚC 3: CHỌN GIỜ & GHI CHÚ ──────────────────── */}
                                {currentStep === 2 && (
                                    <div>
                                        <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>
                                            <ClockCircleOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Chọn giờ hẹn khả dụng (Khung giờ trống)
                                        </label>

                                        {loadingSlots ? (
                                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                                <Spin tip="Đang quét giờ khả dụng..." />
                                            </div>
                                        ) : (
                                            <div>
                                                {(() => {
                                                    const allSlots = generateAllTimeSlots();
                                                    if (allSlots.length > 0) {
                                                        return (
                                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12, marginBottom: 24 }}>
                                                                {allSlots.map(time => {
                                                                    const displayTime = time.substring(0, 5);
                                                                    const isAvailable = availableTimes.includes(time);
                                                                    const isSelected = selectedTime === time;
                                                                    
                                                                    return (
                                                                        <Button
                                                                            key={time}
                                                                            size="large"
                                                                            disabled={!isAvailable}
                                                                            style={{
                                                                                borderRadius: 8,
                                                                                fontWeight: isSelected ? "600" : "500",
                                                                                backgroundColor: isSelected 
                                                                                    ? "#52c41a" // Selected
                                                                                    : isAvailable 
                                                                                        ? "#f6ffed" // Available green
                                                                                        : "#fff1f0", // Busy red
                                                                                borderColor: isSelected 
                                                                                    ? "#52c41a" 
                                                                                    : isAvailable 
                                                                                        ? "#b7eb8f" 
                                                                                        : "#ffa39e",
                                                                                color: isSelected 
                                                                                    ? "#fff" 
                                                                                    : isAvailable 
                                                                                        ? "#389e0d" 
                                                                                        : "#cf1322",
                                                                                transition: "all 0.3s",
                                                                                opacity: isAvailable ? 1 : 0.65,
                                                                                cursor: isAvailable ? "pointer" : "not-allowed"
                                                                            }}
                                                                            onClick={() => isAvailable && setSelectedTime(time)}
                                                                        >
                                                                            {displayTime}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    } else {
                                                        return (
                                                            <div style={{ padding: "30px 10px", background: "#fff2e8", borderRadius: 8, border: "1px solid #ffbb96", marginBottom: 24, textAlign: "center" }}>
                                                                <Text type="warning" strong>Vui lòng hoàn thành chọn chi nhánh, dịch vụ và ngày hẹn ở các bước trước để quét giờ hoạt động.</Text>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        )}

                                        <Divider style={{ margin: "24px 0" }} />

                                        <FormLayoutItem label="Ghi chú thêm (Không bắt buộc)">
                                            <Input.TextArea
                                                rows={4}
                                                placeholder="Mô tả các yêu cầu đặc biệt của bạn để salon chuẩn bị tốt nhất..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </FormLayoutItem>

                                        <Divider style={{ margin: "24px 0" }} />

                                        <FormLayoutItem label="Phương thức thanh toán">
                                            <Radio.Group 
                                                value={paymentMethod} 
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ width: "100%" }}
                                            >
                                                <Space direction="vertical" style={{ width: "100%" }}>
                                                    <Radio value="PAY_AT_COUNTER" style={{ padding: "4px 0", fontSize: 15 }}>
                                                        <Text strong>Thanh toán tại quầy</Text> (Thanh toán cọc online, phần còn lại thanh toán tại salon)
                                                    </Radio>
                                                    <Radio value="VNPAY" style={{ padding: "4px 0", fontSize: 15 }}>
                                                        <Text strong>Thanh toán qua cổng VNPay</Text> (Thanh toán cọc online bằng thẻ nội địa/QR Code)
                                                    </Radio>
                                                </Space>
                                            </Radio.Group>
                                        </FormLayoutItem>
                                    </div>
                                )}

                                {/* Hàng nút điều hướng Quy trình */}
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
                                    <Button
                                        size="large"
                                        icon={<LeftOutlined />}
                                        onClick={handlePrev}
                                        disabled={currentStep === 0}
                                    >
                                        Quay lại
                                    </Button>

                                    {currentStep < 2 ? (
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleNext}
                                        >
                                            Tiếp tục <RightOutlined />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleConfirmBooking}
                                            disabled={!selectedTime}
                                            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                        >
                                            Xác nhận đặt lịch
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </Col>

                {/* Cột phải: Hóa đơn tóm tắt thông tin đặt lịch */}
                <Col xs={24} lg={8}>
                    <Card
                        style={{
                            borderRadius: 16,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                            background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)",
                            position: "sticky",
                            top: 24
                        }}
                    >
                        <Title level={4} style={{ marginTop: 0 }}>Tóm tắt lịch hẹn</Title>
                        <Divider style={{ margin: "16px 0" }} />

                        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                            <div>
                                <Text type="secondary"><ShopOutlined /> Chi nhánh:</Text>
                                <br />
                                <Text strong>{branches.find(b => b.id === selectedBranchId)?.name || "-"}</Text>
                            </div>

                            <div>
                                <Text type="secondary"><AppstoreOutlined /> Dịch vụ đặt:</Text>
                                <br />
                                {bookingType === "service" ? (
                                    selectedServices.length > 0 ? (
                                        <div style={{ marginTop: 4 }}>
                                            {selectedServices.map(s => (
                                                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                    <Text>- {s.name}</Text>
                                                    <Text type="secondary">{parseFloat(s.price).toLocaleString()} đ</Text>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Text type="secondary" italic>Chưa chọn dịch vụ nào</Text>
                                    )
                                ) : (
                                    selectedBundle ? (
                                        <div style={{ marginTop: 4 }}>
                                            <Text strong color="green">{selectedBundle.name}</Text>
                                            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                                                Gói combo gồm nhiều dịch vụ kết hợp
                                            </div>
                                        </div>
                                    ) : (
                                        <Text type="secondary" italic>Chưa chọn combo nào</Text>
                                    )
                                )}
                            </div>

                            {currentStep >= 1 && (
                                <>
                                    <div>
                                        <Text type="secondary"><TeamOutlined /> Nhân viên phục vụ:</Text>
                                        <br />
                                        <Text strong>{selectedStaff ? selectedStaff.name : "Bất kỳ nhân viên (Auto)"}</Text>
                                    </div>

                                    <div>
                                        <Text type="secondary"><CalendarOutlined /> Ngày hẹn:</Text>
                                        <br />
                                        <Text strong>{selectedDate ? selectedDate.format("YYYY-MM-DD") : "-"}</Text>
                                    </div>
                                </>
                            )}

                            {currentStep >= 2 && selectedTime && (
                                <div>
                                    <Text type="secondary"><ClockCircleOutlined /> Giờ hẹn:</Text>
                                    <br />
                                    <Tag color="gold" style={{ fontSize: 14, padding: "2px 8px" }}>
                                        {selectedTime.substring(0, 5)}
                                    </Tag>
                                </div>
                            )}
                        </Space>

                        <Divider style={{ margin: "20px 0" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text type="secondary">Tổng thời gian:</Text>
                            <Text strong>{totalDuration} phút</Text>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <Text type="secondary" style={{ fontSize: 16 }}>
                                Tiền cọc phải thanh toán:
                            </Text>
                            <Text strong style={{ color: "#faad14", fontSize: 22 }}>
                                {payableAmount.toLocaleString()} đ
                            </Text>
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {paymentMethod === "PAY_AT_COUNTER"
                                    ? (depositAmount > 0
                                        ? `Với lựa chọn thanh toán tại quầy, bạn vẫn cần thanh toán tiền cọc online để giữ lịch: ${formatCurrency(depositAmount)} đ. Phần còn lại sẽ thanh toán tại salon.`
                                        : "Hiện chưa có cấu hình cọc cho các dịch vụ đã chọn, hệ thống sẽ dùng giá trị hiển thị phía trên.")
                                    : (depositAmount > 0
                                        ? `Tiền cọc sẽ được thanh toán online qua VNPay: ${formatCurrency(depositAmount)} đ.`
                                        : "Hiện chưa có cấu hình cọc cho các dịch vụ đã chọn, hệ thống sẽ dùng giá trị hiển thị phía trên.")
                                }
                            </Text>
                        </div>
                        {paymentMethod === "VNPAY" && (
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Thanh toán trực tuyến sẽ được xử lý qua VNPay ngay sau khi tạo booking.
                                </Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

// Helper Layout Component
function FormLayoutItem({ label, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>{label}</label>
            {children}
        </div>
    );
}
