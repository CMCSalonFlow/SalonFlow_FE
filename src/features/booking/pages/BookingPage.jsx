import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Steps, Select, Button, Typography, Row, Col, Space, Divider, message, Spin, Grid } from "antd";
import { AppstoreOutlined, TeamOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined, ShopOutlined } from "@ant-design/icons";
import { getPublicBranchesApi } from "@/features/branch/api/branchApi";
import { getPublicSalonsApi } from "@/features/salon/api/salonApi";
import { getServicesByBranchApi, getBundlesByBranchApi } from "@/features/service/api/serviceApi";
import { getStaffByBranchApi } from "@/features/staff/api/staffApi";
import { getAvailabilityApi, createBookingApi, lockSlotApi, unlockSlotApi, unlockSlotKeepAlive } from "../api/bookingApi";
import { createPaymentUrlApi } from "@/features/payment/api/paymentApi";
import { getAvailabilitySlots } from "@/features/shift/api/shiftApi";
import { API_BASE_URL } from "@/core/api/endpoints";
import { getUserByIdApi } from "@/features/user/api/userApi";
import { getWebSocketUrl } from "@/core/utils/websocket";
import dayjs from "dayjs";

// Import refactored components
import BookingSummary from "../components/BookingSummary";
import StepServiceSelection from "../components/StepServiceSelection";
import StepTimeSlots from "../components/StepTimeSlots";
import NormalBookingForm from "../components/NormalBookingForm";
import AiBookingChatbot from "@/features/chatbot/components/AiBookingChatbot";

import offdayApi from "@/features/offday/api/offdayApi";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

const CUSTOMER_BOOKING_CONTEXT_KEY = "salonflow_customer_booking_context";

