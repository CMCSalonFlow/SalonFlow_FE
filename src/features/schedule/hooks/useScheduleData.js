import { useEffect, useMemo, useState } from "react";

import { getBranchUsersApi } from "@/features/branch/api/branchApi";

import { scheduleApi } from "../api/scheduleApi";

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

const buildDateRange = (start, end) => {
  if (!start || !end) return [];

  const dates = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);

  while (cursor < limit) {
    dates.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
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
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [branchUsers, dateKeys] = await Promise.all([
          getBranchUsersApi(branchId).catch(() => []),
          Promise.resolve(buildDateRange(visibleRange.start, visibleRange.end)),
        ]);

        const shiftsByDate = await Promise.all(
          dateKeys.map((date) =>
            scheduleApi.getShiftsByBranchAndDate(branchId, date).catch(() => [])
          )
        );

        const shifts = shiftsByDate.flat();

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

            return {
              id: String(shift.id),
              title: shift.userName || `User ${shift.userId}`,
              start,
              end,
              resourceId,
              backgroundColor: resource?.color || RESOURCE_COLORS[0],
              borderColor: resource?.color || RESOURCE_COLORS[0],
              textColor: "#fff",
              extendedProps: shift,
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
    loading,
    reload: () => setRefreshToken((value) => value + 1),
  };
};
