import { useEffect, useState } from "react";
import { scheduleApi } from "../api/scheduleApi";
import { getBookingColor } from "../utils/getBookingColor";

export const useSchedule = () => {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [b, r] = await Promise.all([
      scheduleApi.getBookings(),
      scheduleApi.getResources(),
    ]);

    setResources(r);

    // map FullCalendar event format
    setBookings(
      b.map((item) => ({
        id: item.id,
        title: `${item.title} - ${item.customerName}`,
        start: item.start,
        end: item.end,
        resourceId: item.resourceId,
        backgroundColor: getBookingColor(item.status),
        extendedProps: item,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    bookings,
    resources,
    loading,
    reload: loadData,
  };
};