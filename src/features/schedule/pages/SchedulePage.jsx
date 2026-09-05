import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import dayjs from "dayjs";
import { message, Select, Typography, Space, Grid, Drawer } from "antd";
import { ShopOutlined, CalendarOutlined } from "@ant-design/icons";

const { Text } = Typography;

import "../schedule.css";

import { getMyBranchesApi } from "@/features/branch/api/branchApi";

import { useScheduleData } from "../hooks/useScheduleData";

import ScheduleSidebar from "../components/ScheduleSidebar";
import ScheduleToolbar from "../components/ScheduleToolbar";
import ScheduleCalendar from "../components/ScheduleCalendar";
import BookingDetailModal from "../components/BookingDetailModal";

export default function SchedulePage() {
  const calendarRef = useRef(null);
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isStaffPage = location.pathname.startsWith("/staff");
  const isMobile = !screens.md;

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(() =>
    localStorage.getItem("currentBranchId")
  );

  const [currentView, setCurrentView] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "timeGridDay" : "timeGridWeek"
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleRange, setVisibleRange] = useState(null);
  const visibleRangeKeyRef = useRef("");

  const [activeResources, setActiveResources] = useState([]);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);

  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [anchorPos, setAnchorPos] = useState(null);

  const { events, resources, systemOffDays, loading, reload } = useScheduleData(
    branchId,
    visibleRange
  );

  const currentUserId = String(localStorage.getItem("userId") || "");
  const currentFullName =
    localStorage.getItem("fullName") ||
    JSON.parse(localStorage.getItem("user") || "{}")?.fullName ||
    JSON.parse(localStorage.getItem("auth") || "{}")?.fullName ||
    "";

  const staffResources = useMemo(() => {
    if (!isStaffPage || resources.length === 0) return resources;

    const matched = resources.filter(
      (r) =>
        String(r.id) === currentUserId ||
        (currentFullName && r.title?.toLowerCase().includes(currentFullName.toLowerCase()))
    );

    return matched.length > 0 ? matched : resources;
  }, [isStaffPage, resources, currentUserId, currentFullName]);

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

  const effectiveActive = useMemo(() => {
    if (isStaffPage) {
      return staffResources.map((r) => String(r.id));
    }
    return activeResources.length > 0
      ? activeResources
      : resources.map((r) => String(r.id));
  }, [isStaffPage, staffResources, activeResources, resources]);

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

    if (isMobile || currentView === "timeGridWeek" || currentView === "dayGridMonth") {
      handleViewChange("timeGridDay");
    }
    setSidebarDrawerOpen(false);
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
        {/* Desktop Sidebar (renders inline on screens >= md) */}
        {!isMobile && (
          <ScheduleSidebar
            selectedDate={currentDate}
            onDateClick={handleMiniDateClick}
            resources={isStaffPage ? staffResources : resources}
            activeResources={effectiveActive}
            onToggleResource={handleToggleResource}
            onCreateNew={reload}
            isStaffView={isStaffPage}
          />
        )}

        {/* Mobile Sidebar Drawer (renders in Drawer on screens < md) */}
        {isMobile && (
          <Drawer
            title="📅 Chọn ngày & Bộ lọc lịch"
            placement="left"
            open={sidebarDrawerOpen}
            onClose={() => setSidebarDrawerOpen(false)}
            styles={{ wrapper: { width: 300 } }}
          >
            <ScheduleSidebar
              selectedDate={currentDate}
              onDateClick={handleMiniDateClick}
              resources={isStaffPage ? staffResources : resources}
              activeResources={effectiveActive}
              onToggleResource={handleToggleResource}
              onCreateNew={() => {
                reload();
                setSidebarDrawerOpen(false);
              }}
              isStaffView={isStaffPage}
              isMobileDrawer={true}
            />
          </Drawer>
        )}

        <div className="schedule-main">
          {systemOffDays && systemOffDays.length > 0 && (
            <div style={{ padding: "8px 16px", backgroundColor: "#fffbe6", borderBottom: "1px solid #ffe58f", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <CalendarOutlined style={{ color: "#fa8c16", fontSize: 16 }} />
              <Text strong style={{ color: "#d46b08", fontSize: 13 }}>
                📢 Chi nhánh có lịch nghỉ lễ / đóng cửa trong khoảng thời gian này:
              </Text>
              {systemOffDays.map((off) => (
                <span key={off.id} style={{ fontSize: 13, color: "#8c6b00", backgroundColor: "#fff1b8", padding: "2px 10px", borderRadius: 6, fontWeight: 600 }}>
                  🎉 {off.title} ({dayjs(off.dateFrom).format("DD/MM/YYYY")}{off.dateFrom !== off.dateTo ? ` ➔ ${dayjs(off.dateTo).format("DD/MM/YYYY")}` : ""})
                </span>
              ))}
            </div>
          )}

          <ScheduleToolbar
            currentDate={currentDate}
            currentView={currentView}
            onToday={handleToday}
            onPrev={handlePrev}
            onNext={handleNext}
            onViewChange={handleViewChange}
            onOpenSidebarDrawer={() => setSidebarDrawerOpen(true)}
            isMobile={isMobile}
            branchSelect={
              !isStaffPage && branches.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShopOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                  {!isMobile && <Text strong style={{ fontSize: 13 }}>Chi nhánh:</Text>}
                  <Select
                    style={{ width: isMobile ? 130 : 190 }}
                    size={isMobile ? "small" : "middle"}
                    value={branchId ? String(branchId) : undefined}
                    onChange={(val) => {
                      setBranchId(val);
                      localStorage.setItem("currentBranchId", val);
                    }}
                    options={branches.map((b) => ({
                      label: b.name,
                      value: String(b.id),
                    }))}
                    placeholder="Chọn chi nhánh"
                  />
                </div>
              ) : null
            }
          />

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
        />
      </div>
    </div>
  );
}
