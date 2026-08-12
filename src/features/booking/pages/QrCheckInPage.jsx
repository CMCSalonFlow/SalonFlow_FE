import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Alert,
    Button,
    Card,
    Descriptions,
    Result,
    Space,
    Spin,
    Tag,
    Typography
} from "antd";
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined,
    ShopOutlined,
    UserOutlined
} from "@ant-design/icons";

import { checkInBookingByQrApi } from "@/features/booking/api/bookingApi";
import { checkAuthSession, getRoles } from "@/core/utils/auth";

const { Text } = Typography;

const CHECK_IN_ROLES = [
    "STAFF",
    "SALON_OWNER",
    "BRANCH_MANAGER",
    "ADMIN",
    "SUPER_ADMIN"
];

const getErrorMessage = (error) => {
    if (!error?.response) {
        return "Không thể kết nối máy chủ. Vui lòng thử lại.";
    }

    return error.response.data?.message || "Check-in thất bại. Vui lòng thử lại.";
};

const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

const formatBookingTime = (booking) => {
    if (!booking) return "-";

    const timeRange = [booking.startTime, booking.endTime].filter(Boolean).join(" - ");
    return [booking.bookingDate, timeRange].filter(Boolean).join(" | ") || "-";
};

export default function QrCheckInPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const bookingId = query.get("bookingId");
    const signature = query.get("signature");

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [statusCode, setStatusCode] = useState(null);

    const hasAllowedRole = useMemo(() => {
        const roles = getRoles();
        return CHECK_IN_ROLES.some(role => roles.includes(role));
    }, []);

    const scannerPath = useMemo(() => {
        const roles = getRoles();
        if (roles.includes("SALON_OWNER")) {
            return "/owner/check-in-scanner";
        }
        return "/staff/check-in-scanner";
    }, []);

    const immediateError = useMemo(() => {
        if (!checkAuthSession()) return null;

        if (!hasAllowedRole) {
            return {
                statusCode: 403,
                message: "Tài khoản hiện tại không có quyền check-in booking."
            };
        }

        if (!bookingId || !signature) {
            return {
                statusCode: 400,
                message: "QR thiếu bookingId hoặc signature."
            };
        }

        return null;
    }, [bookingId, signature, hasAllowedRole]);

    useEffect(() => {
        if (!checkAuthSession()) {
            navigate("/login", {
                replace: true,
                state: {
                    from: `${location.pathname}${location.search}`
                }
            });
            return;
        }

        if (immediateError) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
            return;
        }

        let ignored = false;

        const checkIn = async () => {
            try {
                setLoading(true);
                setError("");
                setStatusCode(null);

                const data = await checkInBookingByQrApi(bookingId, signature);
                if (!ignored) {
                    setResult(data);
                }
            } catch (err) {
                if (!ignored) {
                    setStatusCode(err?.response?.status || null);
                    setError(getErrorMessage(err));
                }
            } finally {
                if (!ignored) {
                    setLoading(false);
                }
            }
        };

        checkIn();

        return () => {
            ignored = true;
        };
    }, [bookingId, signature, immediateError, location.pathname, location.search, navigate]);

    const displayError = immediateError?.message || error;
    const displayStatusCode = immediateError?.statusCode || statusCode;

    const isAlreadyCheckedIn = /trước đó|truoc do|already/i.test(result?.message || "");
    const resultStatus = isAlreadyCheckedIn ? "warning" : "success";
    const resultIcon = isAlreadyCheckedIn ? (
        <ExclamationCircleOutlined style={{ color: "#faad14" }} />
    ) : (
        <CheckCircleOutlined style={{ color: "#52c41a" }} />
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: 24 }}>
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
                <Space style={{ marginBottom: 16 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(scannerPath)}>
                        Quay lại scanner
                    </Button>
                </Space>

                <Card style={{ borderRadius: 8 }}>
                    {loading ? (
                        <div style={{ minHeight: 260, display: "grid", placeItems: "center" }}>
                            <Space direction="vertical" align="center" size={16}>
                                <Spin size="large" />
                                <Text>Đang check-in booking...</Text>
                            </Space>
                        </div>
                    ) : displayError ? (
                        <Result
                            status="error"
                            title="Check-in thất bại"
                            subTitle={displayError}
                            extra={[
                                <Button
                                    key="retry"
                                    type="primary"
                                    danger
                                    icon={<ReloadOutlined />}
                                    disabled={!bookingId || !signature || displayStatusCode === 403}
                                    onClick={() => window.location.reload()}
                                >
                                    Thử lại
                                </Button>,
                                <Button
                                    key="scanner"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate(scannerPath)}
                                >
                                    Quét QR khác
                                </Button>
                            ]}
                        >
                            {displayStatusCode && (
                                <Alert
                                    type="error"
                                    showIcon
                                    message={`HTTP ${displayStatusCode}`}
                                    style={{ textAlign: "left" }}
                                />
                            )}
                        </Result>
                    ) : (
                        <Result
                            status={resultStatus}
                            icon={resultIcon}
                            title={result?.message || "Check-in thành công"}
                            subTitle={
                                <Space wrap>
                                    <Tag color={isAlreadyCheckedIn ? "gold" : "green"}>
                                        {result?.status || "CHECKED_IN"}
                                    </Tag>
                                    <Text>Booking #{result?.bookingId || bookingId}</Text>
                                </Space>
                            }
                            extra={[
                                <Button
                                    key="scanner"
                                    type="primary"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate(scannerPath)}
                                >
                                    Quét QR tiếp theo
                                </Button>
                            ]}
                        >
                            <Descriptions bordered column={1} size="middle">
                                <Descriptions.Item label={<><UserOutlined /> Khách hàng</>}>
                                    {result?.customerName || "-"} {result?.customerPhone ? `- ${result.customerPhone}` : ""}
                                </Descriptions.Item>
                                <Descriptions.Item label={<><CalendarOutlined /> Lịch hẹn</>}>
                                    {formatBookingTime(result)}
                                </Descriptions.Item>
                                <Descriptions.Item label={<><ShopOutlined /> Chi nhánh</>}>
                                    {result?.branchName || "-"}
                                </Descriptions.Item>
                                <Descriptions.Item label="Nhân viên phụ trách">
                                    {result?.assignedStaffName || "-"}
                                </Descriptions.Item>
                                <Descriptions.Item label={<><ClockCircleOutlined /> Thời điểm check-in</>}>
                                    {formatDateTime(result?.checkedInAt)}
                                </Descriptions.Item>
                            </Descriptions>
                        </Result>
                    )}
                </Card>
            </div>
        </div>
    );
}
