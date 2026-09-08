import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Steps, Select, Button, Typography, Row, Col, Space, Divider, DatePicker, message, Spin, Grid, Radio, Avatar, Tag, Input } from "antd";
import { ShopOutlined, AppstoreOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getPublicBranchesApi } from "@/features/branch/api/branchApi";
import { getPublicSalonsApi } from "@/features/salon/api/salonApi";
import { getPublicServicesByBranchApi, getPublicBundlesByBranchApi } from "@/features/service/api/serviceApi";
import { getPublicStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getPublicAvailabilityApi, createPublicBookingApi, lockSlotApi, unlockSlotApi, unlockSlotKeepAlive } from "../api/bookingApi";
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

const GUEST_BOOKING_CONTEXT_KEY = "salonflow_guest_booking_context";

const getSavedGuestBookingContext = () => {
    try {
        const raw = sessionStorage.getItem(GUEST_BOOKING_CONTEXT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const saveGuestBookingContext = (context) => {
    try {
        sessionStorage.setItem(GUEST_BOOKING_CONTEXT_KEY, JSON.stringify(context));
    } catch (e) {
        console.warn("Failed to save guest booking context:", e);
    }
};

const clearGuestBookingContext = () => {
    try {
        sessionStorage.removeItem(GUEST_BOOKING_CONTEXT_KEY);
    } catch {}
};

// Unique client ID cho vãng lai để giữ chỗ slot trong 5 phút
const getGuestClientId = () => {
    let clientId = sessionStorage.getItem("salonflow_guest_client_id");
    if (!clientId) {
        clientId = "guest_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
        sessionStorage.setItem("salonflow_guest_client_id", clientId);
    }
    return clientId;
};

export default function GuestBookingPage() {
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const savedContextRef = useRef(getSavedGuestBookingContext());
    const initialContext = savedContextRef.current;

    const [currentStep, setCurrentStep] = useState(
        initialContext?.currentStep !== undefined ? initialContext.currentStep : 0
    );
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Đang tải dữ liệu...");
    const [paymentMethod, setPaymentMethod] = useState(initialContext?.paymentMethod || "BANK_TRANSFER");

    // Tọa độ GPS vị trí khách hàng
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState("idle");

    const requestUserLocation = () => {
        if ("geolocation" in navigator) {
            setLocationStatus("requesting");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationStatus("success");
                },
                (error) => {
                    console.warn("Geolocation denied or failed:", error.message);
                    setLocationStatus("denied");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setLocationStatus("denied");
        }
    };

    useEffect(() => {
        requestUserLocation();
    }, []);

    // Chỉ lấy salonId và branchId nếu được truyền qua URL query params (ví dụ từ trang Chi nhánh/Tìm kiếm/Storefront)
    const searchParams = new URLSearchParams(window.location.search);
    const querySalonId = searchParams.get("salonId") ? Number(searchParams.get("salonId")) : null;
    const queryBranchId = searchParams.get("branchId") ? Number(searchParams.get("branchId")) : null;

    // Xóa session cũ nếu người dùng vào đặt lịch trực tiếp không kèm params
    useEffect(() => {
        if (!querySalonId && !queryBranchId) {
            clearGuestBookingContext();
        }
    }, [querySalonId, queryBranchId]);

    const [salons, setSalons] = useState([]);
    const [selectedSalonId, setSelectedSalonId] = useState(querySalonId);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(queryBranchId);
    const [services, setServices] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [bookingType, setBookingType] = useState(initialContext?.bookingType || "service");

    const [selectedStaff, setSelectedStaff] = useState(null);
    const [selectedDate, setSelectedDate] = useState(
        initialContext?.date ? dayjs(initialContext.date) : null
    );
    // Khi F5: slot KHÔNG giữ lock mà để user chọn lại dễ dàng, các ô trở về màu xanh khả dụng
    const [selectedTime, setSelectedTime] = useState(null);
    const [notes, setNotes] = useState(initialContext?.notes || "");

    const [workingStaffIds, setWorkingStaffIds] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    const [guestName, setGuestName] = useState(initialContext?.guestName || "");
    const [guestPhone, setGuestPhone] = useState(initialContext?.guestPhone || "");
    const [guestEmail, setGuestEmail] = useState(initialContext?.guestEmail || "");

    const [availableTimes, setAvailableTimes] = useState([]);
    const [holdingTimes, setHoldingTimes] = useState([]);
    const [lockedSlotKey, setLockedSlotKey] = useState(null);
    const [lockExpiresAt, setLockExpiresAt] = useState(null);
    const [countdownText, setCountdownText] = useState("");
    const lockedSlotKeyRef = useRef(lockedSlotKey);

    useEffect(() => {
        lockedSlotKeyRef.current = lockedSlotKey;
    }, [lockedSlotKey]);

    const [openTime, setOpenTime] = useState(null);
    const [closeTime, setCloseTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);

    // Đếm ngược 5 phút giữ chỗ
    useEffect(() => {
        if (!lockExpiresAt) {
            setCountdownText("");
            return;
        }
        const tick = () => {
            const diff = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
            if (diff <= 0) {
                setCountdownText("");
                setLockedSlotKey(null);
                setLockExpiresAt(null);
                setSelectedTime(null);
                message.warning("Thời gian giữ chỗ (5 phút) đã hết. Vui lòng chọn lại khung giờ.");
                setRefreshCounter(prev => prev + 1);
            } else {
                const minutes = Math.floor(diff / 60);
                const seconds = diff % 60;
                setCountdownText(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
            }
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [lockExpiresAt]);

    // Khi component mount: nếu có slot đang lock dở từ phiên trước (trước khi F5), mở khóa ngay trên Redis
    useEffect(() => {
        const lastSlotKey = initialContext?.lastLockedSlotKey;
        if (lastSlotKey) {
            const clientId = getGuestClientId();
            unlockSlotApi({ slotKey: lastSlotKey, clientId }).catch(() => {});
            const ctx = getSavedGuestBookingContext();
            if (ctx) {
                delete ctx.lastLockedSlotKey;
                saveGuestBookingContext(ctx);
            }
        }
    }, []);

    // Giải phóng slot khi reload trang (F5), chuyển trang hoặc đóng tab
    useEffect(() => {
        const handleUnload = () => {
            if (lockedSlotKeyRef.current) {
                const clientId = getGuestClientId();
                unlockSlotKeepAlive(lockedSlotKeyRef.current, clientId);
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        window.addEventListener("pagehide", handleUnload);
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
            window.removeEventListener("pagehide", handleUnload);
            if (lockedSlotKeyRef.current) {
                const clientId = getGuestClientId();
                unlockSlotKeepAlive(lockedSlotKeyRef.current, clientId);
            }
        };
    }, []);

    // Hủy giữ chỗ khi khách đổi chi nhánh, ngày hẹn hoặc nhân viên
    useEffect(() => {
        if (lockedSlotKey) {
            const clientId = getGuestClientId();
            unlockSlotApi({ slotKey: lockedSlotKey, clientId }).catch(() => {});
            setLockedSlotKey(null);
            setLockExpiresAt(null);
            setSelectedTime(null);
        }
    }, [selectedBranchId, selectedDate, selectedStaff, bookingType, selectedBundle]);

    // Tự động lưu ngữ cảnh đặt lịch của khách vãng lai
    useEffect(() => {
        if (!selectedSalonId && !selectedBranchId) return;
        const ctx = {
            salonId: selectedSalonId,
            branchId: selectedBranchId,
            bookingType,
            serviceIds: selectedServices.map(s => s.id),
            bundleId: selectedBundle?.id || null,
            staffId: selectedStaff?.id || null,
            date: selectedDate ? (typeof selectedDate.format === "function" ? selectedDate.format("YYYY-MM-DD") : String(selectedDate)) : null,
            currentStep,
            notes,
            paymentMethod,
            guestName,
            guestPhone,
            guestEmail,
            lastLockedSlotKey: lockedSlotKey
        };
        saveGuestBookingContext(ctx);
    }, [selectedSalonId, selectedBranchId, bookingType, selectedServices, selectedBundle, selectedStaff, selectedDate, currentStep, notes, paymentMethod, guestName, guestPhone, guestEmail, lockedSlotKey]);

    useEffect(() => {
        let socket = null;
        let reconnectTimer = null;

        const connectWS = () => {
            const socketUrl = getWebSocketUrl("/ws/bookings");
            socket = new WebSocket(socketUrl);

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (["BOOKING_UPDATE", "SLOT_LOCKED", "SLOT_UNLOCKED"].includes(msg.type)) {
                        const matchBranch = String(msg.branchId) === String(selectedBranchId);
                        const matchDate = selectedDate && msg.date === (typeof selectedDate.format === "function" ? selectedDate.format("YYYY-MM-DD") : String(selectedDate));
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

    const hasRestoredContextRef = useRef(false);

    useEffect(() => {
        const loadSalons = async () => {
            try {
                setLoadingText("Đang tải danh sách Salon...");
                setLoading(true);
                const data = await getPublicSalonsApi();
                setSalons(data);

                // Auto-select salon CHỈ KHI có query param salonId từ URL
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
        if (!selectedSalonId) {
            setBranches([]);
            setSelectedBranchId(null);
            return;
        }

        const loadBranches = async () => {
            try {
                setLoadingText("Đang tải danh sách chi nhánh...");
                setLoading(true);
                const data = await getPublicBranchesApi(selectedSalonId);
                setBranches(data);

                // Auto-select branch CHỈ KHI có query param branchId từ URL
                const searchParams = new URLSearchParams(window.location.search);
                const queryBranchId = searchParams.get("branchId");
                if (queryBranchId && data.some(b => String(b.id) === String(queryBranchId))) {
                    setSelectedBranchId(Number(queryBranchId));
                } else if (selectedBranchId && data.some(b => b.id === selectedBranchId)) {
                    // Giữ nguyên branchId hiện tại nếu thuộc salon đang chọn
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
                setLoadingText("Đang tải thông tin dịch vụ...");
                setLoading(true);

                const [servicesData, bundlesData, staffData] = await Promise.all([
                    getPublicServicesByBranchApi(selectedBranchId),
                    getPublicBundlesByBranchApi(selectedBranchId),
                    getPublicStaffByBranchApi(selectedBranchId)
                ]);

                const activeServices = (servicesData || []).filter(s => s.isActive !== false);
                setServices(activeServices);
                setBundles(bundlesData || []);
                setStaffList(staffData || []);

                // Khôi phục từ initialContext nếu cùng chi nhánh (sau F5)
                if (!hasRestoredContextRef.current && initialContext && initialContext.branchId === selectedBranchId) {
                    hasRestoredContextRef.current = true;
                    if (initialContext.bookingType === "bundle" && initialContext.bundleId) {
                        const matchedBundle = (bundlesData || []).find(b => b.id === initialContext.bundleId);
                        if (matchedBundle) setSelectedBundle(matchedBundle);
                    } else if (initialContext.serviceIds && initialContext.serviceIds.length > 0) {
                        const matched = activeServices.filter(s => initialContext.serviceIds.includes(s.id));
                        if (matched.length > 0) setSelectedServices(matched);
                    }
                    if (initialContext.staffId) {
                        const matchedStaff = (staffData || []).find(s => s.id === initialContext.staffId || s.userId === initialContext.staffId);
                        if (matchedStaff) setSelectedStaff(matchedStaff);
                    }
                } else if (hasRestoredContextRef.current) {
                    // Nếu user chủ động đổi chi nhánh sau khi đã mount: reset lựa chọn
                    setSelectedServices([]);
                    setSelectedBundle(null);
                    setSelectedStaff(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setAvailableTimes([]);
                }

                // Auto-select service from URL query params if present
                const searchParams = new URLSearchParams(window.location.search);
                const queryServiceId = searchParams.get("serviceId");
                if (queryServiceId) {
                    const targetService = activeServices.find(s => String(s.id) === String(queryServiceId));
                    if (targetService) {
                        setSelectedServices([targetService]);
                    }
                }

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

                const dateStr = typeof selectedDate.format === "function" ? selectedDate.format("YYYY-MM-DD") : String(selectedDate);
                const params = { date: dateStr };
                if (bookingType === "service") {
                    params.serviceIds = selectedServices.map(s => s.id).join(",");
                } else {
                    params.bundleId = selectedBundle.id;
                }

                const data = await getPublicAvailabilityApi(selectedBranchId, selectedStaff.id, params);
                setAvailableTimes(data.availableStartTimes || []);
                setHoldingTimes(data.holdingStartTimes || []);
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

    // Xử lý khi khách vãng lai nhấp chọn một khung giờ -> gọi API lock slot 5 phút
    const handleSelectSlot = async (time) => {
        if (!time) return;
        const normalizedTime = time.length === 5 ? `${time}:00` : time;
        if (selectedTime === time && lockedSlotKey) return;

        const dateStr = typeof selectedDate?.format === "function" ? selectedDate.format("YYYY-MM-DD") : String(selectedDate);
        if (!selectedBranchId || !dateStr || !selectedStaff) {
            message.warning("Vui lòng chọn nhân viên và ngày trước khi chọn giờ.");
            return;
        }

        try {
            const { duration: totalDuration } = getBookingSummary();
            const clientId = getGuestClientId();
            const payload = {
                branchId: selectedBranchId,
                staffId: selectedStaff.id,
                bookingDate: dateStr,
                startTime: normalizedTime,
                durationMinutes: totalDuration || 30,
                clientId,
                previousSlotKey: lockedSlotKey || null
            };
            if (bookingType === "service") {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else if (selectedBundle) {
                payload.bundleId = selectedBundle.id;
            }

            const res = await lockSlotApi(payload);
            setLockedSlotKey(res.slotKey);
            setLockExpiresAt(Date.now() + (res.ttlSeconds || 300) * 1000);
            setSelectedTime(time);
            message.success("Đã giữ chỗ khung giờ thành công trong 5 phút!");
        } catch (error) {
            if (error.response?.status === 409) {
                message.error("Khung giờ này vừa có khách khác giữ chỗ. Vui lòng chọn khung giờ khác!");
            } else {
                message.error(error.response?.data?.message || "Không thể giữ chỗ khung giờ này.");
            }
            setRefreshCounter(prev => prev + 1);
        }
    };

    // Xác định dịch vụ chính trong combo (giá cao nhất hoặc thời lượng lâu nhất)
    const getPrimaryServiceId = (bundle) => {
        if (!bundle?.items || bundle.items.length === 0) return null;
        const sorted = [...bundle.items].sort((a, b) => {
            const priceDiff = Number(b.price || 0) - Number(a.price || 0);
            if (priceDiff !== 0) return priceDiff;
            return Number(b.durationMinutes || 0) - Number(a.durationMinutes || 0);
        });
        return sorted[0]?.serviceId;
    };

    // Xác định dịch vụ chính trong danh sách dịch vụ lẻ
    const getPrimaryService = (serviceList) => {
        if (!serviceList || serviceList.length === 0) return null;
        const sorted = [...serviceList].sort((a, b) => {
            const priceDiff = Number(b.price || 0) - Number(a.price || 0);
            if (priceDiff !== 0) return priceDiff;
            return Number(b.durationMinutes || 0) - Number(a.durationMinutes || 0);
        });
        return sorted[0];
    };

    // Kiểm tra xem chi nhánh có thợ nào làm được TẤT CẢ các dịch vụ lẻ đã chọn không
    const hasAllRoundStaffForServices = useMemo(() => {
        if (bookingType !== "service" || selectedServices.length <= 1) return true;
        return staffList.some(staff => {
            const allowedIds = (staff.services || []).map(s => s.id);
            if (allowedIds.length === 0) return true; // Thợ đa năng làm được tất cả
            return selectedServices.every(s => allowedIds.includes(s.id));
        });
    }, [bookingType, selectedServices, staffList]);

    // Lọc danh sách nhân viên có kỹ năng thực hiện dịch vụ và có làm việc trong ngày đã chọn
    // Đối với combo hoặc nhiều dịch vụ lẻ không có ai bao trọn: Áp dụng cơ chế Thợ chính (Primary Stylist)
    const getQualifiedStaff = () => {
        const primaryServiceForMulti = !hasAllRoundStaffForServices ? getPrimaryService(selectedServices) : null;
        const primaryServiceId = bookingType === "bundle"
            ? getPrimaryServiceId(selectedBundle)
            : (primaryServiceForMulti ? primaryServiceForMulti.id : null);

        return staffList.filter(staff => {
            const allowedIds = (staff.services || []).map(s => s.id);
            // Nếu nhân viên chưa gán dịch vụ riêng -> Mặc định làm được tất cả dịch vụ
            if (allowedIds.length === 0) return true;

            const hasSkill = bookingType === "bundle"
                ? (primaryServiceId ? allowedIds.includes(primaryServiceId) : true)
                : (primaryServiceId
                    ? allowedIds.includes(primaryServiceId)
                    : (selectedServices.length > 0 && selectedServices.every(s => allowedIds.includes(s.id))));

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
        if (lockedSlotKey) {
            const clientId = getGuestClientId();
            unlockSlotApi({ slotKey: lockedSlotKey, clientId }).catch(() => {});
            setLockedSlotKey(null);
            setLockExpiresAt(null);
            setSelectedTime(null);
        }
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
            setLoadingText("Đang xử lý đặt lịch hẹn...");
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

            if (userLocation && userLocation.lat && userLocation.lng) {
                payload.customerLatitude = userLocation.lat;
                payload.customerLongitude = userLocation.lng;
            }

            if (guestEmail.trim()) {
                payload.customerEmail = guestEmail.trim();
            }

            if (bookingType === "service") {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else {
                payload.bundleId = selectedBundle.id;
            }

            const res = await createPublicBookingApi(selectedBranchId, payload);
            clearGuestBookingContext();
            setLockedSlotKey(null);
            setLockExpiresAt(null);
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
                Đặt lịch công khai
            </Title>

            <Steps
                current={currentStep}
                responsive={false}
                direction="horizontal"
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
                                <Spin size="large" tip={loadingText} />
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
                                                        clearGuestBookingContext();
                                                        setSelectedSalonId(value);
                                                        setBranches([]);
                                                        setSelectedBranchId(null);
                                                        setSelectedServices([]);
                                                        setSelectedBundle(null);
                                                        setSelectedStaff(null);
                                                        setSelectedDate(null);
                                                        setSelectedTime(null);
                                                        setAvailableTimes([]);
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
                                                    onChange={(value) => {
                                                        clearGuestBookingContext();
                                                        setSelectedBranchId(value);
                                                        setSelectedServices([]);
                                                        setSelectedBundle(null);
                                                        setSelectedStaff(null);
                                                        setSelectedDate(null);
                                                        setSelectedTime(null);
                                                        setAvailableTimes([]);
                                                    }}
                                                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                                                    placeholder={selectedSalonId ? "Chọn chi nhánh..." : "Vui lòng chọn hệ thống Salon trước"}
                                                    disabled={!selectedSalonId}
                                                />
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: "24px 0" }} />

                                        {/* ── BƯỚC 1: CHỌN DỊCH VỤ / COMBO ────────────────── */}
                                        {!selectedBranchId ? (
                                            <div style={{
                                                padding: "60px 24px",
                                                textAlign: "center",
                                                background: "#f8fafc",
                                                borderRadius: 16,
                                                border: "1px dashed #cbd5e1",
                                                marginTop: 8
                                            }}>
                                                <ShopOutlined style={{ fontSize: 44, color: "#94a3b8", marginBottom: 12 }} />
                                                <Title level={4} style={{ color: "#334155", marginBottom: 6 }}>
                                                    Vui lòng chọn Salon và Chi nhánh
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: 14 }}>
                                                    Chọn thương hiệu và cơ sở chi nhánh bạn muốn đến để xem danh sách dịch vụ và bảng giá chi tiết.
                                                </Text>
                                            </div>
                                        ) : (
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
                                                staffList={staffList}
                                            />
                                        )}
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
                                        staffList={staffList}
                                    />
                                )}

                                {/* ── BƯỚC 3: CHỌN GIỜ & THÔNG TIN KHÁCH HÀNG ────── */}
                                {currentStep === 2 && (
                                    <div>
                                        <StepTimeSlots
                                            loadingSlots={loadingSlots}
                                            generateAllTimeSlots={generateAllTimeSlots}
                                            availableTimes={availableTimes}
                                            holdingTimes={holdingTimes}
                                            selectedTime={selectedTime}
                                            setSelectedTime={setSelectedTime}
                                            onSelectTime={handleSelectSlot}
                                            countdownText={countdownText}
                                            showCustomerInputs={false}
                                            selectedBranchId={selectedBranchId}
                                            selectedDate={selectedDate}
                                            selectedServices={selectedServices}
                                            selectedBundle={selectedBundle}
                                            bookingType={bookingType}
                                            selectedStaff={selectedStaff}
                                            setSelectedStaff={setSelectedStaff}
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
