import React, { useState } from "react";
import {
    Row,
    Col,
    Typography,
    Card,
    Input,
    Radio,
    Button,
    Space,
    Tag,
    Spin,
    Empty,
    Segmented,
    Tooltip,
    Alert
} from "antd";
import {
    CompassOutlined,
    EnvironmentOutlined,
    SearchOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    GlobalOutlined,
    UnorderedListOutlined,
    StarFilled,
    CheckCircleOutlined
} from "@ant-design/icons";
import useNearbySalons from "../hooks/useNearbySalons";
import GoogleMapView from "../components/GoogleMapView";
import NearbySalonCard from "../components/NearbySalonCard";

const { Title, Text, Paragraph } = Typography;

export default function NearbySalonsPage() {
    const {
        userLocation,
        isLocating,
        locationError,
        radius,
        setRadius,
        salons,
        totalCount,
        loading,
        selectedSalon,
        setSelectedSalon,
        hoveredSalon,
        setHoveredSalon,
        searchQuery,
        setSearchQuery,
        minRating,
        setMinRating,
        getCurrentLocation,
        refetch
    } = useNearbySalons();

    // Chế độ xem: 'split' (chia đôi), 'map' (chỉ bản đồ), 'list' (chỉ danh sách)
    const [viewMode, setViewMode] = useState("split");

    const radiusOptions = [
        { label: "1 km", value: 1000 },
        { label: "3 km", value: 3000 },
        { label: "5 km", value: 5000 },
        { label: "10 km", value: 10000 },
        { label: "20 km", value: 20000 },
        { label: "50 km", value: 50000 }
    ];

    return (
        <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "calc(100vh - 70px)" }}>
            {/* Header Title Section */}
            <div style={{ marginBottom: 20 }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col>
                        <Space align="center" size={14}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                                    color: "#fff",
                                    fontSize: 24
                                }}
                            >
                                <CompassOutlined />
                            </div>
                            <div>
                                <Title level={3} style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
                                    Tìm Salon Gần Nhất
                                </Title>
                                <Text style={{ color: "#64748b", fontSize: 14 }}>
                                    Khám phá các salon làm đẹp uy tín xung quanh bạn với bản đồ định vị thông minh
                                </Text>
                            </div>
                        </Space>
                    </Col>

                    {/* GPS Status & Re-center */}
                    <Col>
                        <Space wrap size={10}>
                            {userLocation && (
                                <Tag
                                    color="processing"
                                    icon={<CheckCircleOutlined />}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: 20,
                                        fontSize: 13,
                                        fontWeight: 600
                                    }}
                                >
                                    Vị trí: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                                </Tag>
                            )}

                            <Button
                                icon={<ReloadOutlined spin={isLocating} />}
                                loading={isLocating}
                                onClick={() => getCurrentLocation(true)}
                                style={{
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    borderColor: "#0284c7",
                                    color: "#0284c7"
                                }}
                            >
                                {isLocating ? "Đang định vị..." : "Lấy vị trí của tôi"}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>

            {/* Error banner if location fails */}
            {locationError && (
                <Alert
                    message="Thông báo vị trí"
                    description={locationError}
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 20, borderRadius: 12 }}
                />
            )}

            {/* Controls Filter Card */}
            <Card
                style={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    marginBottom: 24,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                }}
                bodyStyle={{ padding: "16px 20px" }}
            >
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    {/* Left: Search & Radius */}
                    <Col xs={24} lg={16}>
                        <Space wrap size={16} align="center">
                            {/* Search Input */}
                            <Input
                                placeholder="Tìm theo tên salon, chi nhánh, địa chỉ..."
                                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                allowClear
                                style={{ width: 280, borderRadius: 10 }}
                                size="middle"
                            />

                            {/* Radius Selector */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Text strong style={{ fontSize: 13, color: "#475569" }}>
                                    Bán kính:
                                </Text>
                                <Radio.Group
                                    options={radiusOptions}
                                    onChange={(e) => setRadius(e.target.value)}
                                    value={radius}
                                    optionType="button"
                                    buttonStyle="solid"
                                    size="middle"
                                />
                            </div>

                            {/* Rating Filter */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Text strong style={{ fontSize: 13, color: "#475569" }}>
                                    Đánh giá:
                                </Text>
                                <Radio.Group
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                    optionType="button"
                                    buttonStyle="solid"
                                    size="middle"
                                >
                                    <Radio.Button value={0}>Tất cả</Radio.Button>
                                    <Radio.Button value={4.0}>4.0 ⭐+</Radio.Button>
                                    <Radio.Button value={4.5}>4.5 ⭐+</Radio.Button>
                                </Radio.Group>
                            </div>
                        </Space>
                    </Col>

                    {/* Right: View Mode Toggle */}
                    <Col xs={24} lg={8} style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Segmented
                            value={viewMode}
                            onChange={setViewMode}
                            size="middle"
                            options={[
                                {
                                    label: "Chia đôi",
                                    value: "split",
                                    icon: <AppstoreOutlined />
                                },
                                {
                                    label: "Bản đồ",
                                    value: "map",
                                    icon: <GlobalOutlined />
                                },
                                {
                                    label: "Danh sách",
                                    value: "list",
                                    icon: <UnorderedListOutlined />
                                }
                            ]}
                            style={{ padding: 3, borderRadius: 10, background: "#f1f5f9" }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Results Status Header */}
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                    <EnvironmentOutlined style={{ color: "#0284c7", fontSize: 16 }} />
                    <Text strong style={{ fontSize: 15, color: "#1e293b" }}>
                        Tìm thấy <span style={{ color: "#0284c7" }}>{salons.length}</span> salon trong bán kính{" "}
                        <span style={{ color: "#0284c7" }}>{radius / 1000} km</span>
                    </Text>
                </Space>

                {loading && (
                    <Space>
                        <Spin size="small" />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Đang tính toán khoảng cách PostGIS...
                        </Text>
                    </Space>
                )}
            </div>

            {/* Main Display Area */}
            {viewMode === "split" && (
                <Row gutter={[20, 20]}>
                    {/* Left: Salon List */}
                    <Col xs={24} lg={10} xl={9}>
                        <div
                            style={{
                                maxHeight: "calc(100vh - 270px)",
                                overflowY: "auto",
                                paddingRight: 6
                            }}
                        >
                            {loading ? (
                                <div style={{ textAlign: "center", padding: "60px 0" }}>
                                    <Spin size="large" />
                                    <div style={{ marginTop: 12, color: "#64748b" }}>
                                        Đang tìm salon gần bạn nhất...
                                    </div>
                                </div>
                            ) : salons.length === 0 ? (
                                <Card style={{ borderRadius: 16, textAlign: "center", padding: "30px 0" }}>
                                    <Empty
                                        description={
                                            <span>
                                                Không tìm thấy salon nào trong bán kính {radius / 1000}km.
                                                <br />
                                                Hãy thử tăng bán kính tìm kiếm hoặc điều chỉnh bộ lọc.
                                            </span>
                                        }
                                    >
                                        <Button
                                            type="primary"
                                            onClick={() => setRadius(radius >= 20000 ? 50000 : radius * 2)}
                                        >
                                            Mở rộng bán kính
                                        </Button>
                                    </Empty>
                                </Card>
                            ) : (
                                salons.map((salon) => (
                                    <NearbySalonCard
                                        key={salon.branchId}
                                        salon={salon}
                                        isSelected={selectedSalon?.branchId === salon.branchId}
                                        onSelect={(s) => setSelectedSalon(s)}
                                        onHover={(s) => setHoveredSalon(s)}
                                    />
                                ))
                            )}
                        </div>
                    </Col>

                    {/* Right: Sticky Google Map */}
                    <Col xs={24} lg={14} xl={15}>
                        <div style={{ position: "sticky", top: 20 }}>
                            <GoogleMapView
                                userLocation={userLocation}
                                salons={salons}
                                selectedSalon={selectedSalon || hoveredSalon}
                                onSelectSalon={(s) => setSelectedSalon(s)}
                                radius={radius}
                                height="calc(100vh - 270px)"
                            />
                        </div>
                    </Col>
                </Row>
            )}

            {viewMode === "map" && (
                <div style={{ width: "100%" }}>
                    <GoogleMapView
                        userLocation={userLocation}
                        salons={salons}
                        selectedSalon={selectedSalon || hoveredSalon}
                        onSelectSalon={(s) => setSelectedSalon(s)}
                        radius={radius}
                        height="calc(100vh - 260px)"
                    />
                </div>
            )}

            {viewMode === "list" && (
                <div>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "80px 0" }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 12, color: "#64748b" }}>
                                Đang tính khoảng cách chính xác...
                            </div>
                        </div>
                    ) : salons.length === 0 ? (
                        <Card style={{ borderRadius: 16, textAlign: "center", padding: "50px 0" }}>
                            <Empty
                                description={`Không tìm thấy salon nào trong bán kính ${radius / 1000} km`}
                            />
                        </Card>
                    ) : (
                        <Row gutter={[16, 16]}>
                            {salons.map((salon) => (
                                <Col xs={24} md={12} lg={8} key={salon.branchId}>
                                    <NearbySalonCard
                                        salon={salon}
                                        isSelected={selectedSalon?.branchId === salon.branchId}
                                        onSelect={(s) => setSelectedSalon(s)}
                                        onHover={(s) => setHoveredSalon(s)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            )}
        </div>
    );
}
