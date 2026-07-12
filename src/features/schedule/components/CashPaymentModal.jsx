import { useState } from "react";
import { Modal, Button, Descriptions, Typography, Space, Divider, message, Result } from "antd";
import { DollarOutlined, PrinterOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { confirmCashPaymentApi } from "../api/paymentApi";

const { Text, Title } = Typography;

/**
 * CashPaymentModal
 *
 * Props:
 *   open:       boolean
 *   onClose:    () => void
 *   onSuccess:  () => void    – callback sau khi thanh toán xong (reload calendar)
 *   booking:    object        – booking đang được thanh toán
 *   branchId:   number
 *   staffId:    number        – ID nhân viên đang đăng nhập
 */
export default function CashPaymentModal({ open, onClose, onSuccess, booking, branchId, staffId }) {
    const [loading, setLoading]       = useState(false);
    const [receipt, setReceipt]       = useState(null); // PaymentResponse từ BE

    const handleConfirm = async () => {
        if (!booking?.id || !staffId) {
            message.error("Thiếu thông tin booking hoặc nhân viên");
            return;
        }
        setLoading(true);
        try {
            const data = await confirmCashPaymentApi(branchId, {
                bookingId: Number(booking.id),
                staffId:   Number(staffId),
                note:      "",
            });
            setReceipt(data);
            onSuccess?.();
        } catch (err) {
            message.error(err?.response?.data?.message || "Thanh toán thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReceipt(null);
        onClose();
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) =>
        Number(amount).toLocaleString("vi-VN") + " đ";

    const formatTime = (str) => {
        if (!str) return "";
        return new Date(str).toLocaleString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={480}
            title={
                <Space>
                    <DollarOutlined style={{ color: "#b5865a" }} />
                    <span style={{ fontWeight: 700 }}>
                        {receipt ? "Hóa đơn thanh toán" : "Xác nhận thu tiền mặt"}
                    </span>
                </Space>
            }
            destroyOnClose
        >
            {/* ── BƯỚC 1: XÁC NHẬN ── */}
            {!receipt && booking && (
                <div>
                    <div style={{
                        background: "#fdf8f4", borderRadius: 10,
                        padding: 16, marginBottom: 20, border: "1px solid #f0e8e0",
                    }}>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Khách hàng">
                                <Text strong>{booking.customerName || booking.userName || booking.title}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Dịch vụ">
                                {booking.serviceName || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">
                                {booking.start
                                    ? new Date(booking.start).toLocaleString("vi-VN", {
                                        day: "2-digit", month: "2-digit",
                                        hour: "2-digit", minute: "2-digit",
                                    })
                                    : "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                                <Text strong style={{ fontSize: 18, color: "#b5865a" }}>
                                    {booking.totalPrice
                                        ? formatCurrency(booking.totalPrice)
                                        : "—"}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    <div style={{
                        background: "#fffbe6", border: "1px solid #ffe58f",
                        borderRadius: 8, padding: "10px 14px", marginBottom: 20,
                        fontSize: 13, color: "#614700",
                    }}>
                        ⚠ Vui lòng xác nhận đã nhận đủ tiền mặt từ khách trước khi bấm xác nhận.
                    </div>

                    <Space style={{ width: "100%", justifyContent: "flex-end" }} size={8}>
                        <Button onClick={handleClose}>Huỷ</Button>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={loading}
                            onClick={handleConfirm}
                            style={{ background: "#b5865a", borderColor: "#b5865a" }}
                            size="large"
                        >
                            Xác nhận đã thu tiền
                        </Button>
                    </Space>
                </div>
            )}

            {/* ── BƯỚC 2: HÓA ĐƠN ── */}
            {receipt && (
                <div>
                    <Result
                        status="success"
                        title="Thanh toán thành công!"
                        subTitle={`Mã thanh toán: #${receipt.paymentId}`}
                        style={{ padding: "12px 0" }}
                    />

                    <Divider style={{ margin: "8px 0 16px" }} />

                    {/* Hóa đơn */}
                    <div
                        id="receipt-print"
                        style={{
                            border: "1px solid #f0e8e0", borderRadius: 10,
                            padding: 16, background: "#fdfcfb",
                        }}
                    >
                        <div style={{ textAlign: "center", marginBottom: 12 }}>
                            <Title level={5} style={{ margin: 0, color: "#b5865a" }}>
                                {receipt.branchName}
                            </Title>
                            {receipt.branchAddress && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {receipt.branchAddress}
                                </Text>
                            )}
                            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                                HÓA ĐƠN TIỀN MẶT
                            </div>
                        </div>

                        <Divider dashed style={{ margin: "8px 0" }} />

                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Khách hàng">
                                {receipt.customerName}
                            </Descriptions.Item>
                            <Descriptions.Item label="SĐT">
                                {receipt.customerPhone || "—"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thu ngân">
                                {receipt.confirmedByName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian">
                                {formatTime(receipt.paidAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phương thức">
                                Tiền mặt
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider dashed style={{ margin: "8px 0" }} />

                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", padding: "8px 0",
                        }}>
                            <Text strong style={{ fontSize: 15 }}>TỔNG CỘNG</Text>
                            <Text strong style={{ fontSize: 20, color: "#b5865a" }}>
                                {formatCurrency(receipt.amount)}
                            </Text>
                        </div>

                        {receipt.note && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Ghi chú: {receipt.note}
                            </Text>
                        )}
                    </div>

                    <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }} size={8}>
                        <Button
                            icon={<PrinterOutlined />}
                            onClick={handlePrint}
                        >
                            In hóa đơn
                        </Button>
                        <Button type="primary" onClick={handleClose}
                            style={{ background: "#b5865a", borderColor: "#b5865a" }}>
                            Đóng
                        </Button>
                    </Space>
                </div>
            )}
        </Modal>
    );
}