const getSavedBookingContext = () => {
    try {
        const raw = sessionStorage.getItem(CUSTOMER_BOOKING_CONTEXT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const saveBookingContext = (context) => {
    try {
        sessionStorage.setItem(CUSTOMER_BOOKING_CONTEXT_KEY, JSON.stringify(context));
    } catch (e) {
        console.warn("Failed to save booking context:", e);
    }
};

const clearBookingContext = () => {
    try {
        sessionStorage.removeItem(CUSTOMER_BOOKING_CONTEXT_KEY);
    } catch {}
};

/**
 * Trang Đặt lịch hẹn dành cho Customer đã đăng nhập.
 */
export default function BookingPage() {
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const savedContextRef = useRef(getSavedBookingContext());
    const initialContext = savedContextRef.current;

    const [currentStep, setCurrentStep] = useState(
        initialContext?.currentStep !== undefined ? initialContext.currentStep : 0
    );
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Đang tải dữ liệu chi nhánh...");
    const [paymentMethod, setPaymentMethod] = useState(initialContext?.paymentMethod || "BANK_TRANSFER");
    const [systemOffDays, setSystemOffDays] = useState([]);

    // Tọa độ GPS của vị trí hiện tại khách hàng
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
            clearBookingContext();
        }
    }, [querySalonId, queryBranchId]);

    // Dữ liệu nguồn: mặc định null để khách hàng chủ động chọn Salon & Chi nhánh
    const [salons, setSalons] = useState([]);
    const [selectedSalonId, setSelectedSalonId] = useState(querySalonId);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(queryBranchId);
    const [services, setServices] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [staffList, setStaffList] = useState([]);

    // Lựa chọn của khách hàng
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [bookingType, setBookingType] = useState(initialContext?.bookingType || "service"); // "service" hoặc "bundle"

    const [selectedStaff, setSelectedStaff] = useState(null); // null = "Bất kỳ nhân viên"
    const [selectedDate, setSelectedDate] = useState(
        initialContext?.date ? dayjs(initialContext.date) : null
    );
    // Khi F5: slot KHÔNG giữ lock mà để user chọn lại dễ dàng, các ô trở về màu xanh khả dụng
    const [selectedTime, setSelectedTime] = useState(null);
    const [notes, setNotes] = useState(initialContext?.notes || "");

    // Khung giờ rảnh & Giữ chỗ (Yellow Slot Holding)
    const [availableTimes, setAvailableTimes] = useState([]);
    const [holdingTimes, setHoldingTimes] = useState([]);
    const [lockedSlotKey, setLockedSlotKey] = useState(null);
    const [lockExpiresAt, setLockExpiresAt] = useState(null);
    const [countdownText, setCountdownText] = useState("");
    const lockedSlotKeyRef = useRef(lockedSlotKey);
    // Refs để tránh stale closure trong WebSocket onmessage
    const selectedBranchIdRef = useRef(selectedBranchId);
    const selectedDateRef = useRef(selectedDate);
    const selectedStaffRef = useRef(selectedStaff);

    useEffect(() => {
        lockedSlotKeyRef.current = lockedSlotKey;
    }, [lockedSlotKey]);

    useEffect(() => {
        selectedBranchIdRef.current = selectedBranchId;
    }, [selectedBranchId]);

    useEffect(() => {
        selectedDateRef.current = selectedDate;
    }, [selectedDate]);

    useEffect(() => {
        selectedStaffRef.current = selectedStaff;
    }, [selectedStaff]);

    const [openTime, setOpenTime] = useState(null);
    const [closeTime, setCloseTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);
    const [workingStaffIds, setWorkingStaffIds] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [customerPhone, setCustomerPhone] = useState("");

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
            unlockSlotApi({ slotKey: lastSlotKey }).catch(() => {});
            const ctx = getSavedBookingContext();
            if (ctx) {
                delete ctx.lastLockedSlotKey;
                saveBookingContext(ctx);
            }
        }
    }, []);

    // Giải phóng slot khi reload trang (F5), chuyển trang hoặc đóng tab
    useEffect(() => {
        const handleUnload = () => {
            if (lockedSlotKeyRef.current) {
                unlockSlotKeepAlive(lockedSlotKeyRef.current);
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        window.addEventListener("pagehide", handleUnload);
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
            window.removeEventListener("pagehide", handleUnload);
            if (lockedSlotKeyRef.current) {
                unlockSlotKeepAlive(lockedSlotKeyRef.current);
            }
        };
    }, []);

    // Hủy giữ chỗ khi người dùng đổi chi nhánh, ngày hẹn hoặc nhân viên
    useEffect(() => {
        if (lockedSlotKey) {
            unlockSlotApi({ slotKey: lockedSlotKey }).catch(() => {});
            setLockedSlotKey(null);
            setLockExpiresAt(null);
            setSelectedTime(null);
        }
    }, [selectedBranchId, selectedDate, selectedStaff, bookingType, selectedBundle]);

    // Tự động lưu ngữ cảnh đặt lịch vào sessionStorage (không lưu selectedTime/lockedSlotKey để F5 user chọn lại sạch sẽ)
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
            lastLockedSlotKey: lockedSlotKey
        };
        saveBookingContext(ctx);
    }, [selectedSalonId, selectedBranchId, bookingType, selectedServices, selectedBundle, selectedStaff, selectedDate, currentStep, notes, paymentMethod, lockedSlotKey]);

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

    // WebSocket listener for real-time slot updates (bao gồm BOOKING_UPDATE, SLOT_LOCKED, SLOT_UNLOCKED)
    // Dùng refs để tránh stale closure — WebSocket chỉ reconnect khi branchId thay đổi
    useEffect(() => {
        if (!selectedBranchId) return;
        let socket = null;
        let reconnectTimer = null;

        const connectWS = () => {
            const socketUrl = getWebSocketUrl("/ws/bookings");

            socket = new WebSocket(socketUrl);

            socket.onopen = () => {
                // WebSocket connected
            };

            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (["BOOKING_UPDATE", "SLOT_LOCKED", "SLOT_UNLOCKED"].includes(msg.type)) {
                        // Dùng refs để đọc giá trị hiện tại (tránh stale closure)
                        const curBranchId = selectedBranchIdRef.current;
                        const curDate = selectedDateRef.current;
                        const curStaff = selectedStaffRef.current;

                        const matchBranch = String(msg.branchId) === String(curBranchId);
                        const matchDate = !curDate || msg.date === (typeof curDate.format === "function" ? curDate.format("YYYY-MM-DD") : String(curDate));
                        // Nếu user chưa chọn thợ -> nhận mọi update của bất kỳ thợ nào trong chi nhánh
                        const matchStaff = !curStaff || !msg.staffId || String(msg.staffId) === String(curStaff.id || curStaff.userId);

                        if (matchBranch && matchDate && matchStaff) {
                            setRefreshCounter(prev => prev + 1);
                        }
                    }
                } catch (e) {
                    console.error("Error parsing WebSocket message:", e);
                }
            };

            socket.onclose = () => {
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
    // ⚠️ Chỉ reconnect khi branchId thay đổi — date/staff dùng refs để tránh reconnect liên tục
    }, [selectedBranchId]);

    const hasRestoredContextRef = useRef(false);

    // 1. Tải danh sách Salon khi vào trang
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

    // 2. Tải danh sách chi nhánh khi thay đổi Salon
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

    // 2. Tải thông tin dịch vụ, combo và nhân viên khi thay đổi chi nhánh
    useEffect(() => {
        if (!selectedBranchId) return;

        const loadBranchData = async () => {
            try {
                setLoadingText("Đang tải thông tin dịch vụ...");
                setLoading(true);

                const [servicesData, bundlesData, staffData] = await Promise.all([
                    getServicesByBranchApi(selectedBranchId),
                    getBundlesByBranchApi(selectedBranchId, true), // Chỉ lấy combo đang hoạt động
                    getStaffByBranchApi(selectedBranchId)
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
                message.error("Lỗi tải thông tin dịch vụ và nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        loadBranchData();
    }, [selectedBranchId]);

    // Tải danh sách nhân viên làm việc vào ngày đã chọn
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
        }, 0);

        return () => window.clearTimeout(timerId);
    }, [selectedBranchId, selectedDate]);

    // 3. Tải danh sách khung giờ rảnh khi có đóng Ngày, Dịch vụ/Combo, và Thợ
    useEffect(() => {
        if (!selectedBranchId || !selectedDate) return;
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

                if (selectedStaff) {
                    params.staffId = selectedStaff.id;
                }

                const data = await getAvailabilityApi(selectedBranchId, params);
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

    // Xử lý khi khách hàng nhấp chọn một khung giờ -> gọi API lock slot 5 phút
    const handleSelectSlot = async (time) => {
        if (!time) return;
        const normalizedTime = time.length === 5 ? `${time}:00` : time;
        // Nếu slot đang chọn lại đúng slot cũ thì bỏ qua
        if (selectedTime === time && lockedSlotKey) return;

        const dateStr = typeof selectedDate.format === "function" ? selectedDate.format("YYYY-MM-DD") : String(selectedDate);
        if (!selectedBranchId || !dateStr) {
            message.warning("Vui lòng chọn ngày trước khi chọn giờ.");
            return;
        }

        // ✅ Reset UI ngay lập tức khi user chọn slot mới (trước khi API trả về)
        // Dừng countdown cũ và bỏ trạng thái selected của slot cũ ngay tức thì
        const prevSlotKey = lockedSlotKey;
        setSelectedTime(null);
        setLockedSlotKey(null);
        setLockExpiresAt(null);
        setCountdownText("");

        try {
            const { duration: totalDuration } = getBookingSummary();
            const payload = {
                branchId: selectedBranchId,
                staffId: selectedStaff ? selectedStaff.id : null,
                bookingDate: dateStr,
                startTime: normalizedTime,
                durationMinutes: totalDuration || 30,
                // Backend sẽ tự động unlock slot cũ khi nhận previousSlotKey (atomic unlock + lock)
                previousSlotKey: prevSlotKey || null
            };
            if (bookingType === "service") {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else if (selectedBundle) {
                payload.bundleId = selectedBundle.id;
            }

            const res = await lockSlotApi(payload);
            // ✅ Cập nhật state với thông tin slot mới được lock thành công
            setLockedSlotKey(res.slotKey);
            setLockExpiresAt(Date.now() + (res.ttlSeconds || 300) * 1000);
            setSelectedTime(time);
            message.success("Đã giữ chỗ khung giờ thành công trong 5 phút!");

            if (!selectedStaff && res.assignedStaffId) {
                const matchedStaff = staffList.find(s => Number(s.id) === Number(res.assignedStaffId) || Number(s.userId) === Number(res.assignedStaffId));
                if (matchedStaff) {
                    setSelectedStaff(matchedStaff);
                }
            }

            // ✅ Trigger refresh để đồng bộ trạng thái slots ngay sau khi lock thành công
            setRefreshCounter(prev => prev + 1);
        } catch (error) {
            // ✅ Nếu lock thất bại, không khôi phục slot cũ (đã được unlock ngay trên UI)
            // Trigger refresh để hiển thị trạng thái slots mới nhất từ server
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

    // Lọc danh sách nhân viên có đủ kỹ năng thực hiện các dịch vụ đã chọn và có lịch làm việc
    // Đối với combo hoặc nhiều dịch vụ lẻ không có ai bao trọn: Áp dụng cơ chế Thợ chính (Primary Stylist)
    const MANAGER_ROLES = ["MANAGER", "BRANCH_MANAGER", "SALON_OWNER", "SYSTEM_ADMIN"];
    const getQualifiedStaff = () => {
        const primaryServiceForMulti = !hasAllRoundStaffForServices ? getPrimaryService(selectedServices) : null;
        const primaryServiceId = bookingType === "bundle"
            ? getPrimaryServiceId(selectedBundle)
            : (primaryServiceForMulti ? primaryServiceForMulti.id : null);

        return staffList.filter(staff => {
            // Loại bỏ quản lý / chủ salon khỏi danh sách thợ đặt lịch
            if (staff.roleCode && MANAGER_ROLES.includes(staff.roleCode.toUpperCase())) return false;

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
        if (lockedSlotKey) {
            unlockSlotApi({ slotKey: lockedSlotKey }).catch(() => {});
            setLockedSlotKey(null);
            setLockExpiresAt(null);
            setSelectedTime(null);
        }
        setCurrentStep(currentStep - 1);
    };

    // Xử lý click trực tiếp vào step đã hoàn thành để quay lại
    const handleStepClick = (step) => {
        if (step >= currentStep) return; // Không cho nhảy về phía trước
        if (step < currentStep) {
            // Nếu đang ở step 2 (chọn giờ) và quay về bước trước -> giải phóng slot lock
            if (currentStep === 2 && lockedSlotKey) {
                unlockSlotApi({ slotKey: lockedSlotKey }).catch(() => {});
                setLockedSlotKey(null);
                setLockExpiresAt(null);
                setSelectedTime(null);
            }
            setCurrentStep(step);
        }
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
            setLoadingText("Đang xử lý đặt lịch hẹn...");
            setLoading(true);
            const payload = {
                bookingDate: selectedDate.format("YYYY-MM-DD"),
                startTime: selectedTime,
                preferredStaffId: selectedStaff ? selectedStaff.id : null,
                notes,
                customerPhone,
                paymentMethod: "PAY_AT_COUNTER"
            };

            if (userLocation && userLocation.lat && userLocation.lng) {
                payload.customerLatitude = userLocation.lat;
                payload.customerLongitude = userLocation.lng;
            }

            if (bookingType === "service") {
                payload.serviceIds = selectedServices.map(s => s.id);
            } else {
                payload.bundleId = selectedBundle.id;
            }

            const res = await createBookingApi(selectedBranchId, payload);
            clearBookingContext();
            setLockedSlotKey(null);
            setLockExpiresAt(null);
            const bookingDetail = {
                ...res,
                branchId: selectedBranchId,
                depositAmount: Number(res.depositAmount || getBookingDepositAmount() || res.totalPrice || 0),
                totalPrice: Number(res.totalPrice || totalPrice || 0)
            };
            sessionStorage.setItem("salonflow_last_pay_at_counter_booking", JSON.stringify(bookingDetail));

            message.success("Đặt lịch hẹn thành công!");
            navigate("/booking/pay-at-counter-success", {
                state: {
                    booking: bookingDetail
                }
            });
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
                Đặt lịch dịch vụ làm đẹp
            </Title>

            <Steps
                current={currentStep}
                responsive={false}
                direction="horizontal"
                size={screens.xs ? "small" : "default"}
                style={{ marginBottom: screens.xs ? 20 : 40 }}
                onChange={handleStepClick}
                items={[
                    {
                        title: screens.xs ? "Dịch vụ" : "Chọn dịch vụ",
                        icon: <AppstoreOutlined />,
                        style: currentStep > 0 ? { cursor: "pointer" } : {}
                    },
                    {
                        title: screens.xs ? "Ngày & Thợ" : "Chọn ngày & nhân viên",
                        icon: <TeamOutlined />,
                        style: currentStep > 1 ? { cursor: "pointer" } : {}
                    },
                    {
                        title: screens.xs ? "Giờ & Xong" : "Chọn giờ & hoàn tất",
                        icon: <ClockCircleOutlined />,
                        style: { cursor: "default" }
                    }
                ]}
            />

            <Row gutter={[24, 24]}>
                {/* Cột trái: Form cấu hình theo từng bước */}
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }} bodyStyle={{ padding: screens.xs ? "14px 12px" : "24px" }}>
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
                                                    clearBookingContext();
                                                    setSelectedSalonId(val);
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
                                                onChange={(val) => {
                                                    clearBookingContext();
                                                    setSelectedBranchId(val);
                                                    setSelectedServices([]);
                                                    setSelectedBundle(null);
                                                    setSelectedStaff(null);
                                                    setSelectedDate(null);
                                                    setSelectedTime(null);
                                                    setAvailableTimes([]);
                                                }}
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
                                <Spin size="large" tip={loadingText} />
                            </div>
                        ) : (
                            <>
                                {/* ── BƯỚC 1: CHỌN DỊCH VỤ / COMBO ────────────────── */}
                                {currentStep === 0 && (
                                    !selectedBranchId ? (
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
                                    )
                                )}

                                {/* ── BƯỚC 2: CHỌN NHÂN VIÊN & NGÀY HẸN (ĐƠN / ĐỊNH KỲ) ── */}
                                {/* ── BƯỚC 2: CHỌN NHÂN VIÊN & NGÀY HẸN ────────────────── */}
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

                                {/* ── BƯỚC 3: CHỌN GIỜ & GHI CHÚ ──────────────────── */}
                                {currentStep === 2 && (
                                    <StepTimeSlots
                                        loadingSlots={loadingSlots}
                                        generateAllTimeSlots={generateAllTimeSlots}
                                        availableTimes={availableTimes}
                                        holdingTimes={holdingTimes}
                                        selectedTime={selectedTime}
                                        setSelectedTime={setSelectedTime}
                                        onSelectTime={handleSelectSlot}
                                        countdownText={countdownText}
                                        notes={notes}
                                        setNotes={setNotes}
                                        paymentMethod={paymentMethod}
                                        setPaymentMethod={setPaymentMethod}
                                        customerPhone={customerPhone}
                                        setCustomerPhone={setCustomerPhone}
                                        selectedBranchId={selectedBranchId}
                                        selectedDate={selectedDate}
                                        selectedServices={selectedServices}
                                        selectedBundle={selectedBundle}
                                        bookingType={bookingType}
                                        selectedStaff={selectedStaff}
                                        setSelectedStaff={setSelectedStaff}
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
                        totalDuration={totalDuration}
                        payableAmount={payableAmount}
                    />
                </Col>
            </Row>

            <AiBookingChatbot
                branchId={selectedBranchId}
                branchName={selectedBranchName}
                bookingMode="customer"
                onHumanHandoff={() => {
                    setCurrentStep(0);
                    message.info("Bạn có thể tiếp tục đặt lịch bằng biểu mẫu thường.");
                }}
            />
        </div>
    );
}
