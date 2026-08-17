import React from "react";
import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function OfflineIndicator() {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div style={containerStyle}>
            <div style={toastStyle}>
                <div style={iconWrapperStyle}>
                    <WifiOff size={20} color="#ef4444" style={iconAnimStyle} />
                </div>
                <div style={contentStyle}>
                    <div style={titleStyle}>
                        Bạn đang ngoại tuyến
                        <span style={badgeStyle}>Offline Mode</span>
                    </div>
                    <div style={subtitleStyle}>
                        Đang xem dữ liệu từ bộ nhớ đệm. Chức năng đặt lịch/hủy lịch/thanh toán tạm khóa.
                    </div>
                </div>
            </div>
            <style>{keyframesStyle}</style>
        </div>
    );
}

const containerStyle = {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "480px",
    zIndex: 999999,
    animation: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
    pointerEvents: "none",
};

const toastStyle = {
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 18px",
    borderRadius: "14px",
    background: "rgba(24, 24, 27, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 15px 0 rgba(239, 68, 68, 0.15)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const iconWrapperStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
};

const contentStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
};

const titleStyle = {
    fontSize: "14px",
    fontWeight: "700",
    color: "#fafafa",
    display: "flex",
    alignItems: "center",
    gap: "8px",
};

const badgeStyle = {
    fontSize: "10px",
    fontWeight: "700",
    textTransform: "uppercase",
    background: "rgba(239, 68, 68, 0.2)",
    color: "#f87171",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid rgba(239, 68, 68, 0.3)",
};

const subtitleStyle = {
    fontSize: "11px",
    color: "#a1a1aa",
    lineHeight: "1.4",
};

const iconAnimStyle = {
    animation: "pulse 2s infinite ease-in-out",
};

const keyframesStyle = `
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translate(-50%, -20px);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0);
    }
}
@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.6;
        transform: scale(0.92);
    }
}
`;
