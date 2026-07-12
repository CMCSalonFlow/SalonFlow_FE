import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { message } from "antd";

import "../schedule.css";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";

import { useScheduleData } from "../hooks/useScheduleData";

import ScheduleSidebar from "../components/ScheduleSidebar";
import ScheduleToolbar from "../components/ScheduleToolbar";
import ScheduleCalendar from "../components/ScheduleCalendar";
import BookingDetailModal from "../components/BookingDetailModal";

export default function SchedulePage() {
  const calendarRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(() =>
    localStorage.getItem("currentBranchId")
  );

  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleRange, setVisibleRange] = useState(null);
  const visibleRangeKeyRef = useRef("");

  const [activeResources, setActiveResources] = useState([]);

  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [anchorPos, setAnchorPos] = useState(null);

  const staffId = localStorage.getItem("userId"); // ID nhân viên đang đăng nhập
    branchId,
    visibleRange
  );

  const getApi = () => calendarRef.current?.getApi();

  useEffect(() => {
    let active = true;

    const loadBranches = async () => {
      try {
        const data = await getMyBranchesApi();
        if (!active) return;

        setBranches(data || []);

        const storedBranchId = localStorage.getItem("currentBranchId");
        if (storedBranchId) {
          setBranchId(storedBranchId);
          return;
        }

        if (data?.length > 0) {
          const firstBranchId = String(data[0].id);
          localStorage.setItem("currentBranchId", firstBranchId);
          setBranchId(firstBranchId);
        }
      } catch {
        if (active) {
          message.error("Không thể tải danh sách chi nhánh.");
        }
      }
    };

    loadBranches();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (resources.length === 0) {
      setActiveResources([]);
      return;
    }

    setActiveResources((prev) => {
      const resourceIds = resources.map((r) => String(r.id));
      if (prev.length === 0) {
        return resourceIds;
      }

      const nextActive = prev.filter((id) => resourceIds.includes(String(id)));
      return nextActive.length > 0 ? nextActive : resourceIds;
    });
  }, [resources]);

  const branchName = useMemo(() => {
    if (!branchId) return "";
    return branches.find((branch) => String(branch.id) === String(branchId))?.name || "";
  }, [branchId, branches]);

  const effectiveActive =
    activeResources.length > 0
      ? activeResources
      : resources.map((r) => String(r.id));

  const handleToday = () => {
    getApi()?.today();
    setCurrentDate(new Date());
  };

  const handlePrev = () => {
    getApi()?.prev();
    setCurrentDate(getApi()?.getDate() || new Date());
  };

  const handleNext = () => {
    getApi()?.next();
    setCurrentDate(getApi()?.getDate() || new Date());
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    getApi()?.changeView(view);
  };

  const handleDateChange = useCallback((start, end) => {
    const nextKey = `${start.toISOString()}_${end.toISOString()}`;
    if (visibleRangeKeyRef.current === nextKey) {
      return;
    }

    visibleRangeKeyRef.current = nextKey;
    setCurrentDate(start);
    setVisibleRange({ start, end });
  }, []);

  const handleMiniDateClick = (date) => {
    setCurrentDate(date);
    getApi()?.gotoDate(date);

    if (currentView === "timeGridWeek" || currentView === "dayGridMonth") {
      handleViewChange("timeGridDay");
    }
  };

  const handleToggleResource = (id) => {
    setActiveResources((prev) =>
      prev.includes(String(id))
        ? prev.filter((resourceId) => resourceId !== String(id))
        : [...prev, String(id)]
    );
  };

  const handleEventClick = (info) => {
    info.jsEvent.stopPropagation();

    const rect = info.el.getBoundingClientRect();

    setAnchorPos({ x: rect.right, y: rect.top });

    setSelectedBooking({
      ...info.event.extendedProps,
      title: info.event.extendedProps?.userName || info.event.title,
      start: info.event.start?.toISOString(),
      end: info.event.end?.toISOString(),
      id: info.event.id,
      userName: info.event.extendedProps?.userName || info.event.title,
      branchName: info.event.extendedProps?.branchName || branchName,
      shiftDate: info.event.extendedProps?.shiftDate,
    });

    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedBooking(null);
  };

  const filteredEvents = events.filter((event) => {
    const resourceId = String(
      event.resourceId || event.extendedProps?.resourceId || ""
    );
    if (!resourceId) return true;
    return effectiveActive.includes(resourceId);
  });

  if (loading && events.length === 0) {
    return (
      <div className="schedule-page-wrapper">
        <div className="schedule-page">
          <div className="schedule-loading" style={{ flex: 1 }}>
            <div className="loading-spinner" />
            <span>Đang tải lịch làm việc...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page-wrapper">
      <div className="schedule-page">
        <ScheduleSidebar
          selectedDate={currentDate}
          onDateClick={handleMiniDateClick}
          resources={resources}
          activeResources={effectiveActive}
          onToggleResource={handleToggleResource}
          onCreateNew={reload}
        />

        <div className="schedule-main">
          <ScheduleToolbar
            currentDate={currentDate}
            currentView={currentView}
            onToday={handleToday}
            onPrev={handlePrev}
            onNext={handleNext}
            onViewChange={handleViewChange}
          />

          {branchName && (
            <div style={{ marginBottom: 12, color: "var(--gc-gray-600)", fontSize: 14 }}>
              Chi nhánh hiện tại: <strong>{branchName}</strong>
            </div>
          )}

          <ScheduleCalendar
            ref={calendarRef}
            events={filteredEvents}
            currentView={currentView}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onDateChange={handleDateChange}
          />
        </div>

        <BookingDetailModal
          open={popupOpen}
          onClose={handleClosePopup}
          booking={selectedBooking}
          anchorPos={anchorPos}
          branchId={branchId}
          staffId={staffId}
          onPaymentSuccess={() => {
            handleClosePopup();
            reload();
          }}
        />
      </div>
    </div>
  );
}
