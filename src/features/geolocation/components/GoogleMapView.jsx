import React, { useEffect, useRef, useState } from "react";
import { Spin, Alert, Button, Space, Typography } from "antd";
import { EnvironmentOutlined, CompassOutlined, ReloadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

const { Text } = Typography;

export default function GoogleMapView({
    userLocation,
    salons = [],
    selectedSalon,
    onSelectSalon,
    radius = 5000,
    height = "100%",
    className = ""
}) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const userMarkerRef = useRef(null);
    const circleRef = useRef(null);
    const infoWindowRef = useRef(null);

    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const navigate = useNavigate();

    // Khởi tạo Google Maps SDK
    useEffect(() => {
        let isMounted = true;
        setMapError(null);

        loadGoogleMaps()
            .then((googleMaps) => {
                if (!isMounted || !mapContainerRef.current) return;

                const centerLat = userLocation?.lat || 10.776889;
                const centerLng = userLocation?.lng || 106.700806;

                const map = new googleMaps.Map(mapContainerRef.current, {
                    center: { lat: centerLat, lng: centerLng },
                    zoom: 14,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    streetViewControl: false,
                    zoomControl: true,
                    styles: [
                        {
                            featureType: "poi.business",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "transit",
                            elementType: "labels.icon",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                });

                mapInstanceRef.current = map;
                infoWindowRef.current = new googleMaps.InfoWindow({
                    maxWidth: 320
                });

                setMapLoaded(true);
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Lỗi Google Maps:", err);
                    setMapError(err?.message || "Không thể tải Google Maps");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // Cập nhật Marker vị trí người dùng và Vòng tròn Bán kính
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !window.google || !userLocation) return;

        const google = window.google;
        const map = mapInstanceRef.current;
        const pos = { lat: userLocation.lat, lng: userLocation.lng };

        // Xóa marker người dùng cũ
        if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
        }

        // Tạo Marker vị trí người dùng (chấm xanh pulsing)
        userMarkerRef.current = new google.maps.Marker({
            position: pos,
            map: map,
            title: "Vị trí hiện tại của bạn",
            zIndex: 999,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3
            }
        });

        // Cập nhật vòng tròn bán kính tìm kiếm
        if (circleRef.current) {
            circleRef.current.setMap(null);
        }

        if (radius > 0) {
            circleRef.current = new google.maps.Circle({
                map: map,
                center: pos,
                radius: radius,
                fillColor: "#3b82f6",
                fillOpacity: 0.08,
                strokeColor: "#3b82f6",
                strokeOpacity: 0.35,
                strokeWeight: 1.5
            });
        }
    }, [mapLoaded, userLocation, radius]);

    // Cập nhật Markers các Salon gần nhất
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !window.google) return;

        const google = window.google;
        const map = mapInstanceRef.current;
        const infoWindow = infoWindowRef.current;

        // Xóa tất cả markers cũ
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const bounds = new google.maps.LatLngBounds();
        if (userLocation) {
            bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
        }

        salons.forEach((salon, index) => {
            if (salon.latitude == null || salon.longitude == null) return;

            const salonPos = { lat: salon.latitude, lng: salon.longitude };
            bounds.extend(new google.maps.LatLng(salonPos.lat, salonPos.lng));

            const isSelected = selectedSalon?.branchId === salon.branchId;

            // Marker SVG Icon
            const marker = new google.maps.Marker({
                position: salonPos,
                map: map,
                title: `${salon.salonName} - ${salon.branchName}`,
                zIndex: isSelected ? 900 : 100 + index,
                animation: isSelected ? google.maps.Animation.BOUNCE : null,
                icon: {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
                            <defs>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
                                </filter>
                            </defs>
                            <path d="M19 0C8.5 0 0 8.5 0 19c0 14.5 19 29 19 29s19-14.5 19-29C38 8.5 29.5 0 19 0z" 
                                  fill="${isSelected ? "#4f46e5" : "#0284c7"}" 
                                  filter="url(#shadow)"/>
                            <circle cx="19" cy="18" r="13" fill="#ffffff"/>
                            <text x="19" y="23" font-size="13" font-family="Arial, sans-serif" font-weight="bold" fill="${isSelected ? "#4f46e5" : "#0284c7"}" text-anchor="middle">
                                ${index + 1}
                            </text>
                        </svg>
                    `)}`,
                    scaledSize: new google.maps.Size(38, 48),
                    anchor: new google.maps.Point(19, 48)
                }
            });

            // Format khoảng cách
            const distanceText =
                salon.distanceKm != null
                    ? `${salon.distanceKm} km`
                    : salon.distanceMeters != null
                    ? `${Math.round(salon.distanceMeters)} m`
                    : "";

            // Nội dung InfoWindow
            const infoContent = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; max-width: 290px; color: #1e293b;">
                    <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px;">
                        ${
                            salon.logoUrl
                                ? `<img src="${salon.logoUrl}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; flex-shrink: 0;" alt="${salon.salonName}" />`
                                : `<div style="width: 48px; height: 48px; border-radius: 8px; background: linear-gradient(135deg, #0284c7, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 18px; flex-shrink: 0;">${salon.salonName?.charAt(0) || "S"}</div>`
                        }
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 700; font-size: 15px; color: #0f172a; line-height: 1.2; margin-bottom: 2px;">
                                ${salon.salonName}
                            </div>
                            <div style="font-size: 13px; color: #64748b; font-weight: 500;">
                                ${salon.branchName}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                        ${
                            distanceText
                                ? `<span style="background: #e0f2fe; color: #0284c7; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center;">📍 Cách bạn ${distanceText}</span>`
                                : ""
                        }
                        ${
                            salon.ratingAverage > 0
                                ? `<span style="background: #fef3c7; color: #b45309; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">⭐ ${Number(salon.ratingAverage).toFixed(1)} (${salon.ratingCount || 0})</span>`
                                : `<span style="background: #f1f5f9; color: #64748b; font-size: 11px; padding: 2px 6px; border-radius: 6px;">Mới</span>`
                        }
                    </div>

                    <div style="font-size: 12px; color: #475569; margin-bottom: 10px; line-height: 1.4;">
                        ${salon.address || "Chưa có địa chỉ chi tiết"}
                    </div>

                    <div style="display: flex; gap: 6px;">
                        <a href="/booking?branchId=${salon.branchId}" id="btn-book-${salon.branchId}" style="flex: 1; text-align: center; background: #0284c7; color: #ffffff; text-decoration: none; padding: 7px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; display: inline-block;">
                            Đặt lịch ngay
                        </a>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}" target="_blank" rel="noopener noreferrer" style="padding: 7px 10px; background: #f1f5f9; color: #334155; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block;">
                            Chỉ đường
                        </a>
                    </div>
                </div>
            `;

            // Click vào marker
            marker.addListener("click", () => {
                if (onSelectSalon) {
                    onSelectSalon(salon);
                }
                infoWindow.setContent(infoContent);
                infoWindow.open(map, marker);
            });

            markersRef.current.push(marker);
        });

        // Fit khung hình bản đồ để hiển thị đầy đủ
        if (salons.length > 0) {
            map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
        }
    }, [mapLoaded, salons, userLocation, selectedSalon, onSelectSalon]);

    // Khi salon được chọn từ bên ngoài (List view click)
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !selectedSalon) return;

        const map = mapInstanceRef.current;
        if (selectedSalon.latitude != null && selectedSalon.longitude != null) {
            map.panTo({ lat: selectedSalon.latitude, lng: selectedSalon.longitude });
            map.setZoom(16);

            const targetMarker = markersRef.current.find(
                (m) => m.getTitle() && m.getTitle().includes(selectedSalon.branchName)
            );
            if (targetMarker && window.google) {
                targetMarker.setAnimation(window.google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    if (targetMarker) targetMarker.setAnimation(null);
                }, 1500);
            }
        }
    }, [selectedSalon, mapLoaded]);

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: height,
                minHeight: "380px",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                border: "1px solid #e2e8f0"
            }}
            className={className}
        >
            {/* Vùng chứa bản đồ */}
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "380px" }} />

            {/* Trạng thái đang tải */}
            {!mapLoaded && !mapError && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        zIndex: 10
                    }}
                >
                    <Spin size="large" />
                    <Text style={{ color: "#64748b", fontWeight: 500 }}>Đang nạp bản đồ Google Maps...</Text>
                </div>
            )}

            {/* Thông báo lỗi khi tải Google Maps */}
            {mapError && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255, 255, 255, 0.95)",
                        padding: 24,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 20
                    }}
                >
                    <Alert
                        message="Thông báo Google Maps"
                        description={
                            <div>
                                <p style={{ margin: "4px 0" }}>{mapError}</p>
                                <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                                    💡 Bạn có thể cấu hình khóa <code>VITE_GOOGLE_MAPS_API_KEY</code> trong file{" "}
                                    <code>.env</code> để kích hoạt đầy đủ tính năng bản đồ trực tiếp.
                                </p>
                            </div>
                        }
                        type="warning"
                        showIcon
                        style={{ maxWidth: 460, borderRadius: 12 }}
                    />
                </div>
            )}

            {/* Floating Quick Legend */}
            {mapLoaded && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 16,
                        left: 16,
                        background: "rgba(255, 255, 255, 0.92)",
                        backdropFilter: "blur(6px)",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        zIndex: 5
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#2563eb",
                                display: "inline-block"
                            }}
                        />
                        <span style={{ fontWeight: 500, color: "#334155" }}>Vị trí của bạn</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: "#0284c7",
                                display: "inline-block"
                            }}
                        />
                        <span style={{ fontWeight: 500, color: "#334155" }}>Salon ({salons.length})</span>
                    </div>
                </div>
            )}
        </div>
    );
}
