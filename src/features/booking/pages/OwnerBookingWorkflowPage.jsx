import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import jsQR from "jsqr";
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Empty,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message
} from "antd";
import {
    CheckCircleOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    ReloadOutlined,
    SearchOutlined,
    ShoppingOutlined,
    TeamOutlined,
    UserOutlined,
    ShopOutlined,
    QrcodeOutlined,
    CameraOutlined,
    LinkOutlined,
    DollarOutlined
} from "@ant-design/icons";
import { getMyBranchesApi } from "@/features/branch/api/branchApi";
import {
    checkInBookingApi,
    checkInBookingByQrApi,
    completeBookingApi,
    confirmBookingApi,
    getBookingsByBranchApi
} from "../api/bookingApi";

import NoShowWarningBadge from "@/features/ai/components/NoShowWarningBadge";
import ManagerCheckoutModal from "@/features/payment/components/ManagerCheckoutModal";
import { getInvoiceUrl } from "@/features/media/api/mediaApi";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const STATUS_META = {
    PENDING: { label: "Chờ xử lý", color: "gold" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue" },
    CHECKED_IN: { label: "Đã check-in", color: "cyan" },
    COMPLETED: { label: "Đã hoàn thành", color: "green" },
    CANCELLED: { label: "Đã hủy", color: "red" },
    NO_SHOW: { label: "Vắng mặt", color: "default" }
};

const ACTION_TEXT = {
    confirm: "Xác nhận lịch",
    checkin: "Quét QR Check-in",
    complete: "Thanh toán & Hoàn thành"
};

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN");

const formatDate = (value) => {
    if (!value) return "-";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY") : String(value);
};

const formatTime = (value) => {
    if (!value) return "--:--";
    return String(value).substring(0, 5);
};

const buildSearchText = (booking) => [
    booking?.id,
    booking?.customerName,
    booking?.customerPhone,
    booking?.branchName,
    booking?.assignedStaffName,
    booking?.staffName,
    booking?.notes,
    booking?.status,
    ...(Array.isArray(booking?.items) ? booking.items.flatMap((item) => [
        item?.serviceName,
        item?.bundleName
    ]) : [])
]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getWorkflowAction = (status) => {
    if (status === "PENDING") {
        return { key: "confirm", label: ACTION_TEXT.confirm, color: "blue", icon: <CheckOutlined /> };
    }

    if (status === "CONFIRMED") {
        return { key: "checkin", label: ACTION_TEXT.checkin, color: "gold", icon: <QrcodeOutlined /> };
    }

    if (status === "CHECKED_IN") {
        return { key: "complete", label: ACTION_TEXT.complete, color: "green", icon: <DollarOutlined /> };
    }

    return null;
};

/**
 * Sub-component Modal Quét Mã QR Check-in trực tiếp
 */
function QrScannerModal({ open, onCancel, onSuccess }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const frameRef = useRef(null);
    const detectedRef = useRef(false);

    const [manualInput, setManualInput] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [scanError, setScanError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const stopCamera = useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    }, []);

    const processCheckInValue = useCallback(async (rawValue) => {
        const value = (rawValue || "").trim();
        if (!value) {
            setScanError("Vui lòng dán URL hoặc nhập mã QR / Booking ID!");
            return;
        }

        let bookingId = null;
        let signature = null;

        try {
            const url = new URL(value, window.location.origin);
            bookingId = url.searchParams.get("bookingId");
            signature = url.searchParams.get("signature");
        } catch {
            if (/^\d+$/.test(value)) {
                bookingId = value;
            }
        }

        if (!bookingId) {
            setScanError("Mã QR hoặc URL không hợp lệ (không chứa thông tin bookingId).");
            return;
        }

        try {
            setSubmitting(true);
            setScanError("");
            stopCamera();

            if (signature) {
                await checkInBookingByQrApi(bookingId, signature);
            } else {
                await checkInBookingApi(bookingId);
            }

            message.success(`Check-in thành công cho booking #${bookingId}!`);
            onSuccess();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Check-in thất bại.";
            setScanError(msg);
        } finally {
            setSubmitting(false);
        }
    }, [stopCamera, onSuccess]);

    const handleQrValue = useCallback((val) => {
        if (detectedRef.current) return;
        detectedRef.current = true;
        processCheckInValue(val);
    }, [processCheckInValue]);

    const startCamera = useCallback(async () => {
        setCameraError("");
        setScanError("");
        detectedRef.current = false;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Trình duyệt không hỗ trợ camera hoặc đang chạy ở kết nối HTTP không an toàn. Vui lòng dán URL hoặc nhập Mã Booking ở bên dưới.");
            return;
        }

        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true");
                await videoRef.current.play();
                setCameraReady(true);
            }

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            const scan = () => {
                if (!videoRef.current || detectedRef.current) return;
                const video = videoRef.current;
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });
                    if (code && code.data) {
                        handleQrValue(code.data);
                        return;
                    }
                }
                frameRef.current = requestAnimationFrame(scan);
            };

            frameRef.current = requestAnimationFrame(scan);
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("Không thể bật camera. Vui lòng cấp quyền camera trong trình duyệt hoặc dán URL / Mã booking bên dưới.");
        }
    }, [handleQrValue, stopCamera]);

    useEffect(() => {
        if (open) {
            startCamera();
        } else {
            stopCamera();
            setManualInput("");
            setScanError("");
            setCameraError("");
        }
        return () => stopCamera();
    }, [open, startCamera, stopCamera]);

    return (
        <Modal
            title={
                <Space>
                    <QrcodeOutlined style={{ color: "#fa8c16", fontSize: 20 }} />
                    <span style={{ fontWeight: 600 }}>Quét mã QR Check-in Khách hàng</span>
                </Space>
            }
            open={open}
            onCancel={() => { stopCamera(); onCancel(); }}
            footer={null}
            width={600}
            destroyOnClose
        >
            <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
                {cameraError && <Alert type="warning" message={cameraError} showIcon />}
                {scanError && <Alert type="error" message={scanError} showIcon />}

                <div
                    style={{
                        position: "relative",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "#111827",
                        aspectRatio: "16/9",
                        display: "grid",
                        placeItems: "center"
                    }}
                >
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: cameraReady ? "block" : "none"
                        }}
                    />
                    {!cameraReady && (
                        <Space direction="vertical" align="center">
                            <CameraOutlined style={{ color: "#fff", fontSize: 40 }} />
                            <Text style={{ color: "#fff" }}>Đang chuẩn bị camera...</Text>
                        </Space>
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space size="small">
                        <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={startCamera}>
                            Bật lại camera
                        </Button>
                        <Button size="small" icon={<CameraOutlined />} onClick={stopCamera}>
                            Tắt camera
                        </Button>
                    </Space>
                </div>

                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                    <Text type="secondary" style={{ fontSize: 13, marginBottom: 6, display: "block" }}>
                        Nhập hoặc dán URL / Mã Booking thủ công:
                    </Text>
                    <Space.Compact style={{ width: "100%" }}>
                        <Input
                            prefix={<LinkOutlined />}
                            placeholder="Dán URL QR hoặc nhập mã Booking (ví dụ: 12)"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onPressEnter={() => processCheckInValue(manualInput)}
                            size="large"
                        />
                        <Button
                            type="primary"
                            size="large"
                            loading={submitting}
                            style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
                            onClick={() => processCheckInValue(manualInput)}
                        >
                            Check-in
                        </Button>
                    </Space.Compact>
                </div>
            </Space>
        </Modal>
    );
}

