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
import { CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

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

            const map = L.map("branch-map").setView([initialLat, initialLng], 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

    const handleSearchAddress = async () => {
        const address = form.getFieldValue("address");
        if (!address) {
            message.warning("Vui lòng nhập địa chỉ trước khi tìm kiếm!");
            return;
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                const firstResult = data[0];
                const lat = parseFloat(firstResult.lat);
                const lon = parseFloat(firstResult.lon);

                form.setFieldsValue({
                    latitude: lat,
                    longitude: lon
                });

                if (mapInstance) {
                    const L = window.L;
                    const latlng = L.latLng(lat, lon);
                    mapInstance.setView(latlng, 15);

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
                    message.success("Đã tìm thấy địa chỉ và định vị trên bản đồ!");
                } else {
                    message.success(`Tìm thấy tọa độ: ${lat}, ${lon}. Đã cập nhật vào tab Bản đồ!`);
                }
            } else {
                message.warning("Không tìm thấy tọa độ cho địa chỉ này. Hãy tự ghim thủ công trên bản đồ.");
            }
        } catch (error) {
            console.error("Search address error:", error);
            message.error("Lỗi khi tìm kiếm tọa độ từ địa chỉ.");
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
        const values = await form.validateFields();
        const hoursPayload = hours.map(h => ({
            dayOfWeek: h.dayOfWeek,
            isClosed: h.isClosed,
            openTime: h.isClosed ? null : h.openTime.format("HH:mm:ss"),
            closeTime: h.isClosed ? null : h.closeTime.format("HH:mm:ss")
        }));

        onSubmit({
            ...values,
            hours: hoursPayload
        });
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
            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 10 }}>
                <Tabs.TabPane tab="Thông tin chung" key="general">
                    <Form
                        layout="vertical"
                        form={form}
                        style={{ marginTop: 10 }}
                    >
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

                        <Form.Item style={{ marginBottom: 12 }}>
                            <Button 
                                type="dashed" 
                                onClick={handleSearchAddress}
                                style={{ width: "100%" }}
                            >
                                🔍 Định vị tọa độ tự động từ địa chỉ
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
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Vị trí bản đồ (OSM)" key="location">
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
                                                            latitude: position.lat,
                                                            longitude: position.lng
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
                                                            latitude: position.lat,
                                                            longitude: position.lng
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
                            renderItem={item => (
                                <List.Item style={{ padding: "10px 16px" }}>
                                    <Row style={{ width: "100%", alignItems: "center" }} gutter={12}>
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
        </Modal>
    );
}