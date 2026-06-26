import { useState } from "react";
import { MdChevronLeft, MdChevronRight, MdAdd } from "react-icons/md";
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
function MiniCalendar({ selectedDate, onDateClick }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = [];
  // Prev month padding
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, month: month - 1, year, other: true });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, other: false });
  }
  // Next month padding
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, month: month + 1, year, other: true });
  }
  const isSameDay = (cell, date) => {
    if (!date) return false;
    return (
      cell.day === date.getDate() &&
      cell.month === date.getMonth() &&
      cell.year === date.getFullYear()
    );
  };
  const isToday = (cell) => {
    const d = new Date(cell.year, cell.month, cell.day);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };
  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <span className="mini-cal-title">
          {MONTHS[month]} {year}
        </span>
        <div className="mini-cal-nav">
          <button className="mini-cal-nav-btn" onClick={prevMonth} title="Tháng trước">
            ‹
          </button>
          <button className="mini-cal-nav-btn" onClick={nextMonth} title="Tháng sau">
            ›
          </button>
        </div>
      </div>
      <div className="mini-calendar-grid">
        <div className="mini-cal-weekdays">
          {WEEKDAYS.map((d) => (
            <div key={d} className="mini-cal-weekday">{d}</div>
          ))}
        </div>
        <div className="mini-cal-days">
          {cells.map((cell, i) => {
            const cellDate = new Date(cell.year, cell.month, cell.day);
            const todayCell = isToday(cell);
            const selected = isSameDay(cell, selectedDate);
            return (
              <div key={i} className="mini-cal-day-wrapper">
                <div
                  className={[
                    "mini-cal-day",
                    cell.other ? "other-month" : "",
                    todayCell ? "today" : "",
                    selected && !todayCell ? "selected" : "",
                  ].join(" ")}
                  onClick={() => onDateClick(cellDate)}
                >
                  {cell.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
const STATUS_LABELS = {
  CONFIRMED: "Đã xác nhận",
  PENDING: "Chờ xử lý",
  CANCELLED: "Đã hủy",
};
export default function ScheduleSidebar({
  selectedDate,
  onDateClick,
  resources,
  activeResources,
  onToggleResource,
  onCreateNew,
}) {
  return (
    <div className="schedule-sidebar">
      {/* Create button */}
      <button className="sidebar-create-btn" onClick={onCreateNew}>
        <span className="plus-icon">＋</span>
        <span>Thêm lịch hẹn</span>
      </button>
      {/* Mini Calendar */}
      <MiniCalendar selectedDate={selectedDate} onDateClick={onDateClick} />
      <div style={{ height: 1, background: "var(--gc-gray-200)", margin: "0 12px 12px" }} />
      {/* Staff list */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Nhân viên</div>
        <div className="staff-list">
          {resources.map((res) => {
            const active = activeResources.includes(res.id);
            return (
              <div
                key={res.id}
                className="staff-item"
                onClick={() => onToggleResource(res.id)}
              >
                <div
                  className={`staff-color-dot ${!active ? "inactive" : ""}`}
                  style={{ background: res.color }}
                />
                <span className="staff-name">{res.title}</span>
                <div className={`staff-checkbox ${active ? "checked" : ""}`} />
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ height: 1, background: "var(--gc-gray-200)", margin: "0 12px 12px" }} />
      {/* Status legend */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Trạng thái</div>
        <div className="sidebar-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#34a853" }} />
            Đã xác nhận
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#f29900" }} />
            Chờ xử lý
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: "#c5221f" }} />
            Đã hủy
          </div>
        </div>
      </div>
    </div>
  );
}