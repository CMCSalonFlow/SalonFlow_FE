import { useState, useEffect, useCallback } from "react";
import offdayApi from "../api/offdayApi";

export const useOffDays = () => {
    const [offDays, setOffDays] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOffDays = useCallback(async () => {
        setLoading(true);
        try {
            const data = await offdayApi.getSystemOffDays();
            setOffDays(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi lấy danh sách ngày nghỉ hệ thống:", err);
            setOffDays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOffDays();
    }, [fetchOffDays]);

    return {
        offDays,
        loading,
        reload: fetchOffDays,
    };
};

export default useOffDays;