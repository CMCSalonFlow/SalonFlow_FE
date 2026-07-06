import { useState, useCallback } from "react";
import { previewRecurringBookingApi, confirmRecurringBookingApi } from "./recurringBookingApi";

/**
 * Custom hook cho recurring booking.
 * branchId vẫn nhận vào để build payload, nhưng KHÔNG dùng trong URL nữa.
 *
 * @param {number|string} branchId
 */
export function useRecurringBooking(branchId) {
    const [previewing, setPreviewing] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [error, setError] = useState(null);

    /**
     * Gọi preview API.
     * @param {object} formValues - giá trị từ form (staffId, serviceId, startDate, endDate, startTime, endTime, pattern)
     */
    const preview = useCallback(async (formValues) => {
        setError(null);
        setPreviewing(true);
        try {
            // Build payload đúng theo RecurringBookingRequest của BE
            const payload = {
                branchId:  branchId,
                staffId:   formValues.staffId,
                serviceId: formValues.serviceId,
                pattern:   formValues.pattern,
                startDate: formValues.startDate,   // "YYYY-MM-DD"
                endDate:   formValues.endDate,      // "YYYY-MM-DD"
                startTime: formValues.startTime,    // "HH:mm"
                endTime:   formValues.endTime,      // "HH:mm" (tính từ duration dịch vụ)
            };
            const data = await previewRecurringBookingApi(payload);
            setPreviewData(data);
            return data;
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Preview thất bại";
            setError(msg);
            return null;
        } finally {
            setPreviewing(false);
        }
    }, [branchId]);

    /**
     * Gọi confirm API.
     * @param {object} formValues  - giá trị từ form
     * @param {object} resolutions - { [date]: "INCLUDE" | "SKIP" }
     * @param {Array}  occurrences - danh sách occurrences từ previewData
     */
    const confirm = useCallback(async (formValues, resolutions, occurrences) => {
        setError(null);
        setConfirming(true);
        try {
            // Build payload đúng theo RecurringBookingConfirmRequest của BE:
            // { pattern: RecurringBookingRequest, occurrences: OccurrenceDecision[] }
            const payload = {
                pattern: {
                    branchId:  branchId,
                    staffId:   formValues.staffId,
                    serviceId: formValues.serviceId,
                    pattern:   formValues.pattern,
                    startDate: formValues.startDate,
                    endDate:   formValues.endDate,
                    startTime: formValues.startTime,
                    endTime:   formValues.endTime,
                },
                occurrences: occurrences.map((occ) => ({
                    date:   occ.date,           // "YYYY-MM-DD"
                    action: resolutions[occ.date] || "INCLUDE",  // "INCLUDE" hoặc "SKIP"
                })),
            };
            const data = await confirmRecurringBookingApi(payload);
            return data;
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || "Đặt lịch thất bại";
            setError(msg);
            return null;
        } finally {
            setConfirming(false);
        }
    }, [branchId]);

    const reset = useCallback(() => {
        setPreviewData(null);
        setError(null);
    }, []);

    return { previewing, confirming, previewData, error, preview, confirm, reset };
}

// ─── Helper functions ────────────────────────────────────────────────────────

/**
 * Tạo map resolution mặc định từ previewData.
 * - Ngày conflict → "SKIP" (mặc định bỏ qua)
 * - Ngày bình thường → "INCLUDE"
 */
export function buildDefaultResolutions(previewData) {
    const resolutions = {};
    (previewData?.occurrences || []).forEach((occ) => {
        resolutions[occ.date] = occ.hasConflict ? "SKIP" : "INCLUDE";
    });
    return resolutions;
}

/**
 * Tính stats từ previewData + resolutions.
 */
export function computeStats(previewData, resolutions) {
    if (!previewData) return null;
    const total     = previewData.occurrences?.length || 0;
    // BE trả về conflictCount trực tiếp
    const conflicts = previewData.conflictCount || 0;
    const skipped   = Object.values(resolutions).filter((v) => v === "SKIP").length;
    return { total, conflicts, skipped, confirmed: total - skipped };
}

/**
 * Trả về mảng ISO month strings "YYYY-MM" từ occurrences (tối đa maxMonths).
 */
export function getCalendarMonths(occurrences = [], maxMonths = 6) {
    if (!occurrences.length) return [];
    // BE trả về date là LocalDate → JSON thành "YYYY-MM-DD" string
    const monthSet = new Set(occurrences.map((o) => String(o.date).slice(0, 7)));
    return Array.from(monthSet).sort().slice(0, maxMonths);
}