
import { useEffect } from "react";
export default function ConfirmMoveModal({ open, onOk, onCancel }) {
  // Auto-dismiss after 8s
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onCancel(), 8000);
    return () => clearTimeout(t);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="confirm-move-toast">
      <span className="toast-text">
        Di chuyển lịch hẹn sang thời gian mới?
      </span>
      <button className="toast-btn toast-btn-cancel" onClick={onCancel}>
        Hủy
      </button>
      <button className="toast-btn toast-btn-confirm" onClick={onOk}>
        Xác nhận
      </button>
    </div>
  );
}