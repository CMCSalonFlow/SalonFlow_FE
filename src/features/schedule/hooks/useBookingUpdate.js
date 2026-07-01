import { useScheduleData } from "./useScheduleData";

export const useSchedule = useScheduleData;

// Backward-compatible shim for the old booking-edit flow.
// The schedule screen is now read-only against the real shift APIs.
export const useBookingUpdate = () => {
  const updateTime = async () => {
    throw new Error("Schedule updates are not supported by the current shift API.");
  };

  const cancelBooking = async () => {
    throw new Error("Schedule updates are not supported by the current shift API.");
  };

  return {
    updateTime,
    cancelBooking,
    updating: false,
    error: null,
  };
};