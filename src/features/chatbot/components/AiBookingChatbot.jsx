import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Input, Space, Typography, message as antdMessage } from "antd";
import {
    CloseOutlined,
    CustomerServiceOutlined,
    MessageOutlined,
    ReloadOutlined,
    SendOutlined
} from "@ant-design/icons";

import { sendChatbotMessageApi } from "@/features/chatbot/api/chatbotApi";

const { Text } = Typography;
const SESSION_KEY = "salonflow_chatbot_session";

const createMessage = (role, content) => ({
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
});

export default function AiBookingChatbot({
    branchId,
    branchName,
    bookingMode = "guest",
    onHumanHandoff
}) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        createMessage("bot", "Chào bạn, mình có thể hỗ trợ đặt lịch bằng hội thoại. Hãy chọn chi nhánh rồi nhắn nhu cầu của bạn nhé.")
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [needsHumanHandoff, setNeedsHumanHandoff] = useState(false);
    const bodyRef = useRef(null);
    const sendingRef = useRef(false);

    const sessionKey = useMemo(
        () => `${SESSION_KEY}:${bookingMode}:${branchId || "no-branch"}`,
        [bookingMode, branchId]
    );

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, loading, open]);

    useEffect(() => {
        setNeedsHumanHandoff(false);
        setInput("");
        setMessages([
            createMessage(
                "bot",
                branchId
                    ? `Mình đang hỗ trợ đặt lịch tại ${branchName || `chi nhánh #${branchId}`}. Bạn muốn đặt dịch vụ gì và vào thời gian nào?`
                    : "Chào bạn, mình có thể hỗ trợ đặt lịch bằng hội thoại. Hãy chọn chi nhánh rồi nhắn nhu cầu của bạn nhé."
            )
        ]);
    }, [branchId, branchName, bookingMode]);

    const resetConversation = () => {
        localStorage.removeItem(sessionKey);
        setNeedsHumanHandoff(false);
        setInput("");
        setMessages([
            createMessage("bot", "Mình đã tạo hội thoại mới. Bạn muốn đặt dịch vụ nào và vào thời gian nào?")
        ]);
    };

    const sendMessage = async (nextValue) => {
        const text = String(nextValue ?? input).trim();

        if (!branchId) {
            antdMessage.warning("Vui lòng chọn chi nhánh trước khi chat đặt lịch.");
            return;
        }

        if (!text || sendingRef.current || needsHumanHandoff) {
            return;
        }

        sendingRef.current = true;
        const userMessage = createMessage("user", text);
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const data = await sendChatbotMessageApi({
                conversationId: localStorage.getItem(sessionKey) || "",
                branchId,
                message: text
            });

            if (data?.conversationId) {
                localStorage.setItem(sessionKey, data.conversationId);
            }

            setMessages((prev) => [
                ...prev,
                createMessage("bot", data?.answer || "Mình chưa có phản hồi phù hợp, bạn thử nhắn lại giúp mình nhé.")
            ]);
            setNeedsHumanHandoff(Boolean(data?.needsHumanHandoff));
        } catch (error) {
            antdMessage.error(error?.response?.data?.message || "Không thể gửi tin nhắn đến chatbot.");
            setMessages((prev) => [
                ...prev,
                createMessage("bot", "Kết nối chatbot đang gặp lỗi. Bạn có thể chuyển sang biểu mẫu thường để tiếp tục đặt lịch.")
            ]);
        } finally {
            sendingRef.current = false;
            setLoading(false);
        }
    };

    const handleHumanHandoff = () => {
        setOpen(false);
        if (onHumanHandoff) {
            onHumanHandoff();
        }
    };

    return (
        <>
            {!open ? (
                <Button
                    type="primary"
                    shape="round"
                    icon={<MessageOutlined />}
                    onClick={() => setOpen(true)}
                    style={{
                        position: "fixed",
                        right: 24,
                        bottom: 24,
                        zIndex: 1000,
                        height: 44,
                        boxShadow: "0 8px 24px rgba(22,119,255,0.28)"
                    }}
                >
                    Chat đặt lịch
                </Button>
            ) : (
                <Card
                    title={
                        <Space>
                            <CustomerServiceOutlined style={{ color: "#1677ff" }} />
                            <span>AI đặt lịch</span>
                        </Space>
                    }
                    extra={
                        <Space>
                            <Button type="text" icon={<ReloadOutlined />} onClick={resetConversation} />
                            <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} />
                        </Space>
                    }
                    style={{
                        position: "fixed",
                        right: 24,
                        bottom: 24,
                        width: "min(380px, calc(100vw - 32px))",
                        zIndex: 1000,
                        borderRadius: 8,
                        boxShadow: "0 14px 40px rgba(15,23,42,0.18)"
                    }}
                    styles={{ body: { padding: 12 } }}
                >
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {branchId ? `Chi nhánh: ${branchName || `#${branchId}`}` : "Chọn chi nhánh trong form trước khi chat."}
                        </Text>

                        <div
                            ref={bodyRef}
                            style={{
                                height: 300,
                                overflowY: "auto",
                                padding: 8,
                                background: "#f8fafc",
                                borderRadius: 8,
                                border: "1px solid #edf2f7"
                            }}
                        >
                            <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                {messages.map((item) => {
                                    const isUser = item.role === "user";

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: isUser ? "flex-end" : "flex-start"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    maxWidth: "86%",
                                                    whiteSpace: "pre-line",
                                                    padding: "8px 10px",
                                                    borderRadius: 8,
                                                    background: isUser ? "#1677ff" : "#fff",
                                                    color: isUser ? "#fff" : "#1f2937",
                                                    border: isUser ? "none" : "1px solid #e5e7eb",
                                                    fontSize: 14
                                                }}
                                            >
                                                {item.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                {loading ? (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        AI đang trả lời...
                                    </Text>
                                ) : null}
                            </Space>
                        </div>

                        {needsHumanHandoff ? (
                            <Alert
                                type="warning"
                                showIcon
                                message="Mình sẽ chuyển bạn sang biểu mẫu thường để đặt lịch chắc chắn hơn."
                                action={
                                    <Button size="small" type="primary" onClick={handleHumanHandoff}>
                                        Chuyển sang biểu mẫu thường
                                    </Button>
                                }
                            />
                        ) : (
                            <Input.Search
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                onSearch={sendMessage}
                                enterButton={<SendOutlined />}
                                placeholder={branchId ? "Nhập nhu cầu đặt lịch..." : "Hãy chọn chi nhánh trước"}
                                disabled={!branchId || loading}
                                loading={loading}
                            />
                        )}
                    </Space>
                </Card>
            )}
        </>
    );
}
