import {
    Form,
    Input,
    Modal,
    Switch,
    Tabs,
    TimePicker,
    Space,
    Row,
    Col,
    List,
    Typography,
    Button,
    message,
    Tooltip,
    Grid
} from "antd";
import { useEffect, useState } from "react";
import { CopyOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { geocodeAddressApi } from "../api/branchApi";

const { Text } = Typography;

const DAYS_OF_WEEK = [
    { key: 1, name: "Thứ Hai" },
    { key: 2, name: "Thứ Ba" },
    { key: 3, name: "Thứ Tư" },
    { key: 4, name: "Thứ Năm" },
    { key: 5, name: "Thứ Sáu" },
    { key: 6, name: "Thứ Bảy" },
    { key: 0, name: "Chủ Nhật" }
];

const defaultHours = () =>
    DAYS_OF_WEEK.map(d => ({
        dayOfWeek: d.key,
        dayName: d.name,
        isClosed: false,
        openTime: dayjs("09:00:00", "HH:mm:ss"),
        closeTime: dayjs("21:00:00", "HH:mm:ss")
    }));

export default function BranchModal({
    open,
    onCancel,
    onSubmit,
    editing
}) {
    const screens = Grid.useBreakpoint();
    const [form] = Form.useForm();
    const [hours, setHours] = useState(defaultHours());
    const [activeTab, setActiveTab] = useState("general");

    const [mapInstance, setMapInstance] = useState(null);
    const [markerInstance, setMarkerInstance] = useState(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [searchingAddress, setSearchingAddress] = useState(false);

    // Dynamic loading of Leaflet script and CSS
    useEffect(() => {
        if (!open) return;

        if (window.L) {
            setLeafletLoaded(true);
            return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
            setLeafletLoaded(true);
        };
        document.head.appendChild(script);
    }, [open]);

    // Clean up map instance on close
    useEffect(() => {
        if (!open) {
            if (mapInstance) {
                mapInstance.remove();
                setMapInstance(null);
                setMarkerInstance(null);
            }
        }
    }, [open]);

    // Map initialization when "location" tab is selected
    useEffect(() => {
        if (!open || !leafletLoaded || activeTab !== "location") return;

        const timer = setTimeout(() => {
            const container = document.getElementById("branch-map");
            if (!container) return;

            if (mapInstance) {
                mapInstance.invalidateSize();
                const curLat = form.getFieldValue("latitude");
                const curLng = form.getFieldValue("longitude");
                if (curLat && curLng) {
                    const L = window.L;
                    const latlng = L.latLng(curLat, curLng);
                    mapInstance.setView(latlng, 16);
                    if (markerInstance) {
                        markerInstance.setLatLng(latlng);
                    } else {
                        const marker = L.marker(latlng, { draggable: true }).addTo(mapInstance);
                        marker.on("dragend", () => {
                            const position = marker.getLatLng();
                            form.setFieldsValue({
                                latitude: Number(position.lat.toFixed(7)),
                                longitude: Number(position.lng.toFixed(7))
                            });
                        });
                        setMarkerInstance(marker);
                    }
                }
                return;
            }

            const L = window.L;

            // Override default marker icon paths to fix missing marker asset bug in bundlers
            const DefaultIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            L.Marker.prototype.options.icon = DefaultIcon;

            const formLat = form.getFieldValue("latitude");
            const formLng = form.getFieldValue("longitude");

            // Center on Hanoi by default if coordinates are not set in the form
            const initialLat = formLat || 21.0285;
            const initialLng = formLng || 105.8542;

            const map = L.map("branch-map").setView([initialLat, initialLng], 16);

            L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
                attribution: "Google Maps",
                maxZoom: 20
            }).addTo(map);

            let marker = null;
            if (formLat && formLng) {
                marker = L.marker([formLat, formLng], { draggable: true }).addTo(map);
            }

            // Update form fields on drag
            const handleMarkerDrag = (m) => {
                const position = m.getLatLng();
                form.setFieldsValue({
                    latitude: position.lat,
                    longitude: position.lng
                });
            };

            if (marker) {
                marker.on("dragend", () => handleMarkerDrag(marker));
            }

            // Update marker on click
            map.on("click", (e) => {
                const latlng = e.latlng;
                form.setFieldsValue({
                    latitude: latlng.lat,
                    longitude: latlng.lng
                });

                if (marker) {
                    marker.setLatLng(latlng);
                } else {
                    marker = L.marker(latlng, { draggable: true }).addTo(map);
                    marker.on("dragend", () => handleMarkerDrag(marker));
                    setMarkerInstance(marker);
                }
            });

            setMapInstance(map);
            if (marker) {
                setMarkerInstance(marker);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
        };
    }, [open, leafletLoaded, activeTab]);

    const applyCoordinatesToMap = (lat, lon, successMsg) => {
        form.setFieldsValue({
            latitude: lat,
            longitude: lon
        });

        if (mapInstance && window.L) {
            const L = window.L;
            const latlng = L.latLng(lat, lon);
            mapInstance.setView(latlng, 16);

            if (markerInstance) {
                markerInstance.setLatLng(latlng);
            } else {
                const marker = L.marker(latlng, { draggable: true }).addTo(mapInstance);
                marker.on("dragend", () => {
                    const position = marker.getLatLng();
                    form.setFieldsValue({
                        latitude: position.lat,
                        longitude: position.lng
                    });
                });
                setMarkerInstance(marker);
            }
        }
        if (successMsg) {
            message.success(successMsg);
        }
    };

    const searchPhoton = async (query) => {
        if (!query || !query.trim()) return null;
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=1`);
            const data = await res.json();
            if (data?.features?.length > 0) {
                const [lon, lat] = data.features[0].geometry.coordinates;
                return { found: true, latitude: lat, longitude: lon };
            }
        } catch (e) {
            console.warn("Photon search error:", e);
        }
        return null;
    };

    const handleSearchAddress = async () => {
        const address = form.getFieldValue("address");
        if (!address) {
            message.warning("Vui lòng nhập địa chỉ trước khi tìm kiếm!");
            return;
        }

        try {
            setSearchingAddress(true);

            // 1. Thử qua Backend API trước
            let result = null;
            try {
                result = await geocodeAddressApi(address);
            } catch (err) {
                console.warn("Backend geocode error, falling back to Photon:", err);
            }

            // 2. Nếu Backend chưa tìm thấy, fallback sang Photon (OSM Komoot)
            if (!result || !result.found) {
                result = await searchPhoton(address);
            }

            // 3. Thử bỏ số nhà (ví dụ "74 Phố Lụa..." -> "Phố Lụa...")
            if (!result || !result.found) {
                const withoutNumber = address.replace(/^\d+[A-Za-z]?\s*(\/\s*\d+[A-Za-z]?\s*)*(ngõ|ngách|hẻm)?\s*/i, "").trim();
                if (withoutNumber && withoutNumber !== address) {
                    result = await searchPhoton(withoutNumber);
                }
            }

            // 4. Thử theo các phân đoạn sau dấu phẩy (phường, quận, thành phố)
            if (!result || !result.found) {
                const parts = address.split(",");
                if (parts.length > 2) {
                    const broader = parts.slice(1).join(", ").trim();
                    result = await searchPhoton(broader);
                }
            }

            if (result && result.found) {
                const lat = parseFloat(result.latitude);
                const lon = parseFloat(result.longitude);
                applyCoordinatesToMap(
                    lat,
                    lon,
                    `Đã tìm thấy địa chỉ và định vị trên bản đồ (${lat.toFixed(5)}, ${lon.toFixed(5)})!`
                );
            } else {
                message.warning("Không tìm thấy tọa độ cho địa chỉ này. Hãy thử bấm 'Lấy vị trí hiện tại (GPS)' hoặc ghim thủ công trên tab Bản đồ.");
            }
        } catch (error) {
            console.error("Search address error:", error);
            message.error("Lỗi khi kết nối định vị. Hãy bấm 'Lấy vị trí hiện tại (GPS)' hoặc ghim thủ công trên tab Bản đồ.");
        } finally {
            setSearchingAddress(false);
        }
    };

    useEffect(() => {
        if (open) {
            setActiveTab("general");
            if (editing) {
                form.setFieldsValue({
                    ...editing,
                    isSmsEnabled: editing.isSmsEnabled ?? true,
                    smsTemplate: editing.smsTemplate ?? ""
                });
                if (editing.hours && editing.hours.length > 0) {
                    const mappedHours = DAYS_OF_WEEK.map(day => {
                        const match = editing.hours.find(h => h.dayOfWeek === day.key);
                        return {
                            dayOfWeek: day.key,
                            dayName: day.name,
                            isClosed: match ? match.isClosed : false,
                            openTime: match?.openTime
                                ? dayjs(match.openTime, "HH:mm:ss")
                                : dayjs("09:00:00", "HH:mm:ss"),
                            closeTime: match?.closeTime
                                ? dayjs(match.closeTime, "HH:mm:ss")
                                : dayjs("21:00:00", "HH:mm:ss")
                        };
                    });
                    setHours(mappedHours);
                } else {
                    setHours(defaultHours());
                }
            } else {
                form.resetFields();
                setHours(defaultHours());
            }
        }
    }, [editing, open]);

    const handleHoursChange = (dayKey, field, value) => {
        setHours(prev =>
            prev.map(item =>
                item.dayOfWeek === dayKey ? { ...item, [field]: value } : item
            )
        );
    };

    const handleApplyDayToRemaining = (sourceDay) => {
        if (!sourceDay) return;
        setHours(prev =>
            prev.map(item =>
                item.dayOfWeek === sourceDay.dayOfWeek
                    ? item
                    : {
                        ...item,
                        isClosed: sourceDay.isClosed,
                        openTime: sourceDay.openTime,
                        closeTime: sourceDay.closeTime
                    }
            )
        );
        message.success(`Đã áp dụng khung giờ của ${sourceDay.dayName} cho tất cả các ngày còn lại!`);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const hoursPayload = hours.map(h => ({
                dayOfWeek: h.dayOfWeek,
                isClosed: h.isClosed,
                openTime: h.isClosed ? null : h.openTime.format("HH:mm:ss"),
                closeTime: h.isClosed ? null : h.closeTime.format("HH:mm:ss")
            }));

            const lat = values.latitude != null && values.latitude !== "" ? parseFloat(values.latitude) : null;
            const lng = values.longitude != null && values.longitude !== "" ? parseFloat(values.longitude) : null;

            onSubmit({
                ...values,
                latitude: lat,
                longitude: lng,
                hours: hoursPayload
            });
        } catch (errorInfo) {
            console.error("Form validation failed:", errorInfo);
            if (errorInfo?.errorFields?.length > 0) {
                const firstErrorFieldName = errorInfo.errorFields[0].name[0];
                if (["name", "phone", "email", "address"].includes(firstErrorFieldName)) {
                    setActiveTab("general");
                } else if (["latitude", "longitude"].includes(firstErrorFieldName)) {
                    setActiveTab("location");
                }
            }
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            title={editing ? "Cập nhật chi nhánh" : "Thêm chi nhánh"}
            destroyOnClose
            width={screens.xs ? "95%" : 650}
        >
            <Form
                layout="vertical"
                form={form}
                style={{ marginTop: 10 }}
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} destroyInactiveTabPane={false} style={{ marginTop: 10 }}>
                    <Tabs.TabPane tab="Thông tin chung" key="general">
                        <Form.Item
                            label="Tên chi nhánh"
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập tên chi nhánh"
                                }
                            ]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="phone"
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                {
                                    type: "email",
                                    message: "Email không hợp lệ"
                                }
                            ]}
                        >
                            <Input size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Địa chỉ"
                            name="address"
                            rules={[
                                {
                                    required: true,
                                    message: "Vui lòng nhập địa chỉ"
                                }
                            ]}
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Ví dụ: 123 Đường Trần Hưng Đạo, Quận 1, TP. HCM"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 16 }}>
                            <Button 
                                type="dashed" 
                                icon={<EnvironmentOutlined />}
                                onClick={handleSearchAddress}
                                loading={searchingAddress}
                                style={{ width: "100%", borderRadius: 8, height: 38, fontWeight: 500 }}
                            >
                                Định vị từ địa chỉ
                            </Button>
                        </Form.Item>

                        {editing && (
                            <Form.Item
                                label="Trạng thái hoạt động"
                                name="isActive"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Hoạt động" unCheckedChildren="Đóng cửa" />
                            </Form.Item>
                        )}
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Vị trí bản đồ" key="location">
                        <div style={{ marginTop: 15 }}>
                            <Row gutter={16} style={{ marginBottom: 12 }}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Vĩ độ (Latitude)"
                                        name="latitude"
                                    >
                                        <Input 
                                            type="number" 
                                            step="any"
                                            placeholder="Tự động điền hoặc ghim bản đồ" 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && mapInstance) {
                                                    const L = window.L;
                                                    const latlng = L.latLng(val, form.getFieldValue("longitude") || 105.8542);
                                                    if (markerInstance) {
                                                        markerInstance.setLatLng(latlng);
                                                    } else {
                                                        const marker = L.marker(latlng, { draggable: true }).addTo(mapInstance);
                                                        marker.on("dragend", () => {
                                                            const position = marker.getLatLng();
                                                            form.setFieldsValue({
                                                                latitude: Number(position.lat.toFixed(7)),
                                                                longitude: Number(position.lng.toFixed(7))
                                                            });
                                                        });
                                                        setMarkerInstance(marker);
                                                    }
                                                    mapInstance.panTo(latlng);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Kinh độ (Longitude)"
                                        name="longitude"
                                    >
                                        <Input 
                                            type="number" 
                                            step="any"
                                            placeholder="Tự động điền hoặc ghim bản đồ" 
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val) && mapInstance) {
                                                    const L = window.L;
                                                    const latlng = L.latLng(form.getFieldValue("latitude") || 21.0285, val);
                                                    if (markerInstance) {
                                                        markerInstance.setLatLng(latlng);
                                                    } else {
                                                        const marker = L.marker(latlng, { draggable: true }).addTo(mapInstance);
                                                        marker.on("dragend", () => {
                                                            const position = marker.getLatLng();
                                                            form.setFieldsValue({
                                                                latitude: Number(position.lat.toFixed(7)),
                                                                longitude: Number(position.lng.toFixed(7))
                                                            });
                                                        });
                                                        setMarkerInstance(marker);
                                                    }
                                                    mapInstance.panTo(latlng);
                                                }
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
                                * Bạn có thể kéo thả ghim đỏ hoặc click chuột trên bản đồ dưới đây để chọn tọa độ chính xác.
                            </Text>
                            <div 
                                id="branch-map" 
                                style={{ 
                                    height: "350px", 
                                    width: "100%", 
                                    borderRadius: "8px", 
                                    border: "1px solid #d9d9d9", 
                                    position: "relative" 
                                }} 
                            />
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Giờ hoạt động" key="hours">
                        <div style={{ marginTop: 15 }}>
                            <List
                                size="small"
                                bordered
                                dataSource={hours}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: "10px 16px" }}>
                                        <Row style={{ width: "100%", alignItems: "center" }}>
                                            <Col span={5}>
                                                <Text strong>{item.dayName}</Text>
                                            </Col>
                                            <Col span={4}>
                                                <Switch
                                                    checked={!item.isClosed}
                                                    onChange={(checked) => handleHoursChange(item.dayOfWeek, "isClosed", !checked)}
                                                    checkedChildren="Mở"
                                                    unCheckedChildren="Nghỉ"
                                                />
                                            </Col>
                                            <Col span={15}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    {!item.isClosed ? (
                                                        <Space size={6}>
                                                            <TimePicker
                                                                value={item.openTime}
                                                                format="HH:mm"
                                                                onChange={(time) => handleHoursChange(item.dayOfWeek, "openTime", time)}
                                                                allowClear={false}
                                                                size="small"
                                                                placeholder="Giờ mở"
                                                            />
                                                            <Text>-</Text>
                                                            <TimePicker
                                                                value={item.closeTime}
                                                                format="HH:mm"
                                                                onChange={(time) => handleHoursChange(item.dayOfWeek, "closeTime", time)}
                                                                allowClear={false}
                                                                size="small"
                                                                placeholder="Giờ đóng"
                                                            />
                                                        </Space>
                                                    ) : (
                                                        <Text type="secondary" style={{ fontSize: 13 }}>Nghỉ cả ngày</Text>
                                                    )}

                                                    <Tooltip title={`Áp dụng khung giờ của ${item.dayName} cho tất cả các ngày còn lại`}>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<CopyOutlined style={{ color: "#1890ff" }} />}
                                                            onClick={() => handleApplyDayToRemaining(item)}
                                                            style={{ fontSize: 12, color: "#1890ff", padding: "0 6px" }}
                                                        >
                                                            Áp dụng cho ngày khác
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </Col>
                                        </Row>
                                    </List.Item>
                                )}
                            />
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </Form>
        </Modal>
    );
}