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
    const [paymentMethod, setPaymentMethod] = useState("VNPAY");

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
            const wsBase = API_BASE_URL.replace(/^http/, "ws");
            socket = new WebSocket(`${wsBase}/ws/bookings`);

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

            if (selectedDate) {
                return workingStaffIds.includes(staff.userId);
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
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 0" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
                ✂️ Đặt lịch công khai
            </Title>

            <Steps
                current={currentStep}
                responsive
                style={{ marginBottom: 40 }}
                items={[
                    { title: "Chọn dịch vụ", icon: <AppstoreOutlined /> },
                    { title: "Chọn nhân viên", icon: <TeamOutlined /> },
                    { title: "Chọn giờ & hoàn tất", icon: <CalendarOutlined /> }
                ]}
            />

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", minHeight: 480 }}>
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

                                {currentStep === 1 && (
                                    <div>
                                        {systemOffDays.length > 0 && (
                                            <div style={{ marginBottom: 20, padding: '12px 16px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 12 }}>
                                                <Text strong style={{ color: '#d46b08' }}>📢 Thông báo Lịch nghỉ lễ / Đóng cửa của Chi nhánh:</Text>
                                                <div style={{ marginTop: 4 }}>
                                                    {systemOffDays.map(off => (
                                                        <div key={off.id} style={{ fontSize: 13, color: '#8c6b00', marginTop: 2 }}>
                                                            • <b>{off.title}</b> ({dayjs(off.dateFrom).format("DD/MM/YYYY")} ➔ {dayjs(off.dateTo).format("DD/MM/YYYY")}): Các ngày này đã được khóa đặt lịch.
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginBottom: 24 }}>
                                            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Chọn Ngày hẹn</label>
                                            <DatePicker
                                                style={{ width: "100%" }}
                                                size="large"
                                                format="YYYY-MM-DD"
                                                disabledDate={current => {
                                                    if (!current) return false;
                                                    if (current.valueOf() < Date.now() - 24 * 60 * 60 * 1000) return true;
                                                    const dateStr = current.format("YYYY-MM-DD");
                                                    return systemOffDays.some(off => dateStr >= off.dateFrom && dateStr <= off.dateTo);
                                                }}
                                                value={selectedDate}
                                                onChange={setSelectedDate}
                                                placeholder="Chọn ngày bạn muốn hẹn lịch..."
                                            />
                                        </div>

                                        <Divider style={{ margin: "24px 0" }} />

                                        <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>Chọn Nhân viên thực hiện</label>
                                        {loadingStaff ? (
                                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                                <Spin tip="Đang tải danh sách nhân viên..." />
                                            </div>
                                        ) : (
                                            <Row gutter={[16, 16]}>
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
                                                                        {staff.specialties || (staff.bio || "Thợ làm tóc chuyên nghiệp")}
                                                                    </Text>
                                                                </div>
                                                            </Space>
                                                        </Card>
                                                    </Col>
                                                );
                                                })}
                                            </Row>
                                        )}

                                        {!loadingStaff && getQualifiedStaff().length === 0 && (
                                            <div style={{ marginTop: 12 }}>
                                                <Text type="secondary">Chi nhánh này chưa có nhân viên phù hợp cho dịch vụ đã chọn vào ngày này.</Text>
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                                                                    ? "#52c41a"
                                                                                    : isAvailable
                                                                                        ? "#f6ffed"
                                                                                        : "#fff1f0",
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
                                                    }

                                                    return (
                                                        <div style={{ padding: "30px 10px", background: "#fff2e8", borderRadius: 8, border: "1px solid #ffbb96", marginBottom: 24, textAlign: "center" }}>
                                                            <Text type="warning" strong>Vui lòng hoàn thành chọn chi nhánh, dịch vụ, nhân viên và ngày hẹn ở các bước trước để quét giờ hoạt động.</Text>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        <Divider style={{ margin: "24px 0" }} />

                                        <Row gutter={16}>
                                            <Col xs={24} md={12}>
                                                <FormLayoutItem label="Họ và tên">
                                                    <Input size="large" placeholder="Nhập họ tên của bạn" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                                                </FormLayoutItem>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <FormLayoutItem label="Số điện thoại">
                                                    <Input size="large" placeholder="Nhập số điện thoại liên hệ" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                                                </FormLayoutItem>
                                            </Col>
                                            <Col xs={24}>
                                                <FormLayoutItem label="Email (Không bắt buộc)">
                                                    <Input size="large" placeholder="Nhập email để nhận thông báo" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                                                </FormLayoutItem>
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: "24px 0" }} />

                                        <FormLayoutItem label="Ghi chú thêm (Không bắt buộc)">
                                            <Input.TextArea rows={4} placeholder="Mô tả các yêu cầu đặc biệt của bạn để salon chuẩn bị tốt nhất..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                                        </FormLayoutItem>

                                        <Divider style={{ margin: "24px 0" }} />

                                        <FormLayoutItem label="Phương thức thanh toán">
                                            <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: "100%" }}>
                                                <Space direction="vertical" style={{ width: "100%" }}>
                                                    <Radio value="VNPAY" style={{ padding: "4px 0", fontSize: 15 }}>
                                                        <Text strong>Thanh toán Online qua cổng VNPay</Text> (Thanh toán cọc online bằng thẻ nội địa/QR Code)
                                                    </Radio>
                                                </Space>
                                            </Radio.Group>
                                            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                                                💡 Đặt lịch trực tuyến áp dụng thanh toán cọc online qua VNPay. Phần tiền còn lại sẽ được thanh toán trực tiếp tại salon khi làm dịch vụ.
                                            </Text>
                                        </FormLayoutItem>
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
                                        <Button type="primary" size="large" onClick={handleConfirmBooking} disabled={!selectedTime} style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}>
                                            Xác nhận đặt lịch
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)", position: "sticky", top: 24 }}>
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
                                            <div style={{ fontSize: 12, color: "#8c8c8c" }}>Gói combo gồm nhiều dịch vụ kết hợp</div>
                                        </div>
                                    ) : (
                                        <Text type="secondary" italic>Chưa chọn combo nào</Text>
                                    )
                                )}
                            </div>

                            <div>
                                <Text type="secondary"><TeamOutlined /> Nhân viên phục vụ:</Text>
                                <br />
                                <Text strong>{selectedStaff ? selectedStaff.name : "-"}</Text>
                            </div>

                            <div>
                                <Text type="secondary"><CalendarOutlined /> Ngày hẹn:</Text>
                                <br />
                                <Text strong>{selectedDate ? selectedDate.format("YYYY-MM-DD") : "-"}</Text>
                            </div>

                            {selectedTime && (
                                <div>
                                    <Text type="secondary"><ClockCircleOutlined /> Giờ hẹn:</Text>
                                    <br />
                                    <Tag color="gold" style={{ fontSize: 14, padding: "2px 8px" }}>
                                        {selectedTime.substring(0, 5)}
                                    </Tag>
                                </div>
                            )}

                            <div>
                                <Text type="secondary">Khách đặt:</Text>
                                <br />
                                <Text strong>{guestName || "-"}</Text>
                            </div>
                        </Space>

                        <Divider style={{ margin: "20px 0" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text type="secondary">Tổng thời gian:</Text>
                            <Text strong>{totalDuration} phút</Text>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <Text type="secondary" style={{ fontSize: 16 }}>Tổng số tiền (Thanh toán tại quầy):</Text>
                            <Text strong style={{ color: "#1890ff", fontSize: 22 }}>{payableAmount.toLocaleString()} đ</Text>
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                💡 Đặt lịch trực tuyến hoàn toàn miễn phí. Khách hàng sẽ thanh toán giá trị dịch vụ trực tiếp tại quầy sau khi thực hiện xong tại Salon.
                            </Text>
                        </div>
                    </Card>
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
