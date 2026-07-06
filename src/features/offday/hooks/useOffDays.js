import { useState, useEffect, useCallback } from "react";
import offdayApi from "../api/offdayApi";

export const useOffDays = (staffId) => {
    const [offDays, setOffDays] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOffDays = useCallback(async () => {
        if (!staffId) {
            setOffDays([]);
            return;
        }

        setLoading(true);

        try {
            const data = await offdayApi.getOffDaysByStaff(staffId);

            setOffDays(data);
        } catch (err) {
            console.error("Lỗi lấy danh sách ngày nghỉ:", err);
            setOffDays([]);
        } finally {
            setLoading(false);
        }
    }, [staffId]);

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