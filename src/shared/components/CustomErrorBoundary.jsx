import React, { Component } from "react";
import { Button, Typography, message, Modal, Input } from "antd";
import { 
    AlertTriangle, 
    RefreshCw, 
    Home, 
    Copy, 
    Check, 
    ChevronDown, 
    ChevronUp, 
    Send,
    Bug
} from "lucide-react";
import { captureErrorToSentry, Sentry } from "@/core/monitoring/sentry";

const { Text, Paragraph } = Typography;

export class CustomErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
            copied: false,
            isFeedbackModalOpen: false,
            feedbackComment: "",
            feedbackSending: false,
            feedbackSent: false,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        
        // Bắt và gửi lên Sentry
        captureErrorToSentry(error, {
            extra: {
                componentStack: errorInfo?.componentStack,
                location: window.location.href,
                time: new Date().toISOString(),
            },
            tags: {
                errorBoundary: "CustomErrorBoundary",
            }
        });

        console.error("[CustomErrorBoundary] Caught an uncaught React error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    handleCopyError = () => {
        const { error, errorInfo } = this.state;
        const textToCopy = `SalonFlow Error Report:
Time: ${new Date().toISOString()}
URL: ${window.location.href}
Message: ${error?.message || "Unknown error"}
Stack: ${error?.stack || ""}
ComponentStack: ${errorInfo?.componentStack || ""}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            this.setState({ copied: true });
            message.success("Đã sao chép chi tiết mã lỗi vào bộ nhớ tạm!");
            setTimeout(() => this.setState({ copied: false }), 3000);
        }).catch(() => {
            message.error("Không thể sao chép mã lỗi.");
        });
    };

    handleSendFeedback = () => {
        const { error, feedbackComment } = this.state;
        this.setState({ feedbackSending: true });

        // Gửi user feedback lên Sentry
        try {
            Sentry.captureMessage(`User Feedback: ${feedbackComment || "No comment"} | Error: ${error?.message}`, "info");
            setTimeout(() => {
                this.setState({ 
                    feedbackSending: false, 
                    feedbackSent: true, 
                    isFeedbackModalOpen: false 
                });
                message.success("Cảm ơn bạn! Báo cáo sự cố đã được gửi tới đội ngũ kỹ thuật.");
            }, 600);
        } catch (e) {
            this.setState({ feedbackSending: false, isFeedbackModalOpen: false });
            message.success("Báo cáo sự cố đã được ghi nhận.");
        }
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, showDetails, copied, isFeedbackModalOpen, feedbackComment, feedbackSending, feedbackSent } = this.state;

            // Nếu props fallback tuỳ chỉnh được truyền vào
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #020617 100%)",
                    padding: "24px",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    color: "#f8fafc",
                }}>
                    <div style={{
                        maxWidth: "680px",
                        width: "100%",
                        background: "rgba(30, 41, 59, 0.75)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "24px",
                        padding: "36px 32px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.15)",
                        textAlign: "center",
                    }}>
                        {/* Icon cảnh báo với hiệu ứng xung */}
                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "20px",
                            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.35) 100%)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px auto",
                            boxShadow: "0 0 30px rgba(239, 68, 68, 0.3)",
                        }}>
                            <AlertTriangle size={36} color="#ef4444" />
                        </div>

                        <h1 style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#ffffff",
                            marginBottom: "8px",
                            letterSpacing: "-0.02em",
                        }}>
                            Đã xảy ra sự cố không mong muốn
                        </h1>

                        <p style={{
                            fontSize: "15px",
                            color: "#94a3b8",
                            marginBottom: "28px",
                            lineHeight: "1.6",
                        }}>
                            Hệ thống đã tự động ghi nhận và chuyển mã lỗi này đến đội ngũ kỹ thuật thông qua <b style={{ color: "#38bdf8" }}>Sentry Monitoring</b> để xử lý ngay lập tức.
                        </p>

                        {/* Error Message Box */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.8)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: "14px",
                            padding: "14px 16px",
                            textAlign: "left",
                            marginBottom: "24px",
                            fontSize: "13px",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            color: "#fca5a5",
                            wordBreak: "break-word",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", color: "#f87171", fontWeight: "600" }}>
                                <Bug size={16} /> {error?.name || "Error"}:
                            </div>
                            {error?.message || "An unknown rendering error occurred."}
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                            justifyContent: "center",
                            marginBottom: "24px",
                        }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<RefreshCw size={17} />}
                                onClick={this.handleReload}
                                style={{
                                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                    border: "none",
                                    fontWeight: "600",
                                    borderRadius: "12px",
                                    height: "44px",
                                    padding: "0 22px",
                                }}
                            >
                                Thử tải lại trang
                            </Button>

                            <Button
                                size="large"
                                icon={<Home size={17} />}
                                onClick={this.handleGoHome}
                                style={{
                                    background: "rgba(255, 255, 255, 0.08)",
                                    border: "1px solid rgba(255, 255, 255, 0.15)",
                                    color: "#f8fafc",
                                    fontWeight: "600",
                                    borderRadius: "12px",
                                    height: "44px",
                                    padding: "0 22px",
                                }}
                            >
                                Về trang chủ
                            </Button>

                            <Button
                                size="large"
                                icon={copied ? <Check size={17} color="#22c55e" /> : <Copy size={17} />}
                                onClick={this.handleCopyError}
                                style={{
                                    background: "rgba(255, 255, 255, 0.04)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    color: "#cbd5e1",
                                    borderRadius: "12px",
                                    height: "44px",
                                    padding: "0 18px",
                                }}
                            >
                                {copied ? "Đã sao chép" : "Sao chép lỗi"}
                            </Button>

                            {!feedbackSent && (
                                <Button
                                    size="large"
                                    icon={<Send size={17} />}
                                    onClick={() => this.setState({ isFeedbackModalOpen: true })}
                                    style={{
                                        background: "rgba(245, 158, 11, 0.15)",
                                        border: "1px solid rgba(245, 158, 11, 0.3)",
                                        color: "#fbbf24",
                                        borderRadius: "12px",
                                        height: "44px",
                                        padding: "0 18px",
                                    }}
                                >
                                    Gửi phản hồi
                                </Button>
                            )}
                        </div>

                        {/* Collapsible Stack Trace */}
                        <div>
                            <button
                                onClick={() => this.setState({ showDetails: !showDetails })}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#64748b",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    transition: "color 0.2s",
                                }}
                                onMouseEnter={(e) => (e.target.style.color = "#94a3b8")}
                                onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                            >
                                {showDetails ? "Thu gọn chi tiết kỹ thuật" : "Xem chi tiết kỹ thuật (Stack Trace)"}
                                {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>

                            {showDetails && (
                                <div style={{
                                    marginTop: "12px",
                                    background: "#090d16",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    textAlign: "left",
                                    maxHeight: "240px",
                                    overflowY: "auto",
                                    fontSize: "11px",
                                    fontFamily: "ui-monospace, monospace",
                                    color: "#94a3b8",
                                    whiteSpace: "pre-wrap",
                                    lineHeight: "1.5",
                                }}>
                                    <b>Stack Trace:</b>
                                    {"\n"}
                                    {error?.stack || "No stack trace available"}
                                    {"\n\n"}
                                    <b>Component Stack:</b>
                                    {"\n"}
                                    {errorInfo?.componentStack || "No component stack available"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Gửi Phản Hồi / Feedback */}
                    <Modal
                        title="💬 Báo Cáo Phản Hồi Sự Cố"
                        open={isFeedbackModalOpen}
                        onCancel={() => this.setState({ isFeedbackModalOpen: false })}
                        footer={[
                            <Button key="cancel" onClick={() => this.setState({ isFeedbackModalOpen: false })}>
                                Đóng
                            </Button>,
                            <Button 
                                key="submit" 
                                type="primary" 
                                loading={feedbackSending} 
                                onClick={this.handleSendFeedback}
                                style={{ background: "#2563eb", borderColor: "#2563eb" }}
                            >
                                Gửi Báo Cáo
                            </Button>,
                        ]}
                    >
                        <p style={{ color: "#475569", fontSize: "14px", marginBottom: "12px" }}>
                            Hãy chia sẻ thêm thao tác bạn vừa thực hiện trước khi gặp lỗi để đội ngũ kỹ thuật khắc phục nhanh nhất:
                        </p>
                        <Input.TextArea
                            rows={4}
                            placeholder="Ví dụ: Tôi vừa nhấn nút Đặt Lịch tại chi nhánh Cầu Giấy thì màn hình bị đơ..."
                            value={feedbackComment}
                            onChange={(e) => this.setState({ feedbackComment: e.target.value })}
                        />
                    </Modal>
                </div>
            );
        }

        return this.props.children;
    }
}

export default CustomErrorBoundary;
