import React, { useState, useEffect } from "react";
import { 
    Card, 
    Row, 
    Col, 
    Typography, 
    Button, 
    Tag, 
    Space, 
    Progress, 
    Spin, 
    message, 
    Alert,
    Tooltip,
    Divider
} from "antd";
import { 
    Activity, 
    ShieldAlert, 
    Server, 
    ExternalLink, 
    Play, 
    Flame, 
    Bell, 
    Database, 
    Cpu, 
    CheckCircle2, 
    AlertTriangle, 
    Bug,
    Clock
} from "lucide-react";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

const SystemMonitoringPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [testingAlert, setTestingAlert] = useState(false);
    const [testingSentry, setTestingSentry] = useState(false);
    const [simulateCrash, setSimulateCrash] = useState(false);

    const fetchOverview = async () => {
        try {
            const res = await axios.get("/api/v1/monitoring/overview");
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch monitoring overview:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
        const interval = setInterval(fetchOverview, 10000); // 10s polling
        return () => clearInterval(interval);
    }, []);

    const handleTriggerTestAlert = async () => {
        setTestingAlert(true);
        try {
            const res = await axios.post("/api/v1/monitoring/test-alert");
            message.success(res.data?.message || "Đã gửi cảnh báo thử nghiệm thành công!");
        } catch (err) {
            message.error("Lỗi khi gửi cảnh báo thử nghiệm.");
        } finally {
            setTestingAlert(false);
        }
    };

    const handleTriggerSentry = async () => {
        setTestingSentry(true);
        try {
            const res = await axios.post("/api/v1/monitoring/test-alert?type=sentry");
            message.success(res.data?.message || "Đã ghi nhận sự kiện lỗi Sentry!");
        } catch (err) {
            message.error("Lỗi khi gửi sự kiện Sentry.");
        } finally {
            setTestingSentry(false);
        }
    };

    // Ném lỗi để kiểm tra CustomErrorBoundary React
    if (simulateCrash) {
        throw new Error("Sự cố giả lập để kiểm tra CustomErrorBoundary & Sentry Frontend Error Tracking!");
    }

    return (
        <div style={{ padding: "24px", maxWidth: "1300px", margin: "0 auto" }}>
            {/* Header Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                    <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <Activity color="#2563eb" size={28} /> Hệ Thống Giám Sát & Cảnh Báo (Monitoring & Alerting)
                    </Title>
                    <Text type="secondary">
                        Theo dõi hiệu năng thực tế (Latency p95, Error Rate, DB Query), Sentry Error Tracking & Grafana Dashboard
                    </Text>
                </div>
                <Space wrap>
                    {import.meta.env.VITE_MONITORING_ENABLED === "true" && (
                        <Button
                            type="default"
                            icon={<ExternalLink size={16} />}
                            href={import.meta.env.VITE_GRAFANA_URL}
                            target="_blank"
                            style={{
                                borderColor: "#f97316",
                                color: "#f97316",
                                fontWeight: "600"
                            }}
                        >
                            Mở Grafana Dashboard
                        </Button>
                    )}
                    <Button 
                        type="primary"
                        icon={<Bell size={16} />}
                        loading={testingAlert}
                        onClick={handleTriggerTestAlert}
                        style={{ background: "#dc2626", borderColor: "#dc2626", fontWeight: "600" }}
                    >
                        Thử Gửi Cảnh Báo Slack / Email
                    </Button>
                </Space>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 16, color: "#64748b" }}>Đang đồng bộ dữ liệu giám sát hệ thống...</p>
                </div>
            ) : (
                <>
                    {/* Top KPI Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13, fontWeight: "600" }}>ĐỘ TRỄ P95 (LATENCY)</Text>
                                        <Title level={3} style={{ margin: "4px 0 0 0", color: "#1e40af" }}>
                                            {data?.latencyP95Ms || 0} <span style={{ fontSize: 16 }}>ms</span>
                                        </Title>
                                    </div>
                                    <div style={{ background: "#3b82f6", padding: 12, borderRadius: 12, color: "#fff" }}>
                                        <Clock size={24} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                    <Tag color={data?.latencyP95Ms > 2000 ? "error" : "success"}>
                                        {data?.latencyP95Ms > 2000 ? "Nguy hiểm (>2s)" : "Tốt (<2s)"}
                                    </Tag>
                                    <Text style={{ fontSize: 12, color: "#64748b" }}>Ngưỡng cảnh báo: 2000 ms</Text>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13, fontWeight: "600" }}>TỶ LỆ LỖI (ERROR RATE)</Text>
                                        <Title level={3} style={{ margin: "4px 0 0 0", color: "#991b1b" }}>
                                            0.00 <span style={{ fontSize: 16 }}>%</span>
                                        </Title>
                                    </div>
                                    <div style={{ background: "#ef4444", padding: 12, borderRadius: 12, color: "#fff" }}>
                                        <Flame size={24} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                    <Tag color="success">An toàn (&lt; 1%)</Tag>
                                    <Text style={{ fontSize: 12, color: "#64748b" }}>Ngưỡng cảnh báo: &gt; 1.0%</Text>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13, fontWeight: "600" }}>JVM HEAP MEMORY</Text>
                                        <Title level={3} style={{ margin: "4px 0 0 0", color: "#166534" }}>
                                            {data?.heapUsedMb || 0} <span style={{ fontSize: 16 }}>/ {data?.heapMaxMb || 1024} MB</span>
                                        </Title>
                                    </div>
                                    <div style={{ background: "#22c55e", padding: 12, borderRadius: 12, color: "#fff" }}>
                                        <Cpu size={24} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <Progress percent={data?.heapUsagePercent || 0} size="small" strokeColor="#22c55e" />
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13, fontWeight: "600" }}>UPTIME HỆ THỐNG</Text>
                                        <Title level={3} style={{ margin: "4px 0 0 0", color: "#6b21a8" }}>
                                            {data?.uptime || "00h 00m"}
                                        </Title>
                                    </div>
                                    <div style={{ background: "#a855f7", padding: 12, borderRadius: 12, color: "#fff" }}>
                                        <Server size={24} />
                                    </div>
                                </div>
                                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                    <Tag color="purple">Spring Boot 3.5 (Java 21)</Tag>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    {/* Alert Rules & Infrastructure Status */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Card title={<Space><ShieldAlert color="#ef4444" size={20} /> Quy Tắc Cảnh Báo Tự Động (Active Alert Rules)</Space>} style={{ borderRadius: 16, height: "100%" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", background: "#f8fafc", borderRadius: 12 }}>
                                        <CheckCircle2 color="#22c55e" size={20} style={{ marginTop: 2 }} />
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ fontSize: 14 }}>Rule 1: Request Latency &gt; 2.0s</Text>
                                            <Paragraph style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
                                                Tự động kích hoạt khi độ trễ phản hồi p95 của bất kỳ API nào vượt quá 2000ms. Gửi cảnh báo định dạng Card tới <b>Slack Webhook</b> và gửi email khẩn cho Admin.
                                            </Paragraph>
                                        </div>
                                        <Tag color="red">Latency Alert</Tag>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", background: "#f8fafc", borderRadius: 12 }}>
                                        <CheckCircle2 color="#22c55e" size={20} style={{ marginTop: 2 }} />
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ fontSize: 14 }}>Rule 2: HTTP 5xx Error Rate &gt; 1.0%</Text>
                                            <Paragraph style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
                                                Theo dõi tỷ lệ lỗi máy chủ trong cửa sổ trượt 1 phút. Nếu vượt quá 1% trên tổng số request, lập tức phát cảnh báo nguy cơ cao.
                                            </Paragraph>
                                        </div>
                                        <Tag color="volcano">Error Rate Alert</Tag>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px", background: "#f8fafc", borderRadius: 12 }}>
                                        <CheckCircle2 color="#22c55e" size={20} style={{ marginTop: 2 }} />
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ fontSize: 14 }}>Rule 3: Database Pool Congestion (Pending &gt; 5)</Text>
                                            <Paragraph style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>
                                                Giám sát kết nối PostgreSQL qua HikariCP. Cảnh báo khi có trên 5 luồng phải chờ cấp phát kết nối DB quá 30 giây.
                                            </Paragraph>
                                        </div>
                                        <Tag color="orange">Database Alert</Tag>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card title={<Space><Activity color="#3b82f6" size={20} /> Trạng Thái Dịch Vụ Giám Sát</Space>} style={{ borderRadius: 16, height: "100%" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Space>
                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }}></div>
                                            <Text strong>Sentry SDK (Frontend + Backend)</Text>
                                        </Space>
                                        <Tag color="success">ĐANG KÍCH HOẠT</Tag>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Space>
                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }}></div>
                                            <Text strong>Prometheus Actuator Metrics</Text>
                                        </Space>
                                        <Tag color="processing">PORT 9090 (/actuator)</Tag>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Space>
                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }}></div>
                                            <Text strong>Grafana Server</Text>
                                        </Space>
                                        <Tag color="warning">PORT 3000</Tag>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Space>
                                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }}></div>
                                            <Text strong>React Custom Error Boundary</Text>
                                        </Space>
                                        <Tag color="cyan">ĐÃ BỌC ROOT APP</Tag>
                                    </div>

                                    <Divider style={{ margin: "8px 0" }} />

                                    <div style={{ background: "#f1f5f9", padding: "12px", borderRadius: "12px" }}>
                                        <Text strong style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>
                                            🧪 Công Cụ Kiểm Thử Trực Tiếp (Testing Tools)
                                        </Text>
                                        <Space wrap>
                                            <Button 
                                                size="small" 
                                                danger 
                                                icon={<Bug size={14} />} 
                                                onClick={() => setSimulateCrash(true)}
                                            >
                                                Thử Crash React (Error Boundary)
                                            </Button>
                                            <Button 
                                                size="small" 
                                                loading={testingSentry} 
                                                onClick={handleTriggerSentry}
                                            >
                                                Thử Sentry BE Event
                                            </Button>
                                        </Space>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default SystemMonitoringPage;