export default function OwnerBookingWorkflowPage() {
    const location = useLocation();
    const isManagerPage = location.pathname.startsWith("/manager");

    const [branches, setBranches] = useState([]);
    const [branchId, setBranchId] = useState(() => localStorage.getItem("currentBranchId") || "");
    const [bookings, setBookings] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [checkoutBooking, setCheckoutBooking] = useState(null);
    const [actionLoadingKey, setActionLoadingKey] = useState("");

    const selectedBranch = useMemo(
        () => branches.find((branch) => String(branch.id) === String(branchId)),
        [branches, branchId]
    );

    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            const data = await getMyBranchesApi();
            const nextBranches = Array.isArray(data) ? data : [];
            setBranches(nextBranches);

            const storedBranchId = localStorage.getItem("currentBranchId");
            const hasStoredBranch = storedBranchId
                ? nextBranches.some((branch) => String(branch.id) === String(storedBranchId))
                : false;

            if (storedBranchId && hasStoredBranch) {
                setBranchId(String(storedBranchId));
            } else if (nextBranches.length > 0) {
                const firstBranchId = String(nextBranches[0].id);
                setBranchId(firstBranchId);
                localStorage.setItem("currentBranchId", firstBranchId);
            }
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách chi nhánh.");
        } finally {
            setLoadingBranches(false);
        }
    };

    const loadBookings = async (targetBranchId = branchId) => {
        if (!targetBranchId) {
            setBookings([]);
            return;
        }

        try {
            setLoadingBookings(true);
            const data = await getBookingsByBranchApi(targetBranchId);
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách booking.");
        } finally {
            setLoadingBookings(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBranches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!branchId) return;
        localStorage.setItem("currentBranchId", String(branchId));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadBookings(branchId);

        // Real-time polling every 5 seconds so booking status updates live without reloading page
        const interval = setInterval(() => {
            if (branchId) {
                getBookingsByBranchApi(branchId)
                    .then((data) => {
                        if (Array.isArray(data)) setBookings(data);
                    })
                    .catch(() => {});
            }
        }, 5000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branchId]);

    const filteredBookings = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();

        const inRange = (booking) => {
            if (!dateRange || dateRange.length !== 2) return true;
            const [start, end] = dateRange;
            if (!start || !end) return true;
            const bookingDate = dayjs(booking?.bookingDate);
            if (!bookingDate.isValid()) return false;
            return (
                bookingDate.isSame(start, "day") ||
                bookingDate.isSame(end, "day") ||
                (bookingDate.isAfter(start, "day") && bookingDate.isBefore(end, "day"))
            );
        };

        return bookings
            .filter((booking) => {
                if (statusFilter !== "ALL" && String(booking?.status || "") !== statusFilter) {
                    return false;
                }

                if (!inRange(booking)) {
                    return false;
                }

                if (!normalizedSearch) {
                    return true;
                }

                return buildSearchText(booking).includes(normalizedSearch);
            })
            .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
    }, [bookings, searchText, statusFilter, dateRange]);

    const summary = useMemo(() => {
        const total = bookings.length;
        const pending = bookings.filter((booking) => booking.status === "PENDING").length;
        const confirmed = bookings.filter((booking) => booking.status === "CONFIRMED").length;
        const checkedIn = bookings.filter((booking) => booking.status === "CHECKED_IN").length;
        const completed = bookings.filter((booking) => booking.status === "COMPLETED").length;

        return {
            total,
            pending,
            confirmed,
            checkedIn,
            completed
        };
    }, [bookings]);

    const handleBranchChange = (value) => {
        setBranchId(value);
        localStorage.setItem("currentBranchId", String(value));
    };

    const handleRefresh = () => {
        void loadBookings(branchId);
    };

    const runWorkflowAction = (booking, actionKey) => {
        if (actionKey === "checkin") {
            setQrModalOpen(true);
            return;
        }

        if (actionKey === "manual_checkin") {
            Modal.confirm({
                title: "Xác nhận Check-in thủ công",
                icon: <CheckCircleOutlined style={{ color: "#fa8c16" }} />,
                content: (
                    <div>
                        <p style={{ marginBottom: 8 }}>
                            Xác nhận khách hàng <b>#{booking.id} ({booking.customerName || booking.customer?.name || "Khách lẻ"})</b> đã đến salon làm dịch vụ?
                        </p>
                        <Descriptions column={1} size="small" bordered style={{ marginTop: 8 }}>
                            <Descriptions.Item label="Chi nhánh">
                                {booking.branchName || selectedBranch?.name || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">
                                {formatDate(booking.bookingDate)} {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                ),
                okText: "Check-in ngay",
                cancelText: "Hủy",
                okButtonProps: { type: "primary", style: { backgroundColor: "#13c2c2", borderColor: "#13c2c2" } },
                onOk: async () => {
                    const loadingKey = `${booking.id}-manual_checkin`;
                    try {
                        setActionLoadingKey(loadingKey);
                        await checkInBookingApi(booking.id);
                        message.success(`Đã Check-in thủ công thành công cho booking #${booking.id}!`);
                        await loadBookings(branchId);
                        if (detailOpen) setDetailOpen(false);
                    } catch (error) {
                        console.error(error);
                        message.error(error?.response?.data?.message || "Check-in thủ công thất bại.");
                    } finally {
                        setActionLoadingKey("");
                    }
                }
            });
            return;
        }

        if (actionKey === "complete") {
            setCheckoutBooking(booking);
            setCheckoutModalOpen(true);
            return;
        }

        const actionMap = {
            confirm: {
                title: "Xác nhận lịch hẹn",
                description: "Dùng khi booking đang ở trạng thái chờ xử lý.",
                api: confirmBookingApi,
                success: "Đã xác nhận lịch hẹn."
            }
        };

        const action = actionMap[actionKey];
        if (!action) return;

        Modal.confirm({
            title: action.title,
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <Paragraph style={{ marginBottom: 8 }}>
                        {action.description}
                    </Paragraph>
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Mã booking">
                            #{booking.id}
                        </Descriptions.Item>
                        <Descriptions.Item label="Khách hàng">
                            {booking.customerName || booking.customer?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian">
                            {formatDate(booking.bookingDate)} {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            ),
            okText: action.title,
            cancelText: "Hủy",
            okButtonProps: { type: "primary" },
            onOk: async () => {
                const loadingKey = `${booking.id}-${actionKey}`;
                try {
                    setActionLoadingKey(loadingKey);
                    await action.api(booking.id);
                    message.success(action.success);
                    await loadBookings(branchId);
                } catch (error) {
                    console.error(error);
                    message.error(error?.response?.data?.message || error?.message || "Không thể cập nhật trạng thái booking.");
                } finally {
                    setActionLoadingKey("");
                }
            }
        });
    };

    const columns = [
        {
            title: "Mã booking",
            dataIndex: "id",
            width: 110,
            sorter: (a, b) => Number(a?.id || 0) - Number(b?.id || 0),
            render: (value, record) => (
                <Text strong style={{ color: "#1677ff" }}>
                    #{value}
                </Text>
            )
        },
        {
            title: "Khách hàng",
            width: 220,
            render: (_, record) => {
                const pred = record.noShowPrediction;
                return (
                    <Space direction="vertical" size={2}>
                        <Space>
                            <UserOutlined />
                            <Text strong>{record.customerName || record.customer?.name || "Khách hàng"}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.customerPhone || "Không có SĐT"}
                        </Text>
                        {pred && (
                            <NoShowWarningBadge
                                probabilityPercentage={pred.probabilityPercentage}
                                riskLevel={pred.riskLevel}
                                explanation={pred.explanation}
                                features={pred.features}
                                bookingId={record.id}
                                smsSent={pred.smsSent}
                            />
                        )}
                    </Space>
                );
            }
        },
        {
            title: "Dịch vụ / Combo",
            render: (_, record) => {
                const items = Array.isArray(record.items) ? record.items : [];

                if (items.length === 0) {
                    return <Text type="secondary">Chưa có dữ liệu</Text>;
                }

                return (
                    <Space wrap size={[0, 8]}>
                        {items.map((item, idx) => (
                            <Tag color="blue" key={item.id || `${record.id}-${idx}`}>
                                {item.serviceName || item.bundleName || "Dịch vụ"}
                            </Tag>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: "Nhân viên",
            width: 180,
            render: (_, record) => (
                <Space>
                    <TeamOutlined />
                    <Text>{record.assignedStaffName || record.staffName || "Tự động phân bổ"}</Text>
                </Space>
            )
        },
        {
            title: "Giờ hẹn",
            width: 180,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{formatTime(record.startTime)} - {formatTime(record.endTime)}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(record.bookingDate)}</Text>
                </Space>
            )
        },
        {
            title: "Tổng tiền",
            width: 150,
            render: (_, record) => (
                <Text strong style={{ color: "#389e0d" }}>
                    {formatCurrency(record.totalPrice || 0)} đ
                </Text>
            )
        },
        {
            title: "Trạng thái",
            width: 150,
            render: (_, record) => {
                const meta = STATUS_META[record.status] || { label: record.status || "-", color: "default" };
                return <Tag color={meta.color}>{meta.label}</Tag>;
            }
        },
        {
            title: "Thao tác",
            width: 240,
            fixed: "right",
            render: (_, record) => {
                const workflowAction = getWorkflowAction(record.status);
                const isBusy = actionLoadingKey === `${record.id}-${workflowAction?.key}`;

                return (
                    <Space wrap>
                        <Button size="small" onClick={() => { setSelectedBooking(record); setDetailOpen(true); }}>
                            Chi tiết
                        </Button>
                        {workflowAction && (
                            <Button
                                size="small"
                                type="primary"
                                icon={isBusy ? <LoadingOutlined /> : workflowAction.icon}
                                loading={isBusy}
                                style={{
                                    backgroundColor: workflowAction.color === "green" ? "#52c41a" : (workflowAction.color === "gold" ? "#fa8c16" : undefined),
                                    borderColor: workflowAction.color === "green" ? "#52c41a" : (workflowAction.color === "gold" ? "#fa8c16" : undefined)
                                }}
                                onClick={() => runWorkflowAction(record, workflowAction.key)}
                            >
                                {workflowAction.label}
                            </Button>
                        )}
                        {record.status === "CONFIRMED" && (
                            <Button
                                size="small"
                                type="primary"
                                icon={actionLoadingKey === `${record.id}-manual_checkin` ? <LoadingOutlined /> : <CheckCircleOutlined />}
                                loading={actionLoadingKey === `${record.id}-manual_checkin`}
                                style={{ backgroundColor: "#13c2c2", borderColor: "#13c2c2" }}
                                onClick={() => runWorkflowAction(record, "manual_checkin")}
                            >
                                Check-in Thủ công
                            </Button>
                        )}
                        {record.status === "COMPLETED" && (
                                <Button
                                    size="small"
                                    type="default"
                                    icon={<DollarOutlined />}
                                    style={{ borderColor: "#52c41a", color: "#52c41a" }}
                                    onClick={async () => {
                                        if (record?.invoiceUrl) {
                                            try {
                                                const url = await getInvoiceUrl(record.invoiceUrl);
                                                if (url) {
                                                    window.open(url, "_blank");
                                                    return;
                                                }
                                            } catch (e) {
                                                console.error("Lỗi lấy hóa đơn PDF:", e);
                                            }
                                        }
                                        setCheckoutBooking(record);
                                        setCheckoutModalOpen(true);
                                    }}
                                >
                                    Xem hóa đơn
                                </Button>
                            )}
                    </Space>
                );
            }
        }
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
                <Title level={3} style={{ marginBottom: 4 }}>
                    Check-in & Hoàn thành booking
                </Title>
                <Text type="secondary">
                    Màn hình theo dõi booking, quét QR xác nhận khách đến (Check-in) và hoàn thành phục vụ tại chi nhánh.
                </Text>
            </div>

            <Alert
                type="info"
                showIcon
                message="Workflow"
                description="Quy trình gợi ý: PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED. Customer chỉ có thể đánh giá sau khi booking sang COMPLETED."
            />

            <Card>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Tổng booking" value={summary.total} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Chờ xử lý" value={summary.pending} valueStyle={{ color: "#d48806" }} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Đã xác nhận" value={summary.confirmed} valueStyle={{ color: "#1677ff" }} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Statistic title="Đã hoàn thành" value={summary.completed} valueStyle={{ color: "#52c41a" }} />
                    </Col>
                </Row>
            </Card>

            <Card>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
                        <Space wrap>
                            {isManagerPage || branches.length <= 1 ? (
                                <Tag color="orange" style={{ fontSize: 14, padding: "5px 14px", borderRadius: 6, fontWeight: 600, display: "inline-flex", alignItems: "center", height: 32 }}>
                                    <ShopOutlined style={{ marginRight: 6 }} />
                                    Chi nhánh: {selectedBranch?.name || "Đang tải..."}
                                </Tag>
                            ) : (
                                <Select
                                    showSearch
                                    style={{ width: 260 }}
                                    placeholder="Chọn chi nhánh"
                                    value={branchId || undefined}
                                    onChange={handleBranchChange}
                                    loading={loadingBranches}
                                    options={branches.map((branch) => ({
                                        value: String(branch.id),
                                        label: branch.name
                                    }))}
                                    optionFilterProp="label"
                                />
                            )}

                            <Select
                                style={{ width: 180 }}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    { value: "ALL", label: "Tất cả trạng thái" },
                                    { value: "PENDING", label: "Chờ xử lý" },
                                    { value: "CONFIRMED", label: "Đã xác nhận" },
                                    { value: "CHECKED_IN", label: "Đã check-in" },
                                    { value: "COMPLETED", label: "Đã hoàn thành" },
                                    { value: "CANCELLED", label: "Đã hủy" },
                                    { value: "NO_SHOW", label: "Vắng mặt" }
                                ]}
                            />

                            <RangePicker
                                value={dateRange}
                                onChange={(value) => setDateRange(value || null)}
                            />
                        </Space>

                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<QrcodeOutlined />}
                                style={{ backgroundColor: "#fa8c16", borderColor: "#fa8c16" }}
                                onClick={() => setQrModalOpen(true)}
                            >
                                Quét mã QR Check-in
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loadingBookings}>
                                Làm mới
                            </Button>
                        </Space>
                    </Space>

                    <Input.Search
                        allowClear
                        placeholder="Tìm theo mã booking, tên khách, SĐT, nhân viên, dịch vụ..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={(value) => setSearchText(value)}
                        enterButton={<SearchOutlined />}
                    />
                </Space>
            </Card>

            <Card
                title={
                    <Space>
                        <ShoppingOutlined />
                        <span>Danh sách booking</span>
                        {selectedBranch ? (
                            <Tag color="blue">{selectedBranch.name}</Tag>
                        ) : null}
                    </Space>
                }
                extra={
                    <Text type="secondary">
                        {filteredBookings.length} / {bookings.length} booking
                    </Text>
                }
            >
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredBookings}
                    loading={loadingBookings}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"]
                    }}
                    scroll={{ x: 1450 }}
                    locale={{
                        emptyText: (
                            <Empty
                                description="Không có booking phù hợp với bộ lọc hiện tại."
                            />
                        )
                    }}
                />
            </Card>

            <Modal
                title={
                    <Space>
                        <CheckCircleOutlined />
                        <span>Chi tiết booking #{selectedBooking?.id || ""}</span>
                    </Space>
                }
                open={detailOpen}
                destroyOnClose
                afterClose={() => setSelectedBooking(null)}
                onCancel={() => setDetailOpen(false)}
                footer={[
                    <Button
                        key="close"
                        onClick={() => setDetailOpen(false)}
                    >
                        Đóng
                    </Button>,
                    selectedBooking && getWorkflowAction(selectedBooking.status) ? (
                        <Button
                            key="workflow"
                            type="primary"
                            loading={actionLoadingKey === `${selectedBooking.id}-${getWorkflowAction(selectedBooking.status)?.key}`}
                            icon={getWorkflowAction(selectedBooking.status)?.icon}
                            style={{
                                backgroundColor: getWorkflowAction(selectedBooking.status)?.color === "gold" ? "#fa8c16" : undefined,
                                borderColor: getWorkflowAction(selectedBooking.status)?.color === "gold" ? "#fa8c16" : undefined
                            }}
                            onClick={() => {
                                const workflowAction = getWorkflowAction(selectedBooking.status);
                                if (workflowAction) {
                                    runWorkflowAction(selectedBooking, workflowAction.key);
                                }
                            }}
                        >
                            {getWorkflowAction(selectedBooking.status)?.label}
                        </Button>
                    ) : null,
                    selectedBooking?.status === "CONFIRMED" && (
                        <Button
                            key="manual_checkin"
                            type="primary"
                            loading={actionLoadingKey === `${selectedBooking.id}-manual_checkin`}
                            icon={<CheckCircleOutlined />}
                            style={{ backgroundColor: "#13c2c2", borderColor: "#13c2c2" }}
                            onClick={() => runWorkflowAction(selectedBooking, "manual_checkin")}
                        >
                            Check-in Thủ công
                        </Button>
                    )
                ]}
                width={760}
            >
                {selectedBooking ? (
                    <Space direction="vertical" size={16} style={{ width: "100%" }}>
                        <Descriptions bordered column={1} size="middle">
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={STATUS_META[selectedBooking.status]?.color || "default"}>
                                    {STATUS_META[selectedBooking.status]?.label || selectedBooking.status || "-"}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">
                                {selectedBooking.customerName || selectedBooking.customer?.name || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">
                                {selectedBooking.customerPhone || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chi nhánh">
                                {selectedBooking.branchName || selectedBranch?.name || "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nhân viên">
                                {selectedBooking.assignedStaffName || selectedBooking.staffName || "Tự động phân bổ"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày / Giờ">
                                {formatDate(selectedBooking.bookingDate)} {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Tổng giá trị">
                                {formatCurrency(selectedBooking.totalPrice || 0)} đ
                            </Descriptions.Item>
                        </Descriptions>

                        <div>
                            <Text strong>Dịch vụ / combo</Text>
                            <div style={{ marginTop: 8 }}>
                                {Array.isArray(selectedBooking.items) && selectedBooking.items.length > 0 ? (
                                    <Space wrap>
                                        {selectedBooking.items.map((item, idx) => (
                                            <Tag color="blue" key={item.id || `${selectedBooking.id}-${idx}`}>
                                                {item.serviceName || item.bundleName || "Dịch vụ"}
                                            </Tag>
                                        ))}
                                    </Space>
                                ) : (
                                    <Text type="secondary">Không có dữ liệu chi tiết.</Text>
                                )}
                            </div>
                        </div>

                        {selectedBooking.notes ? (
                            <div style={{ padding: 16, borderRadius: 12, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                                <Text strong>Ghi chú khách hàng</Text>
                                <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                                    {selectedBooking.notes}
                                </Paragraph>
                            </div>
                        ) : null}
                    </Space>
                ) : null}
            </Modal>

            <QrScannerModal
                open={qrModalOpen}
                onCancel={() => setQrModalOpen(false)}
                onSuccess={() => {
                    setQrModalOpen(false);
                    loadBookings(branchId);
                }}
            />

            <ManagerCheckoutModal
                open={checkoutModalOpen}
                booking={checkoutBooking}
                onCancel={() => setCheckoutModalOpen(false)}
                onSuccess={() => {
                    setCheckoutModalOpen(false);
                    loadBookings(branchId);
                }}
            />
        </div>
    );
}
