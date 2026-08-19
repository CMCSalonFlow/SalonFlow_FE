import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Row,
    Col,
    Typography,
    Card,
    Input,
    InputNumber,
    Radio,
    Button,
    Space,
    Tag,
    Spin,
    Empty,
    Segmented,
    Alert,
    Divider,
    message
} from "antd";
import {
    CompassOutlined,
    EnvironmentOutlined,
    SearchOutlined,
    ReloadOutlined,
    AppstoreOutlined,
    GlobalOutlined,
    UnorderedListOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import useBranchSearch from "../hooks/useBranchSearch";
import GoogleMapView from "@/features/geolocation/components/GoogleMapView";
import SearchResultCard from "../components/SearchResultCard";

const { Title, Text } = Typography;

const DEFAULT_COORDINATES = {
    lat: 10.776889,
    lng: 106.700806,
    name: "TP. Hồ Chí Minh"
};

export default function SearchPage() {
    const {
        branches,
        loading,
        search,
        loadMore,
        hasNext
    } = useBranchSearch();

    // View mode: 'split' (split view), 'map' (map only), 'list' (list only)
    const [viewMode, setViewMode] = useState("split");

    // Search and filter input states
    const [keywordInput, setKeywordInput] = useState("");
    const [priceMinInput, setPriceMinInput] = useState(null);
    const [priceMaxInput, setPriceMaxInput] = useState(null);
    const [ratingMin, setRatingMin] = useState(0);

    // Active search parameters (to avoid reactive triggering while typing)
    const [activeKeyword, setActiveKeyword] = useState("");
    const [activePriceMin, setActivePriceMin] = useState(null);
    const [activePriceMax, setActivePriceMax] = useState(null);

    // Geolocation / GPS states
    const [useGps, setUseGps] = useState(true);
    const [radius, setRadius] = useState(5000); // 5km in meters
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);

    // Selected/Hovered card highlighting on Map
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [hoveredSalon, setHoveredSalon] = useState(null);

    // Get GPS Location
    const getCurrentLocation = useCallback((showFeedback = true) => {
        if (!navigator.geolocation) {
            const err = "Trình duyệt của bạn không hỗ trợ định vị Geolocation.";
            setLocationError(err);
            if (showFeedback) message.warning(err);
            setUserLocation(DEFAULT_COORDINATES);
            return;
        }

        setIsLocating(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                setUserLocation(coords);
                setIsLocating(false);
                if (showFeedback) {
                    message.success("Đã xác định vị trí của bạn thành công!");
                }
            },
            (error) => {
                setIsLocating(false);
                let errorMsg = "Không thể lấy vị trí hiện tại.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "Quyền truy cập vị trí bị từ chối. Sử dụng vị trí mặc định TP.HCM.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "Thông tin vị trí không khả dụng. Sử dụng vị trí mặc định TP.HCM.";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "Yêu cầu lấy vị trí quá thời gian chờ.";
                        break;
                    default:
                        break;
                }
                setLocationError(errorMsg);
                if (showFeedback) {
                    message.info(errorMsg);
                }
                setUserLocation(DEFAULT_COORDINATES);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }, []);

    // Locate GPS on initialization
    useEffect(() => {
        getCurrentLocation(false);
    }, [getCurrentLocation]);

    // Perform query request to backend
    const triggerBackendSearch = useCallback(() => {
        const params = {
            q: activeKeyword || undefined,
            price_min: activePriceMin || undefined,
            price_max: activePriceMax || undefined,
            rating_min: ratingMin || undefined
        };

        if (useGps && userLocation) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
        }

        search(params);
    }, [activeKeyword, activePriceMin, activePriceMax, ratingMin, useGps, userLocation, search]);

    // Refetch search when active parameters change
    useEffect(() => {
        triggerBackendSearch();
    }, [triggerBackendSearch]);

    // Handle form submit / filter click
    const handleSearchSubmit = () => {
        setActiveKeyword(keywordInput);
        setActivePriceMin(priceMinInput);
        setActivePriceMax(priceMaxInput);
    };

    // Filter results locally based on selected radius (when GPS is active)
    const filteredBranches = useMemo(() => {
        return branches.filter((item) => {
            if (!useGps || !radius) return true;
            if (item.distance == null) return true; // keep if backend didn't compute distance
            return item.distance * 1000 <= radius; // distance is in km, radius is in meters
        });
    }, [branches, useGps, radius]);

    // Map Elasticsearch branch items to format expected by GoogleMapView
    const mapItemsToMap = useMemo(() => {
        return filteredBranches.map((item, index) => ({
            ...item,
            ratingAverage: item.rating || 0,
            distanceKm: item.distance != null ? Number(item.distance.toFixed(1)) : null
        }));
    }, [filteredBranches]);

    // Load more data for pagination
    const handleLoadMore = () => {
        const params = {
            q: activeKeyword || undefined,
            price_min: activePriceMin || undefined,
            price_max: activePriceMax || undefined,
            rating_min: ratingMin || undefined
        };

        if (useGps && userLocation) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
        }

        loadMore(params);
    };

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
                                    Tìm Kiếm & Khám Phá Salon
                                </Title>
                                <Text style={{ color: "#64748b", fontSize: 14 }}>
                                    Tìm kiếm dịch vụ làm đẹp và định vị các chi nhánh salon gần bạn nhất
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    {useGps && userLocation && (
                        <Col>
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
                        </Col>
                    )}
                </Row>
            </div>

            {/* Geolocation error message if GPS fails */}
            {useGps && locationError && (
                <Alert
                    message="Thông báo vị trí"
                    description={locationError}
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 20, borderRadius: 12 }}
                />
            )}

            {/* Search and Filters Card */}
            <Card
                style={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    marginBottom: 24,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                }}
                bodyStyle={{ padding: "16px 20px" }}
            >
                <Row gutter={[16, 16]} align="middle">
                    {/* Keyword search input */}
                    <Col xs={24} md={10}>
                        <Space.Compact style={{ width: "100%" }}>
                            <Input
                                placeholder="Tìm theo tên salon, chi nhánh, dịch vụ..."
                                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onPressEnter={handleSearchSubmit}
                                size="middle"
                                style={{ borderRadius: "10px 0 0 10px" }}
                                allowClear
                            />
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearchSubmit}
                                style={{ borderRadius: "0 10px 10px 0" }}
                            >
                                Tìm
                            </Button>
                        </Space.Compact>
                    </Col>

                    {/* Price Range inputs */}
                    <Col xs={24} sm={12} md={6}>
                        <Space style={{ width: "100%" }}>
                            <InputNumber
                                placeholder="Giá từ"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                value={priceMinInput}
                                onChange={setPriceMinInput}
                                style={{ width: "100%", borderRadius: 10 }}
                            />
                            <Text style={{ color: "#94a3b8" }}>-</Text>
                            <InputNumber
                                placeholder="Giá đến"
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                value={priceMaxInput}
                                onChange={setPriceMaxInput}
                                style={{ width: "100%", borderRadius: 10 }}
                            />
                        </Space>
                    </Col>

                    {/* Min Rating Radio Button */}
                    <Col xs={24} sm={12} md={5}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Text strong style={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>
                                Đánh giá:
                            </Text>
                            <Radio.Group
                                value={ratingMin}
                                onChange={(e) => setRatingMin(e.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                                size="middle"
                            >
                                <Radio.Button value={0}>Tất cả</Radio.Button>
                                <Radio.Button value={4.0}>4.0 ⭐+</Radio.Button>
                                <Radio.Button value={4.5}>4.5 ⭐+</Radio.Button>
                            </Radio.Group>
                        </div>
                    </Col>

                    {/* Apply Filters Trigger */}
                    <Col xs={24} md={3}>
                        <Button
                            type="default"
                            onClick={handleSearchSubmit}
                            style={{
                                width: "100%",
                                borderRadius: 10,
                                fontWeight: 600,
                                borderColor: "#0284c7",
                                color: "#0284c7"
                            }}
                        >
                            Áp dụng bộ lọc
                        </Button>
                    </Col>
                </Row>

                <Divider style={{ margin: "16px 0" }} />

                {/* Sub row: GPS and Map View Mode toggles */}
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} lg={16}>
                        <Space wrap size={16} align="center">
                            {/* Toggle GPS mode vs Global search */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Text strong style={{ fontSize: 13, color: "#475569" }}>
                                    Phạm vi:
                                </Text>
                                <Segmented
                                    value={useGps ? "gps" : "all"}
                                    onChange={(value) => setUseGps(value === "gps")}
                                    options={[
                                        { label: "Gần tôi 📍", value: "gps" },
                                        { label: "Toàn quốc 🌐", value: "all" }
                                    ]}
                                    style={{ borderRadius: 10, background: "#f1f5f9" }}
                                />
                            </div>

                            {useGps && (
                                <>
                                    {/* Radius Options */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Text strong style={{ fontSize: 13, color: "#475569" }}>
                                            Bán kính:
                                        </Text>
                                        <Radio.Group
                                            options={[
                                                { label: "1 km", value: 1000 },
                                                { label: "3 km", value: 3000 },
                                                { label: "5 km", value: 5000 },
                                                { label: "10 km", value: 10000 },
                                                { label: "20 km", value: 20000 }
                                            ]}
                                            onChange={(e) => setRadius(e.target.value)}
                                            value={radius}
                                            optionType="button"
                                            buttonStyle="solid"
                                            size="middle"
                                        />
                                    </div>

                                    {/* Geolocation trigger */}
                                    <Button
                                        icon={<ReloadOutlined spin={isLocating} />}
                                        loading={isLocating}
                                        onClick={() => getCurrentLocation(true)}
                                        size="middle"
                                        style={{
                                            borderRadius: 10,
                                            fontWeight: 600,
                                            borderColor: "#0284c7",
                                            color: "#0284c7"
                                        }}
                                    >
                                        {isLocating ? "Đang định vị..." : "Lấy vị trí của tôi"}
                                    </Button>
                                </>
                            )}
                        </Space>
                    </Col>

                    {/* View Modes (Split / Map / List) */}
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

            {/* Results Title Count Header */}
            <div style={{ marginBottom: 16, display: "flex", justify: "space-between", alignItems: "center" }}>
                <Space>
                    <EnvironmentOutlined style={{ color: "#0284c7", fontSize: 16 }} />
                    <Text strong style={{ fontSize: 15, color: "#1e293b" }}>
                        Tìm thấy <span style={{ color: "#0284c7" }}>{filteredBranches.length}</span> salon
                        {useGps && ` trong bán kính ${radius / 1000} km`}
                    </Text>
                </Space>

                {loading && (
                    <Space>
                        <Spin size="small" />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Đang tìm kiếm salon...
                        </Text>
                    </Space>
                )}
            </div>

            {/* Main Content Layout based on viewMode */}
            {viewMode === "split" && (
                <Row gutter={[20, 20]}>
                    {/* Left side: List of Results */}
                    <Col xs={24} lg={10} xl={9}>
                        <div
                            style={{
                                maxHeight: "calc(100vh - 270px)",
                                overflowY: "auto",
                                paddingRight: 6
                            }}
                        >
                            {loading && branches.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 0" }}>
                                    <Spin size="large" />
                                    <div style={{ marginTop: 12, color: "#64748b" }}>
                                        Đang tìm salon phù hợp...
                                    </div>
                                </div>
                            ) : filteredBranches.length === 0 ? (
                                <Card style={{ borderRadius: 16, textAlign: "center", padding: "30px 0" }}>
                                    <Empty
                                        description={
                                            <span>
                                                Không tìm thấy salon nào phù hợp.
                                                <br />
                                                {useGps && "Thử tăng bán kính hoặc tắt chế độ Gần tôi để tìm trên toàn quốc."}
                                            </span>
                                        }
                                    >
                                        {useGps && (
                                            <Button
                                                type="primary"
                                                onClick={() => setRadius(radius >= 10000 ? 20000 : radius * 2)}
                                            >
                                                Mở rộng bán kính
                                            </Button>
                                        )}
                                    </Empty>
                                </Card>
                            ) : (
                                <>
                                    {filteredBranches.map((item) => (
                                        <SearchResultCard
                                            key={item.branchId}
                                            item={item}
                                            isSelected={selectedSalon?.branchId === item.branchId}
                                            onSelect={(s) => setSelectedSalon(s)}
                                            onHover={(s) => setHoveredSalon(s)}
                                        />
                                    ))}
                                    {hasNext && (
                                        <Button
                                            block
                                            onClick={handleLoadMore}
                                            loading={loading}
                                            style={{ borderRadius: 10, marginBottom: 16 }}
                                        >
                                            Xem thêm kết quả
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </Col>

                    {/* Right side: Google Map View */}
                    <Col xs={24} lg={14} xl={15}>
                        <div style={{ position: "sticky", top: 20 }}>
                            <GoogleMapView
                                userLocation={useGps ? userLocation : (userLocation || DEFAULT_COORDINATES)}
                                salons={mapItemsToMap}
                                selectedSalon={selectedSalon || hoveredSalon}
                                onSelectSalon={(s) => setSelectedSalon(s)}
                                radius={useGps ? radius : 0}
                                height="calc(100vh - 270px)"
                            />
                        </div>
                    </Col>
                </Row>
            )}

            {viewMode === "map" && (
                <div style={{ width: "100%" }}>
                    <GoogleMapView
                        userLocation={useGps ? userLocation : (userLocation || DEFAULT_COORDINATES)}
                        salons={mapItemsToMap}
                        selectedSalon={selectedSalon || hoveredSalon}
                        onSelectSalon={(s) => setSelectedSalon(s)}
                        radius={useGps ? radius : 0}
                        height="calc(100vh - 260px)"
                    />
                </div>
            )}

            {viewMode === "list" && (
                <div>
                    {loading && branches.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0" }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 12, color: "#64748b" }}>
                                Đang tải kết quả...
                            </div>
                        </div>
                    ) : filteredBranches.length === 0 ? (
                        <Card style={{ borderRadius: 16, textAlign: "center", padding: "50px 0" }}>
                            <Empty description="Không tìm thấy salon nào phù hợp" />
                        </Card>
                    ) : (
                        <>
                            <Row gutter={[16, 16]}>
                                {filteredBranches.map((item) => (
                                    <Col xs={24} md={12} lg={8} key={item.branchId}>
                                        <SearchResultCard
                                            item={item}
                                            isSelected={selectedSalon?.branchId === item.branchId}
                                            onSelect={(s) => setSelectedSalon(s)}
                                            onHover={(s) => setHoveredSalon(s)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                            {hasNext && (
                                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                                    <Button
                                        onClick={handleLoadMore}
                                        loading={loading}
                                        style={{ borderRadius: 10, width: 200 }}
                                    >
                                        Xem thêm kết quả
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}