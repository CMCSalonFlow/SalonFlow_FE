import { CalendarOutlined } from "@ant-design/icons";

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

function formatTitle(date, view, isMobile = false) {
  const d = new Date(date);
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();

  if (view === "timeGridDay") {
    const day = d.getDate();
    return (
      <>
        {day} <span>{month}</span> {isMobile ? "" : year}
      </>
    );
  }

  if (view === "timeGridWeek") {
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startM = MONTHS_SHORT[startOfWeek.getMonth()];
    const endM = MONTHS_SHORT[endOfWeek.getMonth()];
    const endY = endOfWeek.getFullYear();

    if (isMobile) {
      return (
        <>
          {startOfWeek.getDate()}/{startOfWeek.getMonth() + 1} – {endOfWeek.getDate()}/{endOfWeek.getMonth() + 1}
        </>
      );
    }

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
  branchSelect = null,
  onOpenSidebarDrawer = null,
  isMobile = false,
}) {
  if (isMobile) {
    return (
      <div
        className="schedule-toolbar schedule-toolbar-mobile"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "auto",
          padding: "8px 12px",
          gap: 8,
          borderBottom: "1px solid var(--gc-gray-200)",
          background: "var(--gc-white)",
        }}
      >
        {/* Mobile Row 1: Drawer Toggle, Nav, and Date Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {onOpenSidebarDrawer && (
              <button
                type="button"
                className="toolbar-today-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 9px",
                  fontSize: 12,
                  backgroundColor: "#e8f0fe",
                  color: "#1a73e8",
                  borderColor: "#bad3f9",
                  fontWeight: 600,
                }}
                onClick={onOpenSidebarDrawer}
              >
                <CalendarOutlined />
                <span>Lịch</span>
              </button>
            )}

            <button
              type="button"
              className="toolbar-today-btn"
              onClick={onToday}
              style={{ padding: "5px 8px", fontSize: 12 }}
            >
              Hôm nay
            </button>

            <div className="toolbar-nav" style={{ gap: 2 }}>
              <button type="button" className="toolbar-nav-btn" style={{ width: 28, height: 28, fontSize: 14 }} onClick={onPrev} title="Trước">
                ‹
              </button>
              <button type="button" className="toolbar-nav-btn" style={{ width: 28, height: 28, fontSize: 14 }} onClick={onNext} title="Sau">
                ›
              </button>
            </div>
          </div>

          <div
            className="toolbar-title"
            style={{
              fontSize: 15,
              fontWeight: 600,
              minWidth: "auto",
              textAlign: "right",
              color: "#1e293b",
            }}
          >
            {formatTitle(currentDate, currentView, true)}
          </div>
        </div>

        {/* Mobile Row 2: View Switcher (Ngày/Tuần/Tháng) & Branch Select */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 8 }}>
          <div className="toolbar-view-selector" style={{ borderRadius: 6, flex: 1, maxWidth: 220 }}>
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                className={`toolbar-view-btn ${currentView === v.key ? "active" : ""}`}
                style={{ flex: 1, padding: "5px 0", fontSize: 12, textAlign: "center" }}
                onClick={() => onViewChange(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {branchSelect && (
            <div style={{ flexShrink: 0, maxWidth: 140 }}>
              {branchSelect}
            </div>
          )}
        </div>
      </div>
    );
  }

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

      {branchSelect && (
        <div style={{ marginRight: 16, display: "flex", alignItems: "center" }}>
          {branchSelect}
        </div>
      )}

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
