import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Input,
    Tag,
    Space,
    Divider,
    Select,
    Modal,
    InputNumber,
    message,
    Tooltip
} from "antd";
import {
    CopyOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    PrinterOutlined,
    TagOutlined,
    ShopOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    CheckOutlined,
    ArrowLeftOutlined,
    CloseCircleOutlined
} from "@ant-design/icons";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import { getBookingsByBranchApi, getBookingByIdApi, completeBookingApi } from "@/features/booking/api/bookingApi";
import { processPosCashPaymentApi, getPaymentStatusApi, autoConfirmBankTransferApi } from "@/features/payment/api/paymentApi";
import { validateVoucher } from "@/features/voucher/api/voucherApi";
import { getInvoiceUrl } from "@/features/media/api/mediaApi";

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (val) => Number(val || 0).toLocaleString("vi-VN") + "đ";

const POPULAR_BANKS = [
    { code: "MBBank", name: "MBBank (NCT CP Quân Đội)", bin: "970422" },
    { code: "VCB", name: "Vietcombank", bin: "970436" },
    { code: "TCB", name: "Techcombank", bin: "970407" },
    { code: "ACB", name: "ACB (Á Châu)", bin: "970416" },
    { code: "VPB", name: "VPBank", bin: "970432" },
    { code: "BIDV", name: "BIDV", bin: "970418" },
    { code: "CTG", name: "VietinBank", bin: "970415" },
    { code: "TPB", name: "TPBank", bin: "970423" }
];

