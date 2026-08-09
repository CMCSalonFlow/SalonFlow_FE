import { Row, Col, Card, Tag, Typography, Radio } from "antd";

const { Text } = Typography;

export default function StepServiceSelection({
    bookingType,
    setBookingType,
    services = [],
    selectedServices = [],
    setSelectedServices,
    bundles = [],
    selectedBundle,
    setSelectedBundle
}) {
    // Thêm hoặc bớt dịch vụ khi click chọn
    const toggleService = (service) => {
        const isSelected = selectedServices.some(s => s.id === service.id);
        if (isSelected) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <label style={{ fontWeight: 600 }}>Chọn dịch vụ muốn đặt</label>
                <Radio.Group value={bookingType} onChange={(e) => setBookingType(e.target.value)}>
                    <Radio.Button value="service">Dịch vụ lẻ</Radio.Button>
                    <Radio.Button value="bundle">Gói Combo</Radio.Button>
                </Radio.Group>
            </div>

            {/* HIỂN THỊ DỊCH VỤ LẺ */}
            {bookingType === "service" && (
                <Row gutter={[16, 16]}>
                    {services.map(s => {
                        const isSelected = selectedServices.some(item => item.id === s.id);
                        return (
                            <Col xs={24} sm={12} key={s.id}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 12,
                                        border: isSelected ? "2px solid #1890ff" : "1px solid #f0f0f0",
                                        backgroundColor: isSelected ? "#e6f7ff" : "#fff"
                                    }}
                                    onClick={() => toggleService(s)}
                                >
                                    <Text strong style={{ fontSize: 16 }}>{s.name}</Text>
                                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <Tag color="blue">{s.durationMinutes} phút</Tag>
                                        <Text strong style={{ color: "#faad14" }}>
                                            {parseFloat(s.price).toLocaleString()} đ
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                    {services.length === 0 && <Col span={24} style={{ textAlign: "center", padding: 40 }}><Text type="secondary">Chi nhánh chưa có dịch vụ nào.</Text></Col>}
                </Row>
            )}

            {/* HIỂN THỊ COMBO */}
            {bookingType === "bundle" && (
                <Row gutter={[16, 16]}>
                    {bundles.map(b => {
                        const isSelected = selectedBundle?.id === b.id;
                        return (
                            <Col xs={24} key={b.id}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 12,
                                        border: isSelected ? "2px solid #52c41a" : "1px solid #f0f0f0",
                                        backgroundColor: isSelected ? "#f6ffed" : "#fff"
                                    }}
                                    onClick={() => setSelectedBundle(b)}
                                >
                                    <Row justify="space-between" align="middle">
                                        <Col xs={24} sm={16}>
                                            <Text strong style={{ fontSize: 17 }}>{b.name}</Text>
                                            <div style={{ marginTop: 8 }}>
                                                {b.items?.map(item => (
                                                    <Tag color="cyan" key={item.serviceId}>{item.name}</Tag>
                                                ))}
                                            </div>
                                        </Col>
                                        <Col xs={24} sm={8} style={{ textAlign: "right" }}>
                                            <Text delete style={{ color: "#bfbfbf", marginRight: 8 }}>{parseFloat(b.originalPrice).toLocaleString()} đ</Text>
                                            <br />
                                            <Text strong style={{ color: "#52c41a", fontSize: 18 }}>{parseFloat(b.price).toLocaleString()} đ</Text>
                                            <br />
                                            <Tag color="blue">{b.totalDurationMinutes} phút</Tag>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        );
                    })}
                    {bundles.length === 0 && <Col span={24} style={{ textAlign: "center", padding: 40 }}><Text type="secondary">Chi nhánh chưa có combo nào.</Text></Col>}
                </Row>
            )}
        </div>
    );
}
