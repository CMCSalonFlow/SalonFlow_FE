import { useRef, useState, useCallback } from "react";

import "../schedule.css";

import { useSchedule, useBookingUpdate } from "../hooks/useBookingUpdate";

import ScheduleSidebar from "../components/ScheduleSidebar";

import ScheduleToolbar from "../components/ScheduleToolbar";

import ScheduleCalendar from "../components/ScheduleCalendar";

import BookingDetailModal from "../components/BookingDetailModal";

import ConfirmMoveModal from "../components/ConfirmMoveModal";

export default function SchedulePage() {

  const calendarRef = useRef(null);

  const { bookings, resources, loading, reload } = useSchedule();

  const { updateTime, cancelBooking } = useBookingUpdate();

  // Calendar state

  const [currentView, setCurrentView] = useState("timeGridWeek");

  const [currentDate, setCurrentDate] = useState(new Date());

  // Active resources (shown/hidden staff)

  const [activeResources, setActiveResources] = useState(

    () => resources.map((r) => r.id) // all active by default

  );

  // Sync activeResources when resources load

  const allResourceIds = resources.map((r) => r.id);

  const effectiveActive = activeResources.length > 0

    ? activeResources

    : allResourceIds;

  // Booking detail popup

  const [popupOpen, setPopupOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);

  const [anchorPos, setAnchorPos] = useState(null);

  // Confirm move (drag-drop)

  const [pendingMove, setPendingMove] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Calendar API helpers ──────────────────────────────────

  const getApi = () => calendarRef.current?.getApi();

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

  const handleDateChange = useCallback((date) => {

    setCurrentDate(date);

  }, []);

  // ── Mini calendar date click ──────────────────────────────

  const handleMiniDateClick = (date) => {

    setCurrentDate(date);

    getApi()?.gotoDate(date);

    // Switch to day view when clicking a specific day

    if (currentView === "timeGridWeek" || currentView === "dayGridMonth") {

      handleViewChange("timeGridDay");

    }

  };

  // ── Staff toggle ─────────────────────────────────────────

  const handleToggleResource = (id) => {

    setActiveResources((prev) =>

      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]

    );

  };

  // ── Event click → popup ──────────────────────────────────

  const handleEventClick = (info) => {

    info.jsEvent.stopPropagation();

    const rect = info.el.getBoundingClientRect();

    setAnchorPos({ x: rect.right, y: rect.top });

    setSelectedBooking({

      ...info.event.extendedProps,

      title: info.event.extendedProps?.title || info.event.title,

      start: info.event.start?.toISOString(),

      end: info.event.end?.toISOString(),

      id: info.event.id,

    });

    setPopupOpen(true);

  };

  const handleClosePopup = () => {

    setPopupOpen(false);

    setSelectedBooking(null);

  };

  const handleCancelBooking = async (id) => {

    await cancelBooking(id);

    await reload();

    handleClosePopup();

  };

  // ── Event drag-drop → confirm ────────────────────────────

  const handleEventDrop = (info) => {

    setPendingMove({

      id: info.event.id,

      start: info.event.start?.toISOString(),

      end: info.event.end?.toISOString(),

      resourceId:

        info.event.getResources?.()[0]?.id ||

        info.event.extendedProps?.resourceId,

      revert: info.revert,

    });

    setConfirmOpen(true);

  };

  const handleConfirmMove = async () => {

    if (!pendingMove) return;

    setConfirmOpen(false);

    await updateTime(

      pendingMove.id,

      pendingMove.start,

      pendingMove.end,

      pendingMove.resourceId

    );

    await reload();

    setPendingMove(null);

  };

  const handleCancelMove = () => {

    pendingMove?.revert?.();

    setConfirmOpen(false);

    setPendingMove(null);

  };

  // ── Filter events by active resources ────────────────────

  const filteredEvents = bookings.filter((ev) => {

    const resId = ev.resourceId || ev.extendedProps?.resourceId;

    if (!resId) return true;

    return effectiveActive.includes(resId);

  });

  // ── Loading state ─────────────────────────────────────────

  if (loading && bookings.length === 0) {

    return (

      <div className="schedule-page-wrapper">

        <div className="schedule-page">

          <div className="schedule-loading" style={{ flex: 1 }}>

            <div className="loading-spinner" />

            <span>Đang tải lịch hẹn...</span>

          </div>

        </div>

      </div>

    );

  }

  return (

   <div className="schedule-page-wrapper">

    <div className="schedule-page">

      {/* Left Sidebar */}

      <ScheduleSidebar

        selectedDate={currentDate}

        onDateClick={handleMiniDateClick}

        resources={resources.length > 0 ? resources : []}

        activeResources={effectiveActive}

        onToggleResource={handleToggleResource}

        onCreateNew={() => alert("Tính năng thêm lịch hẹn sẽ được phát triển!")}

      />

      {/* Right: Toolbar + Calendar */}

      <div className="schedule-main">

        <ScheduleToolbar

          currentDate={currentDate}

          currentView={currentView}

          onToday={handleToday}

          onPrev={handlePrev}

          onNext={handleNext}

          onViewChange={handleViewChange}

        />

        <ScheduleCalendar

          ref={calendarRef}

          events={filteredEvents}

          currentView={currentView}

          currentDate={currentDate}

          onEventClick={handleEventClick}

          onEventDrop={handleEventDrop}

          onDateChange={handleDateChange}

        />

      </div>

      {/* Booking Detail Popup */}

      <BookingDetailModal

        open={popupOpen}

        onClose={handleClosePopup}

        booking={selectedBooking}

        anchorPos={anchorPos}

        onCancelBooking={handleCancelBooking}

      />

      {/* Confirm move toast */}

      <ConfirmMoveModal

        open={confirmOpen}

        onOk={handleConfirmMove}

        onCancel={handleCancelMove}

      />

    </div>

    </div>

  );

}