import { useEffect, useMemo, useState } from "react";
import { getBranchUsersApi } from "@/features/branch/api/branchApi";
import { scheduleApi } from "../api/scheduleApi";
import offdayApi from "@/features/offday/api/offdayApi";

const RESOURCE_COLORS = [
  "#1a73e8",
  "#34a853",
  "#f29900",
  "#c5221f",
  "#8e24aa",
  "#00897b",
  "#5e35b1",
  "#d81b60",
];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShiftDateTime = (shiftDate, time) => {
  if (!shiftDate || !time) return null;
  return `${shiftDate}T${time}`;
};

const normalizeLabel = (user) =>
  user?.fullName || user?.name || user?.username || `User ${user?.id ?? ""}`;

export const useScheduleData = (branchId, visibleRange) => {
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [systemOffDays, setSystemOffDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  const rangeKey = useMemo(() => {
    if (!visibleRange?.start || !visibleRange?.end) return "";
    return `${visibleRange.start.toISOString()}_${visibleRange.end.toISOString()}`;
  }, [visibleRange]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!branchId || !visibleRange?.start || !visibleRange?.end) {
        setEvents([]);
        setResources([]);
        setSystemOffDays([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const startKey = toDateKey(visibleRange.start);
        const endKey = toDateKey(visibleRange.end);

        const [branchUsers, shifts, offDaysData, staffLeavesData] = await Promise.all([
          getBranchUsersApi(branchId).catch(() => []),
          scheduleApi.getShiftsByBranchAndRange(branchId, startKey, endKey).catch(() => []),
          offdayApi.getOffDaysForBranchRange(branchId, startKey, endKey).catch(() => []),
          offdayApi.getApprovedLeaves({ branchId, startDate: startKey, endDate: endKey }).catch(() => [])
        ]);

        const offDays = Array.isArray(offDaysData) ? offDaysData : [];
        const staffLeaves = Array.isArray(staffLeavesData) ? staffLeavesData : [];
        if (active) {
          setSystemOffDays(offDays);
        }

        const resourcesFromUsers = (branchUsers || []).map((user, index) => ({
          id: String(user.id),
          title: normalizeLabel(user),
          color: RESOURCE_COLORS[index % RESOURCE_COLORS.length],
        }));

        const resourceMap = new Map(
          resourcesFromUsers.map((resource) => [String(resource.id), resource])
        );

        if (resourcesFromUsers.length === 0) {
          const derived = [];
          const seen = new Set();

          shifts.forEach((shift, index) => {
            const key = String(shift.userId);
            if (seen.has(key)) return;
            seen.add(key);
            derived.push({
              id: key,
              title: shift.userName || `User ${shift.userId}`,
              color: RESOURCE_COLORS[index % RESOURCE_COLORS.length],
            });
          });

          derived.forEach((resource) => {
            resourceMap.set(String(resource.id), resource);
          });

          if (active) {
            setResources(derived);
          }
        } else if (active) {
          setResources(resourcesFromUsers);
        }

        const mappedEvents = shifts
          .map((shift) => {
            const resourceId = String(shift.userId);
            const resource = resourceMap.get(resourceId);
            const start = formatShiftDateTime(shift.shiftDate, shift.startTime);
            const end = formatShiftDateTime(shift.shiftDate, shift.endTime);

            if (!start || !end) return null;

            // Check if shift falls on a system holiday
            const holiday = offDays.find(
              (off) => shift.shiftDate >= off.dateFrom && shift.shiftDate <= off.dateTo
            );

            // Check if shift falls on an approved staff leave request
            const staffLeave = staffLeaves.find((leave) => {
              const sameStaff =
                (shift.staffId && String(leave.staffId) === String(shift.staffId)) ||
                (shift.userId && leave.staffUserId && String(leave.staffUserId) === String(shift.userId)) ||
                (leave.staffName && shift.userName && leave.staffName.trim().toLowerCase() === shift.userName.trim().toLowerCase());
              const withinDate = shift.shiftDate >= leave.dateFrom && shift.shiftDate <= leave.dateTo;
              return sameStaff && withinDate;
            });

            let bgColor = resource?.color || RESOURCE_COLORS[0];
            let titleText = shift.userName || `User ${shift.userId}`;

            if (holiday) {
              bgColor = "#ff4d4f";
              titleText = `NGHỈ LỄ: ${holiday.title} (${shift.userName || resource?.title})`;
            } else if (staffLeave) {
              bgColor = "#fa8c16";
              titleText = `NGHỈ PHÉP: ${shift.userName || resource?.title}`;
            }

            return {
              id: String(shift.id),
              title: titleText,
              start,
              end,
              resourceId,
              backgroundColor: bgColor,
              borderColor: holiday ? "#d9363e" : (staffLeave ? "#d46b08" : bgColor),
              textColor: "#fff",
              extendedProps: {
                ...shift,
                isHoliday: !!holiday,
                isStaffLeave: !!staffLeave,
                holidayTitle: holiday?.title || (staffLeave ? "Nghỉ phép cá nhân" : null)
              },
            };
          })
          .filter(Boolean)
          .sort((a, b) => new Date(a.start) - new Date(b.start));

        if (active) {
          setEvents(mappedEvents);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [branchId, rangeKey, refreshToken]);

  return {
    events,
    resources,
    systemOffDays,
    loading,
    reload: () => setRefreshToken((value) => value + 1),
  };
};

export default useScheduleData;
