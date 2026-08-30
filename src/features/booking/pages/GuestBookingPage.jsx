import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Steps, Select, Button, Typography, Row, Col, Space, Divider, DatePicker, message, Spin, Grid, Radio, Avatar, Tag, Input } from "antd";
import { ShopOutlined, AppstoreOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getPublicBranchesApi } from "@/features/branch/api/branchApi";
import { getPublicSalonsApi } from "@/features/salon/api/salonApi";
import { getPublicServicesByBranchApi, getPublicBundlesByBranchApi } from "@/features/service/api/serviceApi";
import { getPublicStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getPublicAvailabilityApi, createPublicBookingApi } from "../api/bookingApi";
import { getPublicAvailabilitySlots } from "@/features/shift/api/shiftApi";
import { createPaymentUrlApi } from "@/features/payment/api/paymentApi";
import { API_BASE_URL } from "@/core/api/endpoints";
import { getWebSocketUrl } from "@/core/utils/websocket";
import BookingSummary from "../components/BookingSummary";
import StepServiceSelection from "../components/StepServiceSelection";
import NormalBookingForm from "../components/NormalBookingForm";
import StepTimeSlots from "../components/StepTimeSlots";
import AiBookingChatbot from "@/features/chatbot/components/AiBookingChatbot";
import offdayApi from "@/features/offday/api/offdayApi";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");
const BOOKING_CONTEXT_KEY = "salonflow_last_booking_context";

