import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { forwardRef } from "react";
const STATUS_COLORS = {
  CONFIRMED: { bg: "#34a853", text: "#fff" },
  PENDING: { bg: "#f29900", text: "#fff" },
  CANCELLED: { bg: "#c5221f", text: "#fff" },
  default: { bg: "#1a73e8", text: "#fff" },
};
function renderEventContent(eventInfo) {
  const { event, view } = eventInfo;
  const props = event.extendedProps;
  const status = props?.status || "default";
  const colors = STATUS_COLORS[status] || STATUS_COLORS.default;
  const startStr = event.start
    ? event.start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const endStr = event.end
    ? event.end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  // Month view: compact
  if (view.type === "dayGridMonth") {
    return (
      <div
        style={{
          background: colors.bg,
          color: colors.text,
          borderRadius: 3,
          padding: "1px 6px",
          fontSize: 11,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {startStr} {event.title}
      </div>
    );
  }
  // Day/Week view: full card
  return (
    <div
      className="gc-event-inner"
      style={{ color: colors.text }}
    >
      <div className="gc-event-time">
        {startStr} – {endStr}
      </div>
      <div className="gc-event-title">{event.title.split(" - ")[0]}</div>
      {props?.customerName && (
        <div className="gc-event-customer">{props.customerName}</div>
      )}
    </div>
  );
}
function renderDayHeader(info) {
  const d = info.date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = d.toDateString() === today.toDateString();
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = dayNames[d.getDay()];
  return (
    <div className="fc-col-day-label">
      <span className="fc-col-day-name">{dayName}</span>
      <span className={`fc-col-day-num ${isToday ? "is-today" : ""}`}>
        {d.getDate()}
      </span>
    </div>
  );
}
const ScheduleCalendar = forwardRef(function ScheduleCalendar(
  {
    events,
    currentView,
    currentDate,
    onEventClick,
    onEventDrop,
    onDateChange,
  },
  ref
) {
  const STATUS_COLORS_MAP = {
    CONFIRMED: { bg: "#34a853", border: "#2d8f45" },
    PENDING: { bg: "#f29900", border: "#d08600" },
    CANCELLED: { bg: "#c5221f", border: "#a31b18" },
    default: { bg: "#1a73e8", border: "#1557b0" },
  };
  const styledEvents = events.map((ev) => {
    const status = ev.extendedProps?.status || "default";
    const colors = STATUS_COLORS_MAP[status] || STATUS_COLORS_MAP.default;
    return {
      ...ev,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: "#fff",
    };
  });
  return (
    <div className="schedule-calendar-wrapper">
      <FullCalendar
        ref={ref}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView={currentView}
        initialDate={currentDate}
        headerToolbar={false}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        height="100%"
        allDaySlot={false}
        nowIndicator={true}
        events={styledEvents}
        editable={true}
        selectable={true}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        eventContent={renderEventContent}
        dayHeaderContent={renderDayHeader}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        datesSet={(info) => {
          onDateChange && onDateChange(info.start);
        }}
        locale="vi"
        firstDay={1}
        eventClassNames="gc-event"
        scrollTime="08:00:00"
      />
    </div>
  );
});
export default ScheduleCalendar;
