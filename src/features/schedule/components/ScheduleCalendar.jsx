import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { forwardRef, useEffect } from "react";
import { ScissorOutlined, UserOutlined } from "@ant-design/icons";

function renderEventContent(eventInfo) {
  const { event, view } = eventInfo;
  const props = event.extendedProps;
  const startStr = event.start
    ? event.start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const endStr = event.end
    ? event.end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "";
  const backgroundColor = event.backgroundColor || "#1a73e8";

  // Month view: compact
  if (view.type === "dayGridMonth") {
    return (
      <div
        style={{
          background: backgroundColor,
          color: "#fff",
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

  const isDayView = view.type === "timeGridDay";

  // Day/Week view
  return (
    <div
      className="gc-event-inner"
      style={{
        color: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: isDayView ? "4px 8px" : "2px 4px",
        overflow: "hidden",
      }}
    >
      <div className="gc-event-time" style={{ fontWeight: 600, fontSize: isDayView ? 12 : 11, opacity: 0.95 }}>
        {startStr} – {endStr}
      </div>
      <div
        className="gc-event-title"
        style={{
          fontWeight: 700,
          fontSize: isDayView ? 13 : 11,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginTop: 1,
        }}
      >
        {isDayView && <UserOutlined style={{ marginRight: 4 }} />}
        {props?.userName || event.title}
      </div>

      {isDayView && (
        <div
          style={{
            fontSize: 11,
            opacity: 0.88,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <ScissorOutlined style={{ marginRight: 4 }} />
          {props?.serviceName || props?.branchName || "Lịch hẹn dịch vụ"}
        </div>
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
    onDateChange,
  },
  ref
) {
  useEffect(() => {
    if (ref && typeof ref === "object" && ref.current) {
      const api = ref.current.getApi?.();
      if (api && api.view && api.view.type !== currentView) {
        api.changeView(currentView);
      }
    }
  }, [currentView, ref]);

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
        events={events}
        editable={false}
        selectable={false}
        eventClick={onEventClick}
        eventContent={renderEventContent}
        dayHeaderContent={renderDayHeader}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        datesSet={(info) => {
          onDateChange && onDateChange(info.start, info.end);
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
