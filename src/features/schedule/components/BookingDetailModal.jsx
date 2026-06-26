
import { useEffect, useRef, useState } from "react";

const STATUS_COLORS = {
  CONFIRMED: "#34a853",
  PENDING: "#f29900",
  CANCELLED: "#c5221f",
  default: "#1a73e8",
};
const STATUS_LABELS = {
  CONFIRMED: "Đã xác nhận",
  PENDING: "Chờ xử lý",
  CANCELLED: "Đã hủy",
};
const STATUS_ICONS = {
  CONFIRMED: "✓",
  PENDING: "⏳",
  CANCELLED: "✕",
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
  const status = booking.status || "default";
  const color = STATUS_COLORS[status] || STATUS_COLORS.default;
  const statusLabel = STATUS_LABELS[status] || status;
  const statusIcon = STATUS_ICONS[status] || "•";
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
          <div className="booking-popup-title">{booking.title}</div>
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
              <div className="popup-row-label">{formatDate(booking.start)}</div>
            </div>
          </div>
          {/* Customer */}
          <div className="popup-row">
            <span className="popup-row-icon">👤</span>
            <div className="popup-row-content">
              <div className="popup-row-label">Khách hàng</div>
              <div className="popup-row-value">{booking.customerName}</div>
              {booking.phone && (
                <div className="popup-row-label" style={{ marginTop: 2 }}>
                  📞 {booking.phone}
                </div>
              )}
            </div>
          </div>
          {/* Status */}
          <div className="popup-row">
            <span className="popup-row-icon">📋</span>
            <div className="popup-row-content">
              <div className="popup-row-label">Trạng thái</div>
              <span className={`booking-status-badge status-${status}`}>
                {statusIcon} {statusLabel}
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
          {booking.status !== "CANCELLED" && (
            <button
              className="popup-btn popup-btn-danger"
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) {
                  onCancelBooking?.(booking.id);
                }
              }}
            >
              Hủy lịch
            </button>
          )}
          <button className="popup-btn popup-btn-primary" onClick={onClose}>
            Chỉnh sửa
          </button>
        </div>
      </div>
    </>
  );
}