import { useState, useEffect, useCallback, useMemo } from "react";
import { message } from "antd";
import { getNearbySalonsApi } from "../api/geolocationApi";

// Tọa độ mặc định (Trung tâm Quận 1, TP. Hồ Chí Minh)
export const DEFAULT_COORDINATES = {
    lat: 10.776889,
    lng: 106.700806,
    name: "TP. Hồ Chí Minh"
};

export default function useNearbySalons() {
    const [userLocation, setUserLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [radius, setRadius] = useState(5000); // 5000 meters = 5km
    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [hoveredSalon, setHoveredSalon] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [minRating, setMinRating] = useState(0);

    // Lấy vị trí GPS của người dùng qua HTML5 Geolocation API
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

    // Tự động định vị khi khởi tạo
    useEffect(() => {
        getCurrentLocation(false);
    }, [getCurrentLocation]);

    // Gọi API tìm salon gần nhất
    const fetchNearbySalons = useCallback(async () => {
        if (!userLocation || userLocation.lat == null || userLocation.lng == null) {
            return;
        }

        setLoading(true);
        try {
            const data = await getNearbySalonsApi({
                lat: userLocation.lat,
                lng: userLocation.lng,
                radius,
                limit: 50
            });
            setSalons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tìm salon gần đây:", error);
            message.error(error?.response?.data?.message || "Không thể tải danh sách salon gần bạn.");
            setSalons([]);
        } finally {
            setLoading(false);
        }
    }, [userLocation, radius]);

    useEffect(() => {
        fetchNearbySalons();
    }, [fetchNearbySalons]);

    // Lọc theo từ khóa tìm kiếm & rating
    const filteredSalons = useMemo(() => {
        return salons.filter((s) => {
            const matchesQuery =
                !searchQuery.trim() ||
                s.salonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.branchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.address?.toLowerCase().includes(searchQuery.toLowerCase());

            const rating = Number(s.ratingAverage || 0);
            const matchesRating = rating >= minRating;

            return matchesQuery && matchesRating;
        });
    }, [salons, searchQuery, minRating]);

    return {
        userLocation,
        isLocating,
        locationError,
        radius,
        setRadius,
        salons: filteredSalons,
        totalCount: salons.length,
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
        refetch: fetchNearbySalons
    };
}