export default function GuestBookingPage() {
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");

    const [salons, setSalons] = useState([]);
    const [selectedSalonId, setSelectedSalonId] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [services, setServices] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [bookingType, setBookingType] = useState("service");

    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [notes, setNotes] = useState("");

    const [workingStaffIds, setWorkingStaffIds] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

    const [availableTimes, setAvailableTimes] = useState([]);
    const [openTime, setOpenTime] = useState(null);
    const [closeTime, setCloseTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);

    useEffect(() => {
        let socket = null;
        let reconnectTimer = null;

        const connectWS = () => {
            const socketUrl = getWebSocketUrl("/ws/bookings");
            socket = new WebSocket(socketUrl);

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === "BOOKING_UPDATE") {
                        const matchBranch = String(msg.branchId) === String(selectedBranchId);
                        const matchDate = selectedDate && msg.date === selectedDate.format("YYYY-MM-DD");
                        const matchStaff = !selectedStaff || !msg.staffId || String(msg.staffId) === String(selectedStaff.id);

                        if (matchBranch && matchDate && matchStaff) {
                            setRefreshCounter(prev => prev + 1);
                        }
                    }
                } catch {
                    // no-op
                }
            };

            socket.onclose = () => {
                reconnectTimer = setTimeout(connectWS, 3000);
            };

            socket.onerror = () => {
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

    useEffect(() => {
        const loadSalons = async () => {
            try {
                setLoading(true);
                const data = await getPublicSalonsApi();
                setSalons(data);

                // Auto-select salon from search params if present
                const searchParams = new URLSearchParams(window.location.search);
                const querySalonId = searchParams.get("salonId");
                if (querySalonId && data.some(s => String(s.id) === String(querySalonId))) {
                    setSelectedSalonId(Number(querySalonId));
                }
            } catch {
                message.error("Không thể tải danh sách Salon.");
            } finally {
                setLoading(false);
            }
        };

        loadSalons();
    }, []);

    useEffect(() => {
        if (!selectedSalonId) return;

        const loadBranches = async () => {
            try {
                setLoading(true);
                const data = await getPublicBranchesApi(selectedSalonId);
                setBranches(data);

                // Auto-select branch from search params if present and belongs to this salon
                const searchParams = new URLSearchParams(window.location.search);
                const queryBranchId = searchParams.get("branchId");
                if (queryBranchId && data.some(b => String(b.id) === String(queryBranchId))) {
                    setSelectedBranchId(Number(queryBranchId));
                } else {
                    setSelectedBranchId(null);
                }
            } catch {
                message.error("Lỗi tải danh sách chi nhánh của Salon này.");
            } finally {
                setLoading(false);
            }
        };

        loadBranches();
    }, [selectedSalonId]);

    const [systemOffDays, setSystemOffDays] = useState([]);

    useEffect(() => {
        if (!selectedBranchId) return;

        const loadBranchData = async () => {
            try {
                setLoading(true);
                setSelectedServices([]);
                setSelectedBundle(null);
                setSelectedStaff(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setAvailableTimes([]);

                const [servicesData, bundlesData, staffData] = await Promise.all([
                    getPublicServicesByBranchApi(selectedBranchId),
                    getPublicBundlesByBranchApi(selectedBranchId),
                    getPublicStaffByBranchApi(selectedBranchId)
                ]);

                setServices((servicesData || []).filter(s => s.isActive !== false));
                setBundles(bundlesData || []);
                setStaffList(staffData || []);

                // Fetch System Off-Days for the selected branch
                const todayStr = dayjs().format("YYYY-MM-DD");
                const nextRangeStr = dayjs().add(90, "day").format("YYYY-MM-DD");
                offdayApi.getOffDaysForBranchRange(selectedBranchId, todayStr, nextRangeStr)
                    .then(data => setSystemOffDays(Array.isArray(data) ? data : []))
                    .catch(() => setSystemOffDays([]));
            } catch {
                message.error("Lỗi tải thông tin dịch vụ, combo và nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        loadBranchData();
    }, [selectedBranchId]);

    // Lấy lịch làm việc của nhân viên khi đổi ngày
    useEffect(() => {
        const timerId = window.setTimeout(() => {
            if (!selectedBranchId || !selectedDate) {
                setWorkingStaffIds([]);
                return;
            }

            const fetchWorkingStaff = async () => {
                try {
                    setLoadingStaff(true);
                    const dateStr = selectedDate.format("YYYY-MM-DD");
                    const slots = await getPublicAvailabilitySlots(selectedBranchId, dateStr);
                    const userIds = [...new Set(slots.map(s => s.userId))];
                    setWorkingStaffIds(userIds);
                } catch (error) {
                    console.error("Lỗi khi tải lịch làm việc của nhân viên:", error);
                } finally {
                    setLoadingStaff(false);
                }
            };

            fetchWorkingStaff();
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [selectedBranchId, selectedDate]);

    useEffect(() => {
        if (!selectedBranchId || !selectedDate || !selectedStaff) return;
        if (bookingType === "service" && selectedServices.length === 0) return;
        if (bookingType === "bundle" && !selectedBundle) return;

        const fetchSlots = async () => {
            try {
                setLoadingSlots(true);
                setSelectedTime(null);

                const params = { date: selectedDate.format("YYYY-MM-DD") };
                if (bookingType === "service") {
                    params.serviceIds = selectedServices.map(s => s.id).join(",");
                } else {
                    params.bundleId = selectedBundle.id;
                }

                const data = await getPublicAvailabilityApi(selectedBranchId, selectedStaff.id, params);
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

    // Lọc danh sách nhân viên có kỹ năng thực hiện dịch vụ và có làm việc trong ngày đã chọn
    const getQualifiedStaff = () => {
        return staffList.filter(staff => {
            const allowedIds = (staff.services || []).map(s => s.id);
            const hasSkill = bookingType === "bundle"
                ? Boolean(selectedBundle) && (selectedBundle.items || []).every(item => allowedIds.includes(item.serviceId))
                : selectedServices.length > 0 && selectedServices.every(s => allowedIds.includes(s.id));

            if (!hasSkill) return false;

            if (selectedDate && workingStaffIds.length > 0) {
                return workingStaffIds.includes(staff.userId) || workingStaffIds.includes(staff.id);
            }

            return true;
        });
    };

    const getBookingSummary = () => {
        if (bookingType === "bundle") {
            return {
                price: selectedBundle ? parseFloat(selectedBundle.price) : 0,
                duration: selectedBundle ? selectedBundle.totalDurationMinutes : 0
            };
        }

        return {
            price: selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0),
            duration: selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)
        };
    };

    const getServiceDepositAmount = (service) => {
        const price = Number(service?.price || 0);
        const depositRequired = service?.depositRequired;
        const depositPercentage = Number(service?.depositPercentage || 0);
        if (!depositRequired || !depositPercentage) return 0;
        return Math.round((price * depositPercentage) / 100);
    };

    const getBookingDepositAmount = () => {
        if (bookingType === "service") {
            return selectedServices.reduce((sum, service) => sum + getServiceDepositAmount(service), 0);
        }
        if (!selectedBundle) return 0;

        const bundleDeposit = Number(selectedBundle.depositAmount || 0);
        if (bundleDeposit > 0) return bundleDeposit;

        return (selectedBundle.items || []).reduce((sum, item) => {
            const service = services.find(s => String(s.id) === String(item.serviceId));
            return sum + getServiceDepositAmount(service);
        }, 0);
    };

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
            if (!selectedStaff) {
                message.warning("Vui lòng chọn nhân viên thực hiện!");
                return;
            }
            if (!selectedDate) {
                message.warning("Vui lòng chọn ngày hẹn!");
                return;
            }
        }

        setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleConfirmBooking = async () => {
        if (!selectedTime) {
            message.warning("Vui lòng chọn giờ hẹn!");
            return;
        }

        if (!guestName.trim()) {
            message.warning("Vui lòng nhập họ tên để đặt lịch!");
            return;
        }

        if (!guestPhone.trim()) {
            message.warning("Vui lòng nhập số điện thoại để đặt lịch!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                bookingDate: selectedDate.format("YYYY-MM-DD"),
                startTime: selectedTime,
                preferredStaffId: selectedStaff.id,
                notes,
                customerName: guestName.trim(),
                customerPhone: guestPhone.trim(),
                bookingChannel: "PUBLIC",
                paymentMethod: "PAY_AT_COUNTER"
            };

            if (guestEmail.trim()) {
                payload.customerEmail = guestEmail.trim();
            }

            if (bookingType === "service") {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else {
                payload.bundleId = selectedBundle.id;
            }

            const res = await createPublicBookingApi(selectedBranchId, payload);
            const bookingDetail = {
                ...res,
                branchId: selectedBranchId,
                bookingChannel: "PUBLIC",
                depositAmount: Number(res.depositAmount || getBookingDepositAmount() || res.totalPrice || 0),
                totalPrice: Number(res.totalPrice || totalPrice || 0)
            };

            sessionStorage.setItem(
                BOOKING_CONTEXT_KEY,
                JSON.stringify({
                    bookingMode: "public",
                    returnPath: "/guest-booking"
                })
            );
            sessionStorage.setItem("salonflow_last_pay_at_counter_booking", JSON.stringify(bookingDetail));

            message.success("Đặt lịch hẹn thành công!");
            navigate("/booking/pay-at-counter-success", { state: { booking: bookingDetail, bookingMode: "public" } });
        } catch (error) {
            message.error({ content: error.response?.data?.message || error.message || "Lỗi khi tạo đặt lịch hẹn.", key: "payment_redirect" });
        } finally {
            setLoading(false);
        }
    };

    const { price: totalPrice, duration: totalDuration } = getBookingSummary();
    const depositAmount = getBookingDepositAmount();
    const payableAmount = depositAmount > 0 ? depositAmount : totalPrice;
    const selectedBranchName = branches.find(b => b.id === selectedBranchId)?.name;

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: screens.xs ? "8px 4px" : "20px 0" }}>
            <Title level={screens.xs ? 4 : 2} style={{ textAlign: "center", marginBottom: screens.xs ? 16 : 32 }}>
                ✂️ Đặt lịch công khai
            </Title>

            <Steps
                current={currentStep}
                responsive
                size={screens.xs ? "small" : "default"}
                style={{ marginBottom: screens.xs ? 20 : 40 }}
                items={[
                    { title: screens.xs ? "Dịch vụ" : "Chọn dịch vụ", icon: <AppstoreOutlined /> },
                    { title: screens.xs ? "Ngày & Thợ" : "Chọn nhân viên", icon: <TeamOutlined /> },
                    { title: screens.xs ? "Giờ & Xong" : "Chọn giờ & hoàn tất", icon: <CalendarOutlined /> }
                ]}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", minHeight: 480 }} bodyStyle={{ padding: screens.xs ? "14px 12px" : "24px" }}>
                        {loading ? (
                            <div style={{ textAlign: "center", padding: "100px 0" }}>
                                <Spin size="large" tip="Đang tải dữ liệu..." />
                            </div>
                        ) : (
                            <>
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

                                        {/* ── BƯỚC 1: CHỌN DỊCH VỤ / COMBO ────────────────── */}
                                        <StepServiceSelection
                                            bookingType={bookingType}
                                            setBookingType={setBookingType}
                                            services={services}
                                            selectedServices={selectedServices}
                                            setSelectedServices={setSelectedServices}
                                            bundles={bundles}
                                            selectedBundle={selectedBundle}
                                            setSelectedBundle={setSelectedBundle}
                                            screens={screens}
                                            formatCurrency={formatCurrency}
                                        />
                                    </div>
                                )}

                                {/* ── BƯỚC 2: CHỌN NHÂN VIÊN & NGÀY HẸN ── */}
                                {currentStep === 1 && (
                                    <NormalBookingForm
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        setSelectedStaff={setSelectedStaff}
                                        loadingStaff={loadingStaff}
                                        getQualifiedStaff={getQualifiedStaff}
                                        selectedStaff={selectedStaff}
                                        systemOffDays={systemOffDays}
                                        selectedBranchId={selectedBranchId}
                                        selectedServices={selectedServices}
                                        selectedBundle={selectedBundle}
                                        bookingType={bookingType}
                                        selectedTime={selectedTime}
                                        setSelectedTime={setSelectedTime}
                                    />
                                )}

                                {/* ── BƯỚC 3: CHỌN GIỜ & THÔNG TIN KHÁCH HÀNG ────── */}
                                {currentStep === 2 && (
                                    <div>
                                        <StepTimeSlots
                                            loadingSlots={loadingSlots}
                                            generateAllTimeSlots={generateAllTimeSlots}
                                            availableTimes={availableTimes}
                                            selectedTime={selectedTime}
                                            setSelectedTime={setSelectedTime}
                                            showCustomerInputs={false}
                                            selectedBranchId={selectedBranchId}
                                            selectedDate={selectedDate}
                                            selectedServices={selectedServices}
                                            selectedBundle={selectedBundle}
                                            bookingType={bookingType}
                                            selectedStaff={selectedStaff}
                                        />

                                        <Divider style={{ margin: "24px 0" }} />

                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} md={12}>
                                                <FormLayoutItem label="Họ và tên *">
                                                    <Input
                                                        size="large"
                                                        placeholder="Nhập họ tên của bạn"
                                                        value={guestName}
                                                        onChange={(e) => setGuestName(e.target.value)}
                                                        style={{ borderRadius: 8 }}
                                                    />
                                                </FormLayoutItem>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <FormLayoutItem label="Số điện thoại *">
                                                    <Input
                                                        size="large"
                                                        placeholder="Nhập số điện thoại liên hệ"
                                                        value={guestPhone}
                                                        onChange={(e) => setGuestPhone(e.target.value)}
                                                        style={{ borderRadius: 8 }}
                                                    />
                                                </FormLayoutItem>
                                            </Col>
                                            <Col xs={24}>
                                                <FormLayoutItem label="Email (Không bắt buộc)">
                                                    <Input
                                                        size="large"
                                                        placeholder="Nhập email để nhận thông báo lịch hẹn"
                                                        value={guestEmail}
                                                        onChange={(e) => setGuestEmail(e.target.value)}
                                                        style={{ borderRadius: 8 }}
                                                    />
                                                </FormLayoutItem>
                                            </Col>
                                            <Col xs={24}>
                                                <FormLayoutItem label="Ghi chú gửi cho Salon (Tùy chọn)">
                                                    <Input.TextArea
                                                        rows={3}
                                                        placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt của bạn..."
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        style={{ borderRadius: 8 }}
                                                    />
                                                </FormLayoutItem>
                                            </Col>
                                        </Row>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
                                    <Button size="large" icon={<LeftOutlined />} onClick={handlePrev} disabled={currentStep === 0}>
                                        Quay lại
                                    </Button>

                                    {currentStep < 2 ? (
                                        <Button type="primary" size="large" onClick={handleNext}>
                                            Tiếp tục <RightOutlined />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleConfirmBooking}
                                            disabled={!selectedTime || !guestPhone.trim() || !guestName.trim()}
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

                <Col xs={24} lg={8}>
                    <BookingSummary
                        currentStep={currentStep}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                        bookingType={bookingType}
                        selectedServices={selectedServices}
                        selectedBundle={selectedBundle}
                        selectedStaff={selectedStaff}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        services={services}
                        totalDuration={totalDuration}
                        payableAmount={payableAmount}
                        depositAmount={depositAmount}
                        paymentMethod={paymentMethod}
                        formatCurrency={formatCurrency}
                    />
                </Col>
            </Row>

            <AiBookingChatbot
                branchId={selectedBranchId}
                branchName={selectedBranchName}
                bookingMode="guest"
                onHumanHandoff={() => {
                    setCurrentStep(0);
                    message.info("Bạn có thể tiếp tục đặt lịch bằng biểu mẫu thường.");
                }}
            />
        </div>
    );
}

function FormLayoutItem({ label, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>{label}</label>
            {children}
        </div>
    );
}