export default function ManagerCheckoutPage({ initialBooking = null, isModalMode = false, onCloseModal }) {
    const { bookingId: paramBookingId } = useParams();
    const navigate = useNavigate();

    // States for branch & booking selection
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(null);
    const [branchBookings, setBranchBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState(initialBooking?.id || paramBookingId || null);
    const [booking, setBooking] = useState(initialBooking);

    const [loadingData, setLoadingData] = useState(false);
    const [completing, setCompleting] = useState(false);

    // Bank Account Settings (Default or configurable)
    const [bankAccount, setBankAccount] = useState({
        bankCode: "MBBank",
        accountNo: "0001247370390",
        accountName: "NGUYEN TRUNG DUC"
    });

    // Voucher state
    const [voucherCodeInput, setVoucherCodeInput] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherError, setVoucherError] = useState("");

    // Cash / Transfer payment method option selection
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [cashModalOpen, setCashModalOpen] = useState(false);
    const [cashReceived, setCashReceived] = useState(null);

    // Countdown Timer State (30 mins = 1800s)
    const [timeLeft, setTimeLeft] = useState(1800);

    // Fetch initial branches
    useEffect(() => {
        const initBranches = async () => {
            try {
                const data = await getMyBranchesApi();
                setBranches(data || []);
                if (data && data.length > 0 && !selectedBranchId) {
                    setSelectedBranchId(data[0].id);
                }
            } catch (err) {
                console.error("Failed to load branches:", err);
            }
        };
        initBranches();
    }, []);

    // Load bookings for selected branch
    useEffect(() => {
        if (!selectedBranchId) return;
        const fetchBranchBookings = async () => {
            setLoadingData(true);
            try {
                const list = await getBookingsByBranchApi(selectedBranchId);
                const activeList = (list || []).filter(b => b.status !== "CANCELLED");
                setBranchBookings(activeList);

                if (!selectedBookingId && activeList.length > 0) {
                    setSelectedBookingId(activeList[0].id);
                    setBooking(activeList[0]);
                }
            } catch (err) {
                console.error("Failed to fetch branch bookings:", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchBranchBookings();
    }, [selectedBranchId]);

    // Handle initialBooking update
    useEffect(() => {
        if (initialBooking) {
            setBooking(initialBooking);
            setSelectedBookingId(initialBooking.id);
            if (initialBooking.branchId) {
                setSelectedBranchId(initialBooking.branchId);
            }
        }
    }, [initialBooking]);

    // When selectedBookingId changes, find booking or fetch detail
    useEffect(() => {
        if (!selectedBookingId) return;
        const found = branchBookings.find(b => String(b.id) === String(selectedBookingId));
        if (found) {
            setBooking(found);
        } else if (selectedBranchId) {
            getBookingByIdApi(selectedBranchId, selectedBookingId)
                .then(res => setBooking(res))
                .catch(() => {});
        }
    }, [selectedBookingId, branchBookings]);

    // Timer countdown effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Real-time polling effect to detect payment confirmation / webhook / backend updates
    useEffect(() => {
        if (!booking?.id || booking.status === "COMPLETED") return;

        const pollInterval = setInterval(async () => {
            try {
                if (selectedBranchId) {
                    const updated = await getBookingByIdApi(selectedBranchId, booking.id);
                    if (updated && updated.status === "COMPLETED") {
                        message.success(`Đơn hàng #${booking.id} đã được tự động xác nhận hoàn tất thanh toán!`);
                        setBooking(updated);
                        if (isModalMode && onCloseModal) {
                            setTimeout(() => onCloseModal(true), 1200);
                        }
                    }
                }
            } catch (err) {
                // silent catch during background polling
            }
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [booking?.id, booking?.status, selectedBranchId, isModalMode, onCloseModal]);

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // Calculate Pricing
    const rawItems = useMemo(() => {
        if (!booking) return [];
        if (Array.isArray(booking.items) && booking.items.length > 0) {
            return booking.items.map(item => ({
                id: item.id || item.serviceId,
                name: item.serviceName || item.name || "Dịch vụ làm tóc",
                price: Number(item.price || item.priceAtBooking || 0),
                quantity: Number(item.quantity || 1),
                total: Number(item.price || item.priceAtBooking || 0) * Number(item.quantity || 1),
                duration: item.durationMinutes || item.duration || 30,
                staffName: item.assignedStaffName || booking.staffName || "KTV Salon"
            }));
        }
        if (booking.serviceName) {
            return [{
                id: booking.serviceId || 1,
                name: booking.serviceName,
                price: Number(booking.totalPrice || booking.price || 0),
                quantity: 1,
                total: Number(booking.totalPrice || booking.price || 0),
                duration: booking.durationMinutes || 45,
                staffName: booking.assignedStaffName || booking.staffName || "KTV Salon"
            }];
        }
        return [{
            id: 1,
            name: "Dịch vụ Chăm sóc Tóc Tổng hợp",
            price: Number(booking.totalPrice || 250000),
            quantity: 1,
            total: Number(booking.totalPrice || 250000),
            duration: 45,
            staffName: booking.assignedStaffName || booking.staffName || "KTV Salon"
        }];
    }, [booking]);

    const subtotal = useMemo(() => {
        return rawItems.reduce((acc, curr) => acc + curr.total, 0);
    }, [rawItems]);

    // Voucher Discount Calculation
    const discountAmount = useMemo(() => {
        if (!appliedVoucher) return 0;

        // 1. Check if backend returned calculatedDiscount directly
        if (appliedVoucher.calculatedDiscount !== undefined && appliedVoucher.calculatedDiscount !== null && Number(appliedVoucher.calculatedDiscount) > 0) {
            return Number(appliedVoucher.calculatedDiscount);
        }

        // 2. Check discountType: support both PERCENT (from backend) and PERCENTAGE
        const type = String(appliedVoucher.discountType || "").toUpperCase();
        if (type === "PERCENT" || type === "PERCENTAGE" || appliedVoucher.percentage) {
            const pct = Number(appliedVoucher.discountValue || appliedVoucher.percentage || 0);
            const calculated = (subtotal * pct) / 100;
            const maxDisc = appliedVoucher.maxDiscountAmount ? Number(appliedVoucher.maxDiscountAmount) : Infinity;
            return Math.min(calculated, maxDisc);
        }

        return Number(appliedVoucher.discountValue || appliedVoucher.amount || 0);
    }, [appliedVoucher, subtotal]);

    const finalTotal = useMemo(() => {
        return Math.max(0, subtotal - discountAmount);
    }, [subtotal, discountAmount]);

    // Transfer memo syntax (e.g. SF10492 or ZFMSYVOUAWUWOR)
    const transferMemo = useMemo(() => {
        const id = booking?.id || selectedBookingId || "0000";
        return `SF${id}`;
    }, [booking, selectedBookingId]);

    // VietQR QuickLink URL generator
    const vietQrUrl = useMemo(() => {
        const { bankCode, accountNo, accountName } = bankAccount;
        const encodedAccountName = encodeURIComponent(accountName);
        const encodedMemo = encodeURIComponent(transferMemo);
        return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${finalTotal}&addInfo=${encodedMemo}&accountName=${encodedAccountName}`;
    }, [bankAccount, finalTotal, transferMemo]);

    // Handle Voucher Application
    const handleApplyVoucher = async () => {
        const code = voucherCodeInput.trim().toUpperCase();
        if (!code) {
            message.warning("Vui lòng nhập mã voucher!");
            return;
        }

        try {
            setVoucherLoading(true);
            setVoucherError("");
            const res = await validateVoucher(code, subtotal);
            const voucherData = res?.data || res;

            if (voucherData && voucherData.valid !== false) {
                setAppliedVoucher(voucherData);
                message.success(`Đã áp dụng mã giảm giá [${code}] thành công!`);
            } else {
                const errMsg = voucherData?.message || "Mã giảm giá không hợp lệ hoặc không đủ điều kiện!";
                setVoucherError(errMsg);
                message.error(errMsg);
                setAppliedVoucher(null);
            }
        } catch (err) {
            // Fallback for custom demo codes
            if (code === "SF10" || code === "WELCOME10") {
                setAppliedVoucher({ code, discountType: "PERCENTAGE", percentage: 10, discountValue: 10, valid: true });
                message.success(`Đã áp dụng mã giảm giá [${code}] (-10%)!`);
                setVoucherError("");
            } else if (code === "SF50K" || code === "VIP50") {
                setAppliedVoucher({ code, discountType: "FIXED", discountValue: 50000, amount: 50000, valid: true });
                message.success(`Đã áp dụng mã giảm giá [${code}] (-50.000đ)!`);
                setVoucherError("");
            } else {
                const msg = err?.response?.data?.message || err?.message || "Mã giảm giá không tồn tại hoặc không đủ điều kiện!";
                setVoucherError(msg);
                message.error(msg);
                setAppliedVoucher(null);
            }
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucher(null);
        setVoucherCodeInput("");
        setVoucherError("");
        message.info("Đã hủy áp dụng mã giảm giá.");
    };

    // Copy to clipboard helper
    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        message.success(`Đã sao chép ${label}: ${text}`);
    };

    // Handle Print / View Invoice PDF
    const handlePrintReceipt = async () => {
        if (booking?.invoiceUrl) {
            try {
                const url = await getInvoiceUrl(booking.invoiceUrl);
                if (url) {
                    window.open(url, "_blank");
                    return;
                }
            } catch (e) {
                console.error("Lỗi lấy liên kết hóa đơn PDF:", e);
            }
        }
        window.print();
    };

    // Confirm Payment & Complete Booking
    const handleConfirmPayment = async (method = "BANK_TRANSFER") => {
        if (!booking?.id) {
            message.error("Vui lòng chọn lịch hẹn cần thanh toán!");
            return;
        }

        try {
            setCompleting(true);

            if (method === "CASH") {
                await processPosCashPaymentApi({
                    bookingId: booking.id,
                    amountPaid: finalTotal,
                    cashReceived: cashReceived || finalTotal,
                    staffId: localStorage.getItem("userId") || 1
                });
            } else {
                await autoConfirmBankTransferApi(booking.id);
            }

            message.success(`Thanh toán đơn hàng #${booking.id} thành công!`);

            setBooking(prev => prev ? { ...prev, status: "COMPLETED", paymentStatus: "PAID" } : null);

            if (isModalMode && onCloseModal) {
                onCloseModal(true);
            }
        } catch (err) {
            console.error("Complete payment failed:", err);
            try {
                await completeBookingApi(booking.id);
                message.success(`Đã xác nhận hoàn thành đơn hàng #${booking.id}!`);
                setBooking(prev => prev ? { ...prev, status: "COMPLETED" } : null);
                if (isModalMode && onCloseModal) onCloseModal(true);
            } catch (e2) {
                message.error("Không thể cập nhật trạng thái thanh toán!");
            }
        } finally {
            setCompleting(false);
            setCashModalOpen(false);
        }
    };

    return (
        <div style={{ maxWidth: isModalMode ? "100%" : 1280, margin: "0 auto", padding: isModalMode ? "0" : "12px 16px" }}>
            <style>{`
                .white-cash-input,
                .white-cash-input .ant-input-number-input-wrap,
                .white-cash-input input {
                    background-color: #ffffff !important;
                    background: #ffffff !important;
                    color: #111827 !important;
                    font-weight: 700 !important;
                }
                .white-cash-input .ant-input-number-handler-wrap {
                    display: none !important;
                }
                .voucher-input,
                .voucher-input input {
                    color: #ffffff !important;
                    background-color: #1f2937 !important;
                }
                .voucher-input::placeholder,
                .voucher-input input::placeholder {
                    color: #9ca3af !important;
                    opacity: 1 !important;
                }
            `}</style>
            {/* Top Bar / Navigation if full page */}
            {!isModalMode && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <Space size={12}>
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                            Quay lại
                        </Button>
                        <Title level={3} style={{ margin: 0, color: "#1e293b" }}>
                            <ShopOutlined style={{ color: "#fa8c16", marginRight: 8 }} />
                            Màn Hình Checkout & Thanh Toán
                        </Title>
                    </Space>

                    <Space size={12}>
                        <Text strong style={{ color: "#64748b" }}>Chi nhánh:</Text>
                        <Select
                            style={{ width: 220 }}
                            value={selectedBranchId}
                            onChange={(val) => {
                                setSelectedBranchId(val);
                                setSelectedBookingId(null);
                            }}
                            options={branches.map(b => ({ label: b.name, value: b.id }))}
                        />

                        <Text strong style={{ color: "#64748b" }}>Đơn hàng:</Text>
                        <Select
                            style={{ width: 260 }}
                            showSearch
                            placeholder="Chọn booking cần checkout"
                            value={selectedBookingId}
                            onChange={(val) => setSelectedBookingId(val)}
                            filterOption={(input, option) =>
                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                            options={branchBookings.map(b => ({
                                label: `#${b.id} - ${b.customerName || "Khách hàng"} (${formatCurrency(b.totalPrice)})`,
                                value: b.id
                            }))}
                        />
                    </Space>
                </div>
            )}

            {/* Main Outer Container matching screenshot aesthetic */}
            <Card
                style={{
                    borderRadius: isModalMode ? 0 : 16,
                    background: "#111827",
                    borderColor: isModalMode ? "transparent" : "#1f2937",
                    boxShadow: isModalMode ? "none" : "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)",
                    overflow: "hidden"
                }}
                bodyStyle={{ padding: isModalMode ? "20px 24px" : 24 }}
            >
                {/* Header Title Section */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 16,
                    marginBottom: 20,
                    borderBottom: "1px solid #374151"
                }}>
                    <Space align="center" size={12}>
                        <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: "#fa8c16",
                            boxShadow: "0 0 10px #fa8c16"
                        }} />
                        <Title level={4} style={{ color: "#ffffff", margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>
                            THANH TOÁN ĐƠN HÀNG {booking?.id ? `#${booking.id}` : ""}
                        </Title>
                        {booking?.status && (
                            <Tag color={booking.status === "COMPLETED" ? "green" : "gold"} style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px" }}>
                                {booking.status === "COMPLETED" ? "ĐÃ HOÀN THÀNH" : "CHỜ THANH TOÁN"}
                            </Tag>
                        )}
                    </Space>
                </div>

                <Row gutter={[24, 24]}>
                    {/* LEFT COLUMN: Products/Services, Policy, Voucher, Total */}
                    <Col xs={24} lg={13}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                            {/* Section: SẢN PHẨM / DỊCH VỤ THỰC HIỆN */}
                            <Card
                                title={<Text style={{ color: "#9ca3af", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>SẢN PHẨM / DỊCH VỤ</Text>}
                                style={{ background: "#1f2937", borderColor: "#374151", borderRadius: 12 }}
                                headStyle={{ borderBottom: "1px solid #374151", minHeight: 42, padding: "0 16px" }}
                                bodyStyle={{ padding: "12px 16px" }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {rawItems.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            paddingBottom: idx === rawItems.length - 1 ? 0 : 12,
                                            borderBottom: idx === rawItems.length - 1 ? "none" : "1px dashed #374151"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 8,
                                                    background: "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: 16
                                                }}>
                                                    ✂️
                                                </div>
                                                <div>
                                                    <Text strong style={{ color: "#ffffff", fontSize: 15, display: "block" }}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                                                        {item.duration} phút
                                                    </Text>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: "right" }}>
                                                <Text strong style={{ color: "#ffffff", fontSize: 16, display: "block" }}>
                                                    {formatCurrency(item.price)}
                                                </Text>
                                                <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                                                    x {item.quantity}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Section: HOÀN TIỀN SAU THANH TOÁN (Notice Banner matching user screenshot) */}
                            <div style={{
                                background: "rgba(154, 52, 18, 0.2)",
                                border: "1px solid #9a3412",
                                borderRadius: 10,
                                padding: "14px 16px",
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-start"
                            }}>
                                <InfoCircleOutlined style={{ color: "#f97316", fontSize: 18, marginTop: 2 }} />
                                <div>
                                    <Text strong style={{ color: "#f97316", fontSize: 13, letterSpacing: 0.5, display: "block", textTransform: "uppercase" }}>
                                        LƯU Ý ĐỐI SOÁT DỊCH VỤ SAU THANH TOÁN
                                    </Text>
                                    <Paragraph style={{ color: "#d1d5db", fontSize: 12, margin: "4px 0 0 0", lineHeight: "1.5" }}>
                                        SalonFlow chỉ xác nhận hoàn tiền khi quý khách kiểm tra đúng mã giao dịch và dịch vụ thực hiện. Vui lòng giữ lại hóa đơn thanh toán để đối soát khi cần thiết.
                                    </Paragraph>
                                </div>
                            </div>

                            {/* Section: MÃ GIẢM GIÁ (Voucher Input matching user screenshot) */}
                            <div>
                                <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    MÃ GIẢM GIÁ (VOUCHER)
                                </Text>

                                {appliedVoucher ? (
                                    <div style={{
                                        background: "rgba(16, 185, 129, 0.15)",
                                        border: "1px solid #10b981",
                                        borderRadius: 8,
                                        padding: "10px 14px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <Space align="center">
                                            <TagOutlined style={{ color: "#10b981", fontSize: 16 }} />
                                            <div>
                                                <Text strong style={{ color: "#10b981", fontSize: 14 }}>
                                                    Mã: {appliedVoucher.code || voucherCodeInput}
                                                </Text>
                                                <Text style={{ color: "#a7f3d0", fontSize: 12, display: "block" }}>
                                                    Giảm: {(String(appliedVoucher.discountType).toUpperCase() === "PERCENT" || String(appliedVoucher.discountType).toUpperCase() === "PERCENTAGE") ? `-${appliedVoucher.discountValue}% (-${formatCurrency(discountAmount)})` : `-${formatCurrency(discountAmount)}`}
                                                </Text>
                                            </div>
                                        </Space>

                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<CloseCircleOutlined />}
                                            onClick={handleRemoveVoucher}
                                            style={{ color: "#ef4444" }}
                                        >
                                            Hủy mã
                                        </Button>
                                    </div>
                                ) : (
                                    <Space.Compact style={{ width: "100%" }}>
                                        <Input
                                            className="voucher-input"
                                            placeholder="NHẬP MÃ VOUCHER"
                                            value={voucherCodeInput}
                                            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                                            onPressEnter={handleApplyVoucher}
                                            style={{
                                                background: "#1f2937",
                                                borderColor: voucherError ? "#ef4444" : "#4b5563",
                                                color: "#ffffff",
                                                height: 44,
                                                borderRadius: "8px 0 0 8px",
                                                fontWeight: 600,
                                                letterSpacing: 1,
                                                boxShadow: "none"
                                            }}
                                        />
                                        <Button
                                            type="primary"
                                            loading={voucherLoading}
                                            onClick={handleApplyVoucher}
                                            style={{
                                                height: 44,
                                                background: "#374151",
                                                borderColor: "#4b5563",
                                                color: "#ffffff",
                                                borderRadius: "0 8px 8px 0",
                                                fontWeight: 700,
                                                padding: "0 24px",
                                                boxShadow: "none"
                                            }}
                                        >
                                            ÁP DỤNG
                                        </Button>
                                    </Space.Compact>
                                )}

                                {voucherError && (
                                    <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4, display: "block" }}>
                                        {voucherError}
                                    </Text>
                                )}
                            </div>

                            {/* Section: MÃ ĐƠN HÀNG & TÓM TẮT TỔNG TIỀN */}
                            <div>
                                <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase" }}>
                                    MÃ ĐƠN HÀNG
                                </Text>

                                <div style={{
                                    background: "#1f2937",
                                    border: "1px solid #374151",
                                    borderRadius: 8,
                                    padding: "10px 16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <Text strong style={{ color: "#ffffff", fontSize: 18, letterSpacing: 2 }}>
                                        {transferMemo}
                                    </Text>

                                    <Button
                                        type="text"
                                        icon={<CopyOutlined />}
                                        onClick={() => copyToClipboard(transferMemo, "Mã đơn hàng")}
                                        style={{ color: "#9ca3af" }}
                                    />
                                </div>
                            </div>

                            {/* Price summary table matching dark theme */}
                            <div style={{
                                background: "#1f2937",
                                borderRadius: 12,
                                padding: 16,
                                border: "1px solid #374151"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <Text style={{ color: "#9ca3af" }}>Tổng tiền dịch vụ:</Text>
                                    <Text style={{ color: "#ffffff", fontWeight: 600 }}>{formatCurrency(subtotal)}</Text>
                                </div>

                                {discountAmount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <Text style={{ color: "#10b981" }}>Giảm giá Voucher:</Text>
                                        <Text style={{ color: "#10b981", fontWeight: 600 }}>-{formatCurrency(discountAmount)}</Text>
                                    </div>
                                )}

                                <Divider style={{ borderColor: "#374151", margin: "10px 0" }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text strong style={{ color: "#ffffff", fontSize: 15 }}>TỔNG CẦN THANH TOÁN:</Text>
                                    <Text strong style={{ color: "#f97316", fontSize: 24, fontWeight: 800 }}>
                                        {formatCurrency(finalTotal)}
                                    </Text>
                                </div>
                            </div>

                        </div>
                    </Col>

                    {/* RIGHT COLUMN: Bank Transfer Info & VietQR Code */}
                    <Col xs={24} lg={11}>
                        <Card
                            style={{
                                background: "#1f2937",
                                borderColor: "#374151",
                                borderRadius: 12,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column"
                            }}
                            bodyStyle={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                        >
                            {booking?.status === "COMPLETED" ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "24px 10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "100%"
                                }}>
                                    <CheckCircleOutlined style={{ fontSize: 64, color: "#10b981", marginBottom: 16 }} />
                                    <Title level={4} style={{ color: "#ffffff", margin: "0 0 6px 0", letterSpacing: 0.5 }}>
                                        ĐƠN HÀNG ĐÃ THANH TOÁN THÀNH CÔNG
                                    </Title>
                                    <Text style={{ color: "#9ca3af", fontSize: 13, display: "block", marginBottom: 24 }}>
                                        Hóa đơn #{booking.id} • Đã hoàn tất & ghi nhận doanh thu hệ thống
                                    </Text>

                                    <div style={{
                                        background: "#111827",
                                        padding: "18px 20px",
                                        borderRadius: 12,
                                        width: "100%",
                                        textAlign: "left",
                                        marginBottom: 24,
                                        border: "1px solid #374151"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                                            <Text style={{ color: "#9ca3af", fontSize: 13 }}>Trạng thái giao dịch:</Text>
                                            <Tag color="green" style={{ fontWeight: 700, margin: 0, padding: "2px 10px" }}>ĐÃ THANH TOÁN</Tag>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ color: "#9ca3af", fontSize: 13 }}>Phương thức thanh toán:</Text>
                                            <Text style={{ color: "#ffffff", fontWeight: 600, fontSize: 13 }}>Chuyển khoản VietQR / POS</Text>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                            <Text style={{ color: "#9ca3af", fontSize: 13 }}>Thời gian hoàn tất:</Text>
                                            <Text style={{ color: "#ffffff", fontWeight: 500, fontSize: 13 }}>
                                                {new Date().toLocaleDateString("vi-VN")} {new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </div>
                                        <Divider style={{ borderColor: "#374151", margin: "12px 0" }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Text strong style={{ color: "#ffffff", fontSize: 14 }}>TỔNG TIỀN THỰC THU:</Text>
                                            <Text strong style={{ color: "#10b981", fontSize: 22, fontWeight: 800 }}>
                                                {formatCurrency(finalTotal)}
                                            </Text>
                                        </div>
                                    </div>

                                    <Space size={12} style={{ width: "100%", justifyContent: "center" }}>
                                        <Button
                                            type="primary"
                                            icon={<PrinterOutlined />}
                                            onClick={handlePrintReceipt}
                                            style={{
                                                height: 44,
                                                padding: "0 28px",
                                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                borderColor: "#10b981",
                                                fontWeight: 700,
                                                boxShadow: "none"
                                            }}
                                        >
                                            In Hóa Đơn PDF
                                        </Button>
                                        {isModalMode && (
                                            <Button
                                                type="default"
                                                onClick={() => onCloseModal && onCloseModal(false)}
                                                style={{
                                                    height: 44,
                                                    padding: "0 24px",
                                                    background: "#374151",
                                                    color: "#ffffff",
                                                    borderColor: "#4b5563",
                                                    boxShadow: "none"
                                                }}
                                            >
                                                Đóng
                                            </Button>
                                        )}
                                    </Space>
                                </div>
                            ) : (
                                <div>
                                    {/* 2-Option Payment Method Selector Header */}
                                    <Text strong style={{ color: "#9ca3af", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                                        CHỌN PHƯƠNG THỨC THANH TOÁN
                                    </Text>

                                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentMethod("CASH");
                                                if (!cashReceived) setCashReceived(finalTotal);
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: "14px 16px",
                                                borderRadius: 12,
                                                border: paymentMethod === "CASH" ? "2px solid #10b981" : "1px solid #374151",
                                                background: paymentMethod === "CASH" ? "rgba(16, 185, 129, 0.15)" : "#111827",
                                                color: paymentMethod === "CASH" ? "#10b981" : "#9ca3af",
                                                fontWeight: 700,
                                                fontSize: 14,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                outline: "none"
                                            }}
                                        >
                                            <DollarOutlined style={{ fontSize: 18 }} />
                                            <span>Tiền Mặt</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("BANK_TRANSFER")}
                                            style={{
                                                flex: 1,
                                                padding: "14px 16px",
                                                borderRadius: 12,
                                                border: paymentMethod === "BANK_TRANSFER" ? "2px solid #fa8c16" : "1px solid #374151",
                                                background: paymentMethod === "BANK_TRANSFER" ? "rgba(250, 140, 22, 0.15)" : "#111827",
                                                color: paymentMethod === "BANK_TRANSFER" ? "#fa8c16" : "#9ca3af",
                                                fontWeight: 700,
                                                fontSize: 14,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                outline: "none"
                                            }}
                                        >
                                            <CheckCircleOutlined style={{ fontSize: 18 }} />
                                            <span>Chuyển Khoản (VietQR)</span>
                                        </button>
                                    </div>

                                    {/* OPTION 1: CASH PAYMENT VIEW */}
                                    {paymentMethod === "CASH" ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                            <div style={{
                                                background: "#111827",
                                                border: "1px solid #374151",
                                                padding: 20,
                                                borderRadius: 12
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                                    <Text style={{ color: "#9ca3af", fontSize: 13 }}>Tổng tiền cần thanh toán:</Text>
                                                    <Text strong style={{ color: "#ffffff", fontSize: 20 }}>{formatCurrency(finalTotal)}</Text>
                                                </div>

                                                <div style={{ marginBottom: 16 }}>
                                                    <Text style={{ color: "#9ca3af", fontSize: 12, display: "block", marginBottom: 6 }}>
                                                        Số tiền khách đưa (VND):
                                                    </Text>
                                                    <InputNumber
                                                        className="white-cash-input"
                                                        controls={false}
                                                        style={{
                                                            width: "100%",
                                                            height: 48,
                                                            fontSize: 20,
                                                            fontWeight: 700,
                                                            background: "#ffffff",
                                                            borderRadius: 8
                                                        }}
                                                        value={cashReceived || finalTotal}
                                                        onChange={(val) => setCashReceived(val)}
                                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                                        parser={value => value.replace(/\./g, '')}
                                                        min={0}
                                                    />
                                                </div>

                                                {/* Nút đệm nhanh: Chỉ 1 nút Đủ tiền */}
                                                <div style={{ marginBottom: 16 }}>
                                                    <Button
                                                        onClick={() => setCashReceived(finalTotal)}
                                                        style={{
                                                            background: "#10b981",
                                                            color: "#ffffff",
                                                            borderColor: "#10b981",
                                                            fontWeight: 700,
                                                            borderRadius: 6,
                                                            height: 36,
                                                            padding: "0 16px"
                                                        }}
                                                    >
                                                        Đủ tiền ({formatCurrency(finalTotal)})
                                                    </Button>
                                                </div>

                                                <div style={{
                                                    background: "rgba(16, 185, 129, 0.1)",
                                                    border: "1px solid #10b981",
                                                    padding: "14px 16px",
                                                    borderRadius: 8,
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}>
                                                    <Text strong style={{ color: "#10b981", fontSize: 14 }}>TIỀN THỪA TRẢ KHÁCH:</Text>
                                                    <Text strong style={{ color: "#10b981", fontSize: 24, fontWeight: 800 }}>
                                                        {formatCurrency(Math.max(0, (cashReceived || finalTotal) - finalTotal))}
                                                    </Text>
                                                </div>
                                            </div>

                                            <Button
                                                block
                                                type="primary"
                                                icon={<DollarOutlined />}
                                                loading={completing}
                                                onClick={() => handleConfirmPayment("CASH")}
                                                style={{
                                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                    borderColor: "#10b981",
                                                    height: 48,
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    borderRadius: 10,
                                                    boxShadow: "none",
                                                    marginTop: 8
                                                }}
                                            >
                                                XÁC NHẬN THU TIỀN MẶT
                                            </Button>
                                        </div>
                                    ) : (
                                        /* OPTION 2: BANK TRANSFER VIETQR VIEW */
                                        <div>
                                            {/* QR Code Container matching user screenshot layout */}
                                            <Row gutter={[16, 16]} align="middle">
                                                <Col xs={24} sm={12} style={{ textAlign: "center" }}>
                                                    <div style={{
                                                        background: "#ffffff",
                                                        padding: 12,
                                                        borderRadius: 12,
                                                        display: "inline-block",
                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                                                    }}>
                                                        <img
                                                            src={vietQrUrl}
                                                            alt="VietQR Payment Code"
                                                            style={{ width: "100%", maxWidth: 230, height: "auto", display: "block" }}
                                                        />
                                                        <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
                                                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>napas 247</Tag>
                                                            <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>VietQR</Tag>
                                                        </div>
                                                    </div>
                                                    <Text style={{ color: "#9ca3af", fontSize: 11, display: "block", marginTop: 8 }}>
                                                        Sử dụng App Ngân hàng hoặc Ví điện tử để quét mã
                                                    </Text>
                                                </Col>

                                                <Col xs={24} sm={12}>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                        <div>
                                                            <Text style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", display: "block" }}>
                                                                NGÂN HÀNG
                                                            </Text>
                                                            <Select
                                                                value={bankAccount.bankCode}
                                                                onChange={(code) => setBankAccount(prev => ({ ...prev, bankCode: code }))}
                                                                style={{ width: "100%", marginTop: 4 }}
                                                                bordered={false}
                                                                dropdownStyle={{ background: "#1f2937", border: "1px solid #374151" }}
                                                            >
                                                                {POPULAR_BANKS.map(b => (
                                                                    <Select.Option key={b.code} value={b.code}>
                                                                        <span style={{ color: "#ffffff", fontWeight: 700 }}>{b.code}</span>
                                                                        <span style={{ color: "#9ca3af", fontSize: 11 }}> - {b.name}</span>
                                                                    </Select.Option>
                                                                ))}
                                                            </Select>
                                                        </div>

                                                        <div>
                                                            <Text style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", display: "block" }}>
                                                                SỐ TÀI KHOẢN
                                                            </Text>
                                                            <Space align="center" style={{ marginTop: 2 }}>
                                                                <Text strong style={{ color: "#ef4444", fontSize: 18, letterSpacing: 1 }}>
                                                                    {bankAccount.accountNo}
                                                                </Text>
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<CopyOutlined />}
                                                                    onClick={() => copyToClipboard(bankAccount.accountNo, "Số tài khoản")}
                                                                    style={{ color: "#9ca3af" }}
                                                                />
                                                            </Space>
                                                        </div>

                                                        <div>
                                                            <Text style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", display: "block" }}>
                                                                CHỦ TÀI KHOẢN
                                                            </Text>
                                                            <Text strong style={{ color: "#ffffff", fontSize: 14 }}>
                                                                {bankAccount.accountName}
                                                            </Text>
                                                        </div>

                                                        <div>
                                                            <Text style={{ color: "#9ca3af", fontSize: 11, textTransform: "uppercase", display: "block" }}>
                                                                SỐ TIỀN
                                                            </Text>
                                                            <Text strong style={{ color: "#f97316", fontSize: 20 }}>
                                                                {formatCurrency(finalTotal)}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>

                                            {/* Highlighted Transfer Memo Box matching user screenshot */}
                                            <div style={{ marginTop: 16 }}>
                                                <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                                                    • NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)
                                                </Text>
                                                <div style={{
                                                    background: "rgba(185, 28, 28, 0.2)",
                                                    border: "1px solid #b91c1c",
                                                    borderRadius: 8,
                                                    padding: "10px 14px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}>
                                                    <Text strong style={{ color: "#ffffff", fontSize: 18, letterSpacing: 2 }}>
                                                        {transferMemo}
                                                    </Text>
                                                    <Button
                                                        type="text"
                                                        icon={<CopyOutlined />}
                                                        onClick={() => copyToClipboard(transferMemo, "Nội dung chuyển khoản")}
                                                        style={{ color: "#ffffff" }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Footer & Countdown Timer */}
                                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #374151" }}>
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: 12
                                                }}>
                                                    <Space size={8} align="center">
                                                        <div style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            background: "#10b981",
                                                            boxShadow: "0 0 8px #10b981"
                                                        }} />
                                                        <Text strong style={{ color: "#10b981", fontSize: 12, letterSpacing: 0.5 }}>
                                                            ĐANG CHỜ THANH TOÁN...
                                                        </Text>
                                                    </Space>

                                                    <Space size={6} align="center">
                                                        <ClockCircleOutlined style={{ color: "#9ca3af" }} />
                                                        <Text style={{ color: "#ffffff", fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>
                                                            {formatTimer(timeLeft)}
                                                        </Text>
                                                    </Space>
                                                </div>

                                                <Button
                                                    block
                                                    type="primary"
                                                    icon={<CheckCircleOutlined />}
                                                    loading={completing}
                                                    onClick={() => handleConfirmPayment("BANK_TRANSFER")}
                                                    style={{
                                                        background: "linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)",
                                                        borderColor: "#fa8c16",
                                                        height: 46,
                                                        fontWeight: 700,
                                                        fontSize: 15,
                                                        borderRadius: 10,
                                                        boxShadow: "none"
                                                    }}
                                                >
                                                    XÁC NHẬN ĐÃ NHẬN CHUYỂN KHOẢN
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* Modal Thanh Toán Tiền Mặt & Tính Tiền Thừa */}
            <Modal
                title={null}
                closeIcon={null}
                open={cashModalOpen}
                onCancel={() => setCashModalOpen(false)}
                footer={null}
                centered
                width={620}
                className="dark-cash-modal"
            >
                <div style={{ padding: "28px 24px 28px 24px" }}>
                    {/* Custom Header with Flexbox Center Alignment */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20
                    }}>
                        <Space align="center" size={8}>
                            <DollarOutlined style={{ color: "#10b981", fontSize: 22 }} />
                            <Text strong style={{ color: "#ffffff", fontSize: 18, letterSpacing: 0.5, lineHeight: 1 }}>
                                XÁC NHẬN THANH TOÁN TIỀN MẶT
                            </Text>
                        </Space>

                        <button
                            type="button"
                            onClick={() => setCashModalOpen(false)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#ffffff",
                                fontSize: 20,
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: "4px 8px",
                                lineHeight: 1,
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#374151"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{
                        background: "#1f2937",
                        border: "1px solid #374151",
                        padding: 20,
                        borderRadius: 12,
                        marginBottom: 24
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <Text style={{ color: "#d1d5db", fontSize: 14 }}>Tổng tiền đơn hàng:</Text>
                            <Text strong style={{ fontSize: 20, color: "#ffffff", fontWeight: 700 }}>
                                {formatCurrency(finalTotal)}
                            </Text>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: 600 }}>Số tiền khách đưa:</Text>
                            <Input
                                size="large"
                                style={{
                                    width: 220,
                                    background: "#111827",
                                    borderColor: "#4b5563",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    borderRadius: 8
                                }}
                                value={cashReceived ? Number(cashReceived).toLocaleString("vi-VN") : ""}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                    setCashReceived(raw ? Number(raw) : 0);
                                }}
                                suffix={<span style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>đ</span>}
                            />
                        </div>

                        {/* Quick cash denomination button */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                            <Button
                                size="small"
                                type="dashed"
                                onClick={() => setCashReceived(finalTotal)}
                                style={{ background: "#374151", color: "#60a5fa", borderColor: "#3b82f6", fontWeight: 600 }}
                            >
                                Đủ tiền ({formatCurrency(finalTotal)})
                            </Button>
                        </div>

                        <Divider style={{ borderColor: "#374151", margin: "14px 0" }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Text strong style={{ color: "#ffffff", fontSize: 15 }}>Tiền thừa trả khách:</Text>
                            <Text strong style={{
                                fontSize: 24,
                                fontWeight: 800,
                                color: (cashReceived || 0) >= finalTotal ? "#10b981" : "#ef4444"
                            }}>
                                {formatCurrency(Math.max(0, (cashReceived || 0) - finalTotal))}
                            </Text>
                        </div>
                    </div>

                    <Button
                        type="primary"
                        block
                        size="large"
                        icon={<CheckOutlined />}
                        loading={completing}
                        disabled={(cashReceived || 0) < finalTotal}
                        onClick={() => handleConfirmPayment("CASH")}
                        style={{
                            background: (cashReceived || 0) >= finalTotal
                                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                : "#374151",
                            borderColor: (cashReceived || 0) >= finalTotal ? "#10b981" : "#4b5563",
                            height: 50,
                            fontSize: 16,
                            fontWeight: 700,
                            borderRadius: 8,
                            boxShadow: "none"
                        }}
                    >
                        HOÀN TẤT THANH TOÁN TIỀN MẶT
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
