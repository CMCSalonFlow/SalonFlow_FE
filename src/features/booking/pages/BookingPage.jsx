import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Steps, Select, Button, Typography, Row, Col, Space, Divider, message, Spin, Grid, Segmented } from "antd";
import { AppstoreOutlined, TeamOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined, RetweetOutlined } from "@ant-design/icons";
import { getPublicBranchesApi } from "@/features/branch/api/branchApi";
import { getPublicSalonsApi } from "@/features/salon/api/salonApi";
import { getServicesByBranchApi, getBundlesByBranchApi } from "@/features/service/api/serviceApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getAvailabilityApi, createBookingApi, previewRecurringBookingApi, confirmRecurringBookingApi } from "../api/bookingApi";
import { createPaymentUrlApi } from "@/features/payment/api/paymentApi";
import { getAvailabilitySlots } from "@/features/shift/api/shiftApi";
import { API_BASE_URL } from "@/core/api/endpoints";
import { getUserByIdApi } from "@/features/user/api/userApi";
import dayjs from "dayjs";

// Import refactored components
import BookingSummary from "../components/BookingSummary";
import StepServiceSelection from "../components/StepServiceSelection";
import StepTimeSlots from "../components/StepTimeSlots";
import NormalBookingForm from "../components/NormalBookingForm";
import RecurringBookingForm from "../components/RecurringBookingForm";

const { Title } = Typography;
const { useBreakpoint } = Grid;

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

/**
 * Trang Đặt lịch hẹn dành cho Customer đã đăng nhập.
 */
