
import { useEffect, useRef, useState } from "react";

const STATUS_COLORS = {
  HOLIDAY: "#ff4d4f",
  LEAVE: "#fa8c16",
  SCHEDULED: "#1677ff",
  CONFIRMED: "#34a853",
  WORKING: "#1677ff",
  PENDING: "#f29900",
  CANCELLED: "#c5221f",
  COMPLETED: "#52c41a",
  OFF: "#8c8c8c",
  default: "#1a73e8",
};
const STATUS_LABELS = {
  HOLIDAY: "Nghỉ lễ",
  LEAVE: "Nghỉ phép",
  SCHEDULED: "Đã xếp lịch",
  CONFIRMED: "Đã xác nhận",
  WORKING: "Đang làm việc",
  PENDING: "Chờ xử lý",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  OFF: "Nghỉ làm",
};
const STATUS_ICONS = {
  HOLIDAY: "",
  LEAVE: "",
  SCHEDULED: "",
  CONFIRMED: "✓",
  WORKING: "",
  PENDING: "⏳",
  CANCELLED: "✕",
  COMPLETED: "✓",
  OFF: "",
};
export default function BookingDetailModal({ open, onClose, booking, anchorPos, onCancelBooking }) {
  const popupRef = useRef(null);
  const [pos, setPos] = useState({ top: 100, left: 200 });
  useEffect(() => {
    if (!open || !anchorPos) return;
    // Smart positioning - avoid going off screen
    const popup = { w: 320, h: 340 };
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchorPos.x + 16;
    let top = anchorPos.y;
    if (left + popup.w + margin > vw) {
      left = anchorPos.x - popup.w - 16;
    }
    if (top + popup.h + margin > vh) {
      top = vh - popup.h - margin;
    }
    if (top < margin) top = margin;
    if (left < margin) left = margin;
    setPos({ top, left });
  }, [open, anchorPos]);
  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Slight delay so the click that opened doesn't immediately close
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);
  if (!open || !booking) return null;
  const status = booking.isHoliday ? "HOLIDAY" : (booking.isStaffLeave ? "LEAVE" : (booking.status || "SCHEDULED"));
  const color = booking.color || STATUS_COLORS[status] || STATUS_COLORS.default;
  let statusLabel = STATUS_LABELS[status] || status;
  if (status === "HOLIDAY") {
    statusLabel = booking.holidayTitle ? `Nghỉ lễ (${booking.holidayTitle})` : "Nghỉ lễ";
  } else if (status === "LEAVE") {
    statusLabel = booking.leaveReason ? `Nghỉ phép (${booking.leaveReason})` : "Nghỉ phép";
  }
  const statusIcon = STATUS_ICONS[status] || "";
  const formatTime = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate = (str) => {
    if (!str) return "";
    const d = new Date(str);
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const duration = () => {
    if (!booking.start || !booking.end) return "";
    const diffMs = new Date(booking.end) - new Date(booking.start);
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins} phút`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  };
  return (
    <>
      {/* Invisible overlay */}
      <div className="booking-popup-overlay" onClick={onClose} />
      {/* Popup */}
      <div
        ref={popupRef}
        className="booking-popup"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Header */}
        <div className="booking-popup-header">
          <div
            className="booking-popup-color-bar"
            style={{ background: color }}
          />
          <div className="booking-popup-title">Chi tiết lịch làm việc</div>
          <div className="booking-popup-actions">
            <button
              className="popup-action-btn close-btn"
              onClick={onClose}
              title="Đóng"
            >
              ×
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="booking-popup-body">
          {/* Date & time */}
          <div className="popup-row">
            <span className="popup-row-icon">🕐</span>
            <div className="popup-row-content">
              <div className="popup-row-value">
                {formatTime(booking.start)} – {formatTime(booking.end)}
                <span style={{ color: "var(--gc-gray-500)", fontSize: 12, marginLeft: 6 }}>
                  ({duration()})
                </span>
              </div>
              <div className="popup-row-label">
                {formatDate(booking.start || booking.shiftDate)}
              </div>
            </div>
          </div>
          {/* Customer */}
          {(booking.customerName || booking.customerPhone) && (
            <div className="popup-row">
              <span className="popup-row-icon">📞</span>
              <div className="popup-row-content">
                <div className="popup-row-label">Khách hàng</div>
                <div className="popup-row-value" style={{ fontWeight: "bold" }}>
                  {booking.customerName || "Khách vãng lai"} {booking.customerPhone ? `(${booking.customerPhone})` : ""}
                </div>
              </div>
            </div>
          )}
          {/* Status */}
          <div className="popup-row">
            <span className="popup-row-icon">📋</span>
            <div className="popup-row-content" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="popup-row-label" style={{ margin: 0 }}>Trạng thái:</span>
              <span className="popup-row-value" style={{ fontWeight: 600, color: color }}>
                {statusLabel}
              </span>
            </div>
          </div>
          {/* Note */}
          {booking.note && (
            <div className="popup-row">
              <span className="popup-row-icon">📝</span>
              <div className="popup-row-content">
                <div className="popup-row-label">Ghi chú</div>
                <div className="popup-row-value">{booking.note}</div>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="booking-popup-footer">
          <button className="popup-btn popup-btn-primary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </>
  );
}
