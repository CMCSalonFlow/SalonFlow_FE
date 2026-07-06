const VIEWS = [
  { key: "timeGridDay", label: "Ngày" },
  { key: "timeGridWeek", label: "Tuần" },
  { key: "dayGridMonth", label: "Tháng" },
];
const MONTHS_SHORT = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
function formatTitle(date, view) {
  const d = new Date(date);
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  if (view === "timeGridDay") {
    const day = d.getDate();
    return (
      <>
        {day} <span>{month}</span> {year}
      </>
    );
  }
  if (view === "timeGridWeek") {
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startM = MONTHS_SHORT[startOfWeek.getMonth()];
    const endM = MONTHS_SHORT[endOfWeek.getMonth()];
    const endY = endOfWeek.getFullYear();
    if (startM === endM) {
      return (
        <>
          {startM} <span>{endY}</span>
        </>
      );
    }
    return (
      <>
        {startM} – {endM} <span>{endY}</span>
      </>
    );
  }
  // month
  return (
    <>
      {month} <span>{year}</span>
    </>
  );
}
export default function ScheduleToolbar({
  currentDate,
  currentView,
  onToday,
  onPrev,
  onNext,
  onViewChange,
}) {
  return (
    <div className="schedule-toolbar">
      {/* Today button */}
      <button className="toolbar-today-btn" onClick={onToday}>
        Hôm nay
      </button>
      {/* Navigation */}
      <div className="toolbar-nav">
        <button className="toolbar-nav-btn" onClick={onPrev} title="Trước">
          ‹
        </button>
        <button className="toolbar-nav-btn" onClick={onNext} title="Sau">
          ›
        </button>
      </div>
      {/* Title */}
      <div className="toolbar-title">
        {formatTitle(currentDate, currentView)}
      </div>
      <div className="toolbar-spacer" />
      {/* View selector */}
      <div className="toolbar-view-selector">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            className={`toolbar-view-btn ${currentView === v.key ? "active" : ""}`}
            onClick={() => onViewChange(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