export default function BookingPage() {
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("VNPAY");

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

    // Trạng thái Đặt lịch định kỳ (Recurring Booking)
    const [isRecurringMode, setIsRecurringMode] = useState(false);
    const [recurringPattern, setRecurringPattern] = useState("WEEKLY");
    const [recurringStartDate, setRecurringStartDate] = useState(null);
    const [recurringEndDate, setRecurringEndDate] = useState(null);
    const [recurringTime, setRecurringTime] = useState(null);
    const [recurringPreviewList, setRecurringPreviewList] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [recurringServiceId, setRecurringServiceId] = useState(null);
    const [customerPhone, setCustomerPhone] = useState("");

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) {
            getUserByIdApi(userId)
                .then(data => {
                    if (data && data.phone) {
                        setCustomerPhone(data.phone);
                    }
                })
                .catch(err => console.error("Lỗi khi tải thông tin SĐT người dùng:", err));
        }
    }, []);

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

    // Đồng bộ service đầu tiên cho đặt lịch định kỳ
    useEffect(() => {
        if (selectedServices.length > 0) {
            setRecurringServiceId(selectedServices[0].id);
        } else {
            setRecurringServiceId(null);
        }
    }, [selectedServices]);

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
                const params = { date: dateStr };

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

            if (selectedDate && !isRecurringMode) {
                return workingStaffIds.includes(staff.userId);
            }

            return true;
        });
    };

    // Tính tổng tiền và tổng thời gian đặt lịch
    const getBookingSummary = () => {
        if (bookingType === "bundle") {
            if (!selectedBundle) return { price: 0, duration: 0 };
            return {
                price: Number(selectedBundle.price || 0),
                duration: selectedBundle.totalDurationMinutes || 0
            };
        } else {
            return selectedServices.reduce(
                (acc, s) => ({
                    price: acc.price + Number(s.price || 0),
                    duration: acc.duration + (s.durationMinutes || 0)
                }),
                { price: 0, duration: 0 }
            );
        }
    };

    const getServiceDepositAmount = (service) => {
        const price = Number(service?.price || 0);
        const depositRequired = service?.depositRequired;
        const depositPercentage = Number(service?.depositPercentage || 0);
        if (!depositRequired || !depositPercentage) return 0;
        return Math.round((price * depositPercentage) / 100);
    };

    // Tính tiền cọc cần thanh toán trước
    const getBookingDepositAmount = () => {
        if (bookingType === "bundle") {
            if (!selectedBundle) return 0;
            const bundleDeposit = Number(selectedBundle.depositAmount || 0);
            if (bundleDeposit > 0) return bundleDeposit;

            return (selectedBundle.items || []).reduce((sum, item) => {
                const service = services.find(s => String(s.id) === String(item.serviceId));
                return sum + getServiceDepositAmount(service);
            }, 0);
        } else {
            return selectedServices.reduce((sum, service) => sum + getServiceDepositAmount(service), 0);
        }
    };

    // Đi tiếp bước tiếp theo
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
        if (!customerPhone || !customerPhone.trim()) {
            message.warning("Vui lòng nhập số điện thoại liên hệ!");
            return;
        }
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
                notes,
                customerPhone,
                paymentMethod
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
                const depositAmountVal = Number(res.depositAmount || getBookingDepositAmount() || res.totalPrice || 0);
                
                const paymentPayload = {
                    bookingId: res.id,
                    paymentMethod: "VNPAY",
                    amount: depositAmountVal,
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
                const depositAmountVal = Number(res.depositAmount || getBookingDepositAmount() || res.totalPrice || 0);
                const bookingWithAmounts = {
                    ...res,
                    depositAmount: depositAmountVal,
                    totalPrice: Number(res.totalPrice || totalPrice || 0)
                };

                sessionStorage.setItem("salonflow_last_pay_at_counter_booking", JSON.stringify(bookingWithAmounts));
                message.success("Đặt lịch hẹn thành công!");
                navigate("/booking/pay-at-counter-success", {
                    state: {
                        booking: bookingWithAmounts
                    }
                });
            }
        } catch (error) {
            message.error({ content: error.response?.data?.message || error.message || "Lỗi khi tạo đặt lịch hẹn.", key: "payment_redirect" });
        } finally {
            setLoading(false);
        }
    };

    // Xem trước lịch định kỳ
    const handleRecurringPreview = async () => {
        if (!selectedBranchId) {
            message.warning("Vui lòng chọn chi nhánh!");
            return;
        }
        if (!recurringServiceId) {
            message.warning("Vui lòng chọn dịch vụ!");
            return;
        }
        if (!selectedStaff) {
            message.warning("Vui lòng chọn một nhân viên cụ thể cho lịch định kỳ!");
            return;
        }
        if (!recurringStartDate || !recurringEndDate) {
            message.warning("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc!");
            return;
        }
        if (!recurringTime) {
            message.warning("Vui lòng chọn giờ hẹn!");
            return;
        }

        const activeService = services.find(s => s.id === recurringServiceId);
        const duration = activeService ? activeService.durationMinutes : 30;
        const startTimeStr = recurringTime;
        const endTimeStr = dayjs(`2020-01-01T${startTimeStr}`).add(duration, "minute").format("HH:mm");

        try {
            setLoadingPreview(true);
            setRecurringPreviewList([]);

            const payload = {
                branchId: selectedBranchId,
                staffId: selectedStaff.id,
                serviceId: recurringServiceId,
                pattern: recurringPattern,
                startDate: recurringStartDate.format("YYYY-MM-DD"),
                endDate: recurringEndDate.format("YYYY-MM-DD"),
                startTime: startTimeStr,
                endTime: endTimeStr,
                note: notes
            };

            const data = await previewRecurringBookingApi(payload);
            
            const mappedOccurrences = (data.occurrences || []).map(item => ({
                ...item,
                action: item.hasConflict ? "SKIP" : "INCLUDE",
                overrideStartTime: null,
                overrideEndTime: null,
                showOverridePicker: false
            }));

            setRecurringPreviewList(mappedOccurrences);
            message.success(`Đã tạo xem trước chuỗi lịch hẹn (${data.totalOccurrences} ngày). Có ${data.conflictCount} ngày bị trùng lịch.`);
        } catch (error) {
            message.error(error.response?.data?.message || error.message || "Lỗi khi quét lịch xem trước.");
        } finally {
            setLoadingPreview(false);
        }
    };

    // Xác nhận lưu toàn bộ chuỗi lịch định kỳ
    const handleConfirmRecurringBooking = async () => {
        if (!customerPhone || !customerPhone.trim()) {
            message.warning("Vui lòng nhập số điện thoại liên hệ!");
            return;
        }
        if (recurringPreviewList.length === 0) {
            message.warning("Vui lòng click Xem trước lịch hẹn trước!");
            return;
        }

        const activeService = services.find(s => s.id === recurringServiceId);
        const duration = activeService ? activeService.durationMinutes : 30;
        const startTimeStr = recurringTime;
        const endTimeStr = dayjs(`2020-01-01T${startTimeStr}`).add(duration, "minute").format("HH:mm");

        try {
            setLoading(true);

            const payload = {
                pattern: {
                    branchId: selectedBranchId,
                    staffId: selectedStaff.id,
                    serviceId: recurringServiceId,
                    pattern: recurringPattern,
                    startDate: recurringStartDate.format("YYYY-MM-DD"),
                    endDate: recurringEndDate.format("YYYY-MM-DD"),
                    startTime: startTimeStr + ":00",
                    endTime: endTimeStr + ":00",
                    note: notes,
                    customerPhone
                },
                occurrences: recurringPreviewList.map(item => {
                    const action = item.action || (item.hasConflict ? "SKIP" : "INCLUDE");
                    return {
                        date: item.date,
                        action: action,
                        overrideStartTime: action === "INCLUDE" && item.overrideStartTime ? item.overrideStartTime + ":00" : null,
                        overrideEndTime: action === "INCLUDE" && item.overrideEndTime ? item.overrideEndTime + ":00" : null
                    };
                })
            };

            await confirmRecurringBookingApi(payload);
            message.success("Đặt lịch định kỳ thành công!");
            
            const activeBranch = branches.find(b => b.id === selectedBranchId);
            const activeService = services.find(s => s.id === recurringServiceId);
            
            navigate("/booking/recurring-success", {
                state: {
                    branchName: activeBranch ? `${activeBranch.name} (${activeBranch.address})` : "",
                    serviceName: activeService ? activeService.name : "",
                    staffName: selectedStaff ? selectedStaff.name : "",
                    pattern: recurringPattern,
                    startDate: recurringStartDate.format("YYYY-MM-DD"),
                    endDate: recurringEndDate.format("YYYY-MM-DD"),
                    time: recurringTime,
                    note: notes,
                    totalCreated: recurringPreviewList.filter(item => (item.action || (item.hasConflict ? "SKIP" : "INCLUDE")) === "INCLUDE").length
                }
            });
        } catch (error) {
            message.error(error.response?.data?.message || error.message || "Lỗi khi lưu chuỗi đặt lịch định kỳ.");
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
                    { title: "Chọn giờ & hoàn tất", icon: <ClockCircleOutlined /> }
                ]}
            />

            <Row gutter={[24, 24]}>
                {/* Cột trái: Form cấu hình theo từng bước */}
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                        {/* CHỌN SALON & CHI NHÁNH (Chỉ hiển thị ở Bước 1) */}
                        {currentStep === 0 && (
                            <>
                                <Row gutter={16} style={{ marginBottom: 24 }}>
                                    <Col xs={24} sm={12}>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Salon</label>
                                            <Select
                                                placeholder="Chọn thương hiệu salon..."
                                                style={{ width: "100%" }}
                                                size="large"
                                                value={selectedSalonId}
                                                onChange={(val) => {
                                                    setSelectedSalonId(val);
                                                    setBranches([]);
                                                    setSelectedBranchId(null);
                                                }}
                                                options={salons.map(s => ({ label: s.name, value: s.id }))}
                                            />
                                        </div>
                                    </Col>

                                    <Col xs={24} sm={12}>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Chi nhánh</label>
                                            <Select
                                                placeholder="Chọn cơ sở chi nhánh gần bạn..."
                                                style={{ width: "100%" }}
                                                size="large"
                                                disabled={!selectedSalonId}
                                                value={selectedBranchId}
                                                onChange={setSelectedBranchId}
                                                options={branches.map(b => ({ label: b.name, value: b.id }))}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <Divider style={{ margin: "24px 0" }} />
                            </>
                        )}

                        {loading ? (
                            <div style={{ textAlign: "center", padding: "100px 0" }}>
                                <Spin size="large" tip="Đang tải dữ liệu chi nhánh..." />
                            </div>
                        ) : (
                            <>
                                {/* ── BƯỚC 1: CHỌN DỊCH VỤ / COMBO ────────────────── */}
                                {currentStep === 0 && (
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
                                )}

                                {/* ── BƯỚC 2: CHỌN NHÂN VIÊN & NGÀY HẸN (ĐƠN / ĐỊNH KỲ) ── */}
                                {currentStep === 1 && (
                                    <div>
                                        <Segmented
                                            options={[
                                                { label: "Đặt lịch thường (Một lần)", value: "normal" },
                                                { label: "Đặt lịch định kỳ 🔄", value: "recurring" }
                                            ]}
                                            value={isRecurringMode ? "recurring" : "normal"}
                                            onChange={(value) => {
                                                setIsRecurringMode(value === "recurring");
                                                setSelectedStaff(null);
                                                setSelectedDate(null);
                                                setRecurringPreviewList([]);
                                            }}
                                            size="large"
                                            block
                                            style={{ marginBottom: 24 }}
                                        />

                                        {!isRecurringMode ? (
                                            <NormalBookingForm
                                                selectedDate={selectedDate}
                                                setSelectedDate={setSelectedDate}
                                                setSelectedStaff={setSelectedStaff}
                                                loadingStaff={loadingStaff}
                                                getQualifiedStaff={getQualifiedStaff}
                                                selectedStaff={selectedStaff}
                                            />
                                        ) : (
                                            <RecurringBookingForm
                                                services={services}
                                                selectedServices={selectedServices}
                                                selectedBundle={selectedBundle}
                                                bookingType={bookingType}
                                                recurringServiceId={recurringServiceId}
                                                setRecurringServiceId={setRecurringServiceId}
                                                recurringPattern={recurringPattern}
                                                setRecurringPattern={setRecurringPattern}
                                                recurringStartDate={recurringStartDate}
                                                setRecurringStartDate={setRecurringStartDate}
                                                recurringEndDate={recurringEndDate}
                                                setRecurringEndDate={setRecurringEndDate}
                                                recurringTime={recurringTime}
                                                setRecurringTime={setRecurringTime}
                                                getQualifiedStaff={getQualifiedStaff}
                                                selectedStaff={selectedStaff}
                                                setSelectedStaff={setSelectedStaff}
                                                recurringPreviewList={recurringPreviewList}
                                                setRecurringPreviewList={setRecurringPreviewList}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* ── BƯỚC 3: CHỌN GIỜ & GHI CHÚ ──────────────────── */}
                                {currentStep === 2 && (
                                    <StepTimeSlots
                                        loadingSlots={loadingSlots}
                                        generateAllTimeSlots={generateAllTimeSlots}
                                        availableTimes={availableTimes}
                                        selectedTime={selectedTime}
                                        setSelectedTime={setSelectedTime}
                                        notes={notes}
                                        setNotes={setNotes}
                                        paymentMethod={paymentMethod}
                                        setPaymentMethod={setPaymentMethod}
                                        customerPhone={customerPhone}
                                        setCustomerPhone={setCustomerPhone}
                                    />
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

                                    {isRecurringMode && currentStep === 1 ? (
                                        recurringPreviewList.length === 0 ? (
                                            <Button
                                                type="primary"
                                                size="large"
                                                onClick={handleRecurringPreview}
                                                loading={loadingPreview}
                                                icon={<RetweetOutlined />}
                                            >
                                                Xem trước lịch định kỳ
                                            </Button>
                                        ) : (
                                            <Space>
                                                <Button
                                                    size="large"
                                                    onClick={() => setRecurringPreviewList([])}
                                                >
                                                    Thay đổi thiết lập
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    size="large"
                                                    onClick={handleConfirmRecurringBooking}
                                                    style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                                    loading={loading}
                                                >
                                                    Xác nhận đặt lịch định kỳ
                                                </Button>
                                            </Space>
                                        )
                                    ) : currentStep < 2 ? (
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
                    <BookingSummary
                        isRecurringMode={isRecurringMode}
                        currentStep={currentStep}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                        bookingType={bookingType}
                        selectedServices={selectedServices}
                        selectedBundle={selectedBundle}
                        selectedStaff={selectedStaff}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        recurringStartDate={recurringStartDate}
                        recurringEndDate={recurringEndDate}
                        recurringPattern={recurringPattern}
                        recurringTime={recurringTime}
                        services={services}
                        recurringServiceId={recurringServiceId}
                        totalDuration={totalDuration}
                        payableAmount={payableAmount}
                        depositAmount={depositAmount}
                        paymentMethod={paymentMethod}
                        formatCurrency={formatCurrency}
                    />
                </Col>
            </Row>
        </div>
    );
}
