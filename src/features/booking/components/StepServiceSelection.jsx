import { useMemo } from "react";
import { Row, Col, Card, Tag, Typography, Radio, Space, Grid } from "antd";
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    CheckCircleFilled,
    GiftOutlined,
    ScissorOutlined
} from "@ant-design/icons";

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
    const screens = Grid.useBreakpoint();
    // Group services by categoryName & Sort categories strictly by DB Order (categoryId / displayOrder)
    const { groupedServices, categories } = useMemo(() => {
        const groups = {};
        const catMeta = {};

        (services || []).forEach(s => {
            const catName = s.categoryName || s.category?.name || "Dịch vụ khác";
            if (!groups[catName]) {
                groups[catName] = [];
                catMeta[catName] = {
                    categoryId: s.categoryId || s.category?.id || 999999,
                    categoryOrder: s.categoryDisplayOrder ?? s.categoryOrder ?? s.category?.displayOrder ?? 999999
                };
            }
            groups[catName].push(s);
        });

        // Sort items inside each category by displayOrder or id
        Object.keys(groups).forEach(cat => {
            groups[cat].sort((a, b) => (a.displayOrder ?? a.id) - (b.displayOrder ?? b.id));
        });

        // Sort categories strictly by DB categoryOrder -> categoryId
        const sortedCats = Object.keys(groups).sort((a, b) => {
            const metaA = catMeta[a];
            const metaB = catMeta[b];

            const orderA = metaA?.categoryOrder !== 999999 ? metaA.categoryOrder : metaA.categoryId;
            const orderB = metaB?.categoryOrder !== 999999 ? metaB.categoryOrder : metaB.categoryId;

            if (orderA !== orderB) return orderA - orderB;
            return a.localeCompare(b, "vi");
        });

        return {
            groupedServices: groups,
            categories: sortedCats
        };
    }, [services]);

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
            {/* Header Controls */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    marginBottom: 16,
                    padding: screens.xs ? "10px 12px" : "12px 16px",
                    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScissorOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                    <label style={{ fontWeight: 700, fontSize: screens.xs ? 14 : 15, color: "#1e293b" }}>
                        Danh sách dịch vụ salon
                    </label>
                </div>
                <Radio.Group
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    size={screens.xs ? "small" : "middle"}
                >
                    <Radio.Button value="service" style={{ borderRadius: "8px 0 0 8px", fontWeight: 600 }}>
                        <ScissorOutlined style={{ marginRight: 6 }} /> Dịch vụ lẻ
                    </Radio.Button>
                    <Radio.Button value="bundle" style={{ borderRadius: "0 8px 8px 0", fontWeight: 600 }}>
                        <GiftOutlined style={{ marginRight: 6 }} /> Gói Combo
                    </Radio.Button>
                </Radio.Group>
            </div>

            {/* HIỂN THỊ DỊCH VỤ LẺ (Sắp xếp theo thứ tự Danh Mục) */}
            {bookingType === "service" && (
                <>
                    {categories.map(catName => (
                        <div key={catName} style={{ marginBottom: 24 }}>
                            {/* Category Header Banner */}
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#003a8c",
                                    marginBottom: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px 12px",
                                    background: "linear-gradient(90deg, #e6f7ff 0%, #f8fafc 100%)",
                                    borderRadius: "8px 0 0 8px",
                                    borderLeft: "4px solid #1890ff"
                                }}
                            >
                                <Space>
                                    <AppstoreOutlined style={{ color: "#1890ff" }} />
                                    <span>{catName.toUpperCase()}</span>
                                </Space>
                                <Tag color="blue" style={{ borderRadius: 10, margin: 0 }}>
                                    {groupedServices[catName]?.length || 0} dịch vụ
                                </Tag>
                            </div>

                            {/* Service Card Grid */}
                            <Row gutter={screens.xs ? [12, 12] : [16, 16]}>
                                {groupedServices[catName]?.map(s => {
                                    const isSelected = selectedServices.some(item => item.id === s.id);
                                    return (
                                        <Col xs={24} sm={12} key={s.id}>
                                            <Card
                                                hoverable
                                                style={{
                                                    borderRadius: 14,
                                                    position: "relative",
                                                    border: isSelected ? "2px solid #1890ff" : "1px solid #cbd5e1",
                                                    background: isSelected
                                                        ? "linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)"
                                                        : "#ffffff",
                                                    boxShadow: isSelected
                                                        ? "0 6px 18px rgba(24, 144, 255, 0.22)"
                                                        : "0 4px 12px rgba(0, 0, 0, 0.06)",
                                                    transition: "all 0.25s ease"
                                                }}
                                                bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}
                                                onClick={() => toggleService(s)}
                                            >
                                                {/* Active Checkmark Icon */}
                                                {isSelected && (
                                                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                                                        <CheckCircleFilled style={{ color: "#1890ff", fontSize: 20 }} />
                                                    </div>
                                                )}

                                                <div style={{ paddingRight: isSelected ? 24 : 0 }}>
                                                    <Text strong style={{ fontSize: 15, color: isSelected ? "#002c8c" : "#1e293b", display: "block" }}>
                                                        {s.name}
                                                    </Text>
                                                </div>

                                                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <Tag
                                                        icon={<ClockCircleOutlined />}
                                                        color={isSelected ? "blue" : "default"}
                                                        style={{ borderRadius: 12, padding: "2px 8px", fontSize: 12 }}
                                                    >
                                                        {s.durationMinutes || s.duration || 30} phút
                                                    </Tag>
                                                    <Text bold style={{ color: isSelected ? "#d46b08" : "#fa8c16", fontSize: 16 }}>
                                                        {parseFloat(s.price || 0).toLocaleString("vi-VN")} đ
                                                    </Text>
                                                </div>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    ))}

                    {services.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                            <ScissorOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                            <div>Chi nhánh chưa có dịch vụ nào.</div>
                        </div>
                    )}
                </>
            )}

            {/* HIỂN THỊ COMBO */}
            {bookingType === "bundle" && (
                <Row gutter={[16, 16]}>
                    {bundles.map(b => {
                        const isSelected = selectedBundle?.id === b.id;
                        const originalPrice = b.originalPrice ? parseFloat(b.originalPrice) : 0;
                        const price = parseFloat(b.price || 0);

                        return (
                            <Col xs={24} key={b.id}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 14,
                                        position: "relative",
                                        border: isSelected ? "2px solid #1890ff" : "1px solid #cbd5e1",
                                        background: isSelected
                                            ? "linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)"
                                            : "#ffffff",
                                        boxShadow: isSelected
                                            ? "0 6px 18px rgba(24, 144, 255, 0.22)"
                                            : "0 4px 12px rgba(0, 0, 0, 0.06)",
                                        transition: "all 0.25s ease"
                                    }}
                                    bodyStyle={{ padding: "18px 20px" }}
                                    onClick={() => setSelectedBundle(isSelected ? null : b)}
                                >
                                    {isSelected && (
                                        <div style={{ position: "absolute", top: 14, right: 14 }}>
                                            <CheckCircleFilled style={{ color: "#1890ff", fontSize: 22 }} />
                                        </div>
                                    )}

                                    {/* Line 1: Full-width Title on 1 single line */}
                                    <div style={{ paddingRight: isSelected ? 32 : 0, marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 16, color: isSelected ? "#002c8c" : "#1e293b", display: "block" }}>
                                            {b.name}
                                        </Text>
                                    </div>

                                    {/* Line 2: Included Service Items & Pricing */}
                                    <Row justify="space-between" align="middle" gutter={[16, 8]}>
                                        <Col xs={24} sm={16} md={17}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                {b.items?.map(item => (
                                                    <div
                                                        key={item.serviceId || item.id}
                                                        style={{
                                                            background: isSelected ? "rgba(255,255,255,0.9)" : "#e6f7ff",
                                                            color: "#1890ff",
                                                            border: "1px solid #91caff",
                                                            borderRadius: 12,
                                                            padding: "4px 10px",
                                                            fontSize: 13,
                                                            fontWeight: 500,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 4
                                                        }}
                                                    >
                                                        <ScissorOutlined style={{ color: "#1890ff" }} />
                                                        <span>{item.name || item.serviceName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Col>

                                        <Col xs={24} sm={8} md={7} style={{ textAlign: "right" }}>
                                            {originalPrice > price && (
                                                <Text delete style={{ color: "#94a3b8", marginRight: 8, fontSize: 13 }}>
                                                    {originalPrice.toLocaleString("vi-VN")} đ
                                                </Text>
                                            )}
                                            <Text bold style={{ color: isSelected ? "#d46b08" : "#fa8c16", fontSize: 20, fontWeight: 800, marginRight: 8 }}>
                                                {price.toLocaleString("vi-VN")} đ
                                            </Text>
                                            <Tag icon={<ClockCircleOutlined />} color={isSelected ? "blue" : "default"} style={{ borderRadius: 12, fontWeight: 600, padding: "2px 8px", fontSize: 12 }}>
                                                {b.totalDurationMinutes || 0} phút
                                            </Tag>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        );
                    })}
                    {bundles.length === 0 && (
                        <Col span={24} style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
                            <GiftOutlined style={{ fontSize: 36, marginBottom: 8, color: "#cbd5e1" }} />
                            <div style={{ fontSize: 15 }}>Chi nhánh chưa có gói combo nào.</div>
                        </Col>
                    )}
                </Row>
            )}
        </div>
    );
}
