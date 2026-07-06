import React, { useState, useEffect, useCallback } from "react";
import {
  Modal, Steps, Form, Select, DatePicker, TimePicker, Button,
  Tag, Alert, Space, Divider, Typography, Spin, Tooltip,
  Radio, Row, Col, Card, message,
} from "antd";
import {
  CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
  ReloadOutlined, ScissorOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/vi";
import api from "@/core/api/axios";

import {
  useRecurringBooking,
  buildDefaultResolutions,
  computeStats,
  getCalendarMonths,
} from "./useRecurringBooking";
import { confirmRecurringBookingApi } from "./recurringBookingApi";

dayjs.extend(isSameOrBefore);
dayjs.locale("vi");

const { Text } = Typography;
const { Option } = Select;

// ─── Mini Calendar ───────────────────────────────────────────────────────────

function MiniCalendar({ month, occurrences }) {
  const daysInMonth = month.daysInMonth();
  const firstDow    = month.startOf("month").day();

  // BE trả về date là "YYYY-MM-DD" string hoặc LocalDate serialized
  const occurrenceSet = new Set(occurrences.map((o) => String(o.date).slice(0, 10)));
  const conflictSet   = new Set(occurrences.filter((o) => o.hasConflict).map((o) => String(o.date).slice(0, 10)));
  const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const blanks = Array.from({ length: firstDow });
  const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div style={{ userSelect: "none" }}>
      <div style={{
        textAlign: "center", fontWeight: 600, marginBottom: 8,
        fontSize: 13, color: "#8b5e52", textTransform: "capitalize",
      }}>
        {month.format("MMMM YYYY")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DOW.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "#bbb", padding: "2px 0" }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map((d) => {
          const dateStr    = `${month.format("YYYY-MM")}-${String(d).padStart(2, "0")}`;
          const isBooked   = occurrenceSet.has(dateStr);
          const isConflict = conflictSet.has(dateStr);
          const isToday    = dayjs().format("YYYY-MM-DD") === dateStr;

          let bg = "transparent", color = "#555", border = "1px solid transparent";
          if (isConflict)    { bg = "#fff1f0"; color = "#cf1322"; border = "1px solid #ffa39e"; }
          else if (isBooked) { bg = "#b5865a"; color = "#fff"; }
          if (isToday) border = "1px solid #b5865a";

          return (
            <Tooltip key={d} title={isConflict ? "⚠ Xung đột" : isBooked ? "✓ Sẽ đặt" : ""} placement="top">
              <div style={{
                textAlign: "center", fontSize: 11, borderRadius: 4, padding: "3px 2px",
                background: bg, color, border,
                fontWeight: isBooked || isConflict ? 600 : 400, lineHeight: "16px",
              }}>
                {d}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

// ─── Conflict Row ─────────────────────────────────────────────────────────────

function ConflictRow({ occurrence, resolution, onResolve }) {
  // BE trả về: { date, startTime, endTime, hasConflict, conflictReason }
  const timeDisplay = occurrence.startTime
    ? String(occurrence.startTime).slice(0, 5)
    : "";

  return (
    <div style={{
      border: "1px solid #ffd6cc", borderRadius: 8, padding: "10px 14px",
      background: resolution === "SKIP" ? "#fafafa" : "#fff9f7",
      opacity: resolution === "SKIP" ? 0.6 : 1,
      marginBottom: 8, transition: "all 0.2s",
    }}>
      <Row align="middle" gutter={8}>
        <Col flex="auto">
          <Space direction="vertical" size={2}>
            <Text strong style={{ fontSize: 13 }}>
              {dayjs(occurrence.date).format("dddd, DD/MM/YYYY")}
            </Text>
            {timeDisplay && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {timeDisplay}
              </Text>
            )}
            <Text style={{ fontSize: 11, color: "#cf1322" }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              {occurrence.conflictReason || "Slot này đã có lịch khác"}
            </Text>
          </Space>
        </Col>
        <Col>
          <Radio.Group
            size="small"
            value={resolution}
            onChange={(e) => onResolve(String(occurrence.date).slice(0, 10), e.target.value)}
          >
            <Radio.Button value="SKIP"><CloseCircleOutlined /> Bỏ qua</Radio.Button>
            <Radio.Button value="INCLUDE"><CheckCircleOutlined /> Giữ</Radio.Button>
          </Radio.Group>
        </Col>
      </Row>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

/**
 * RecurringBookingModal
 *
 * Props:
 *   open:         boolean
 *   onClose:      () => void
 *   onSuccess:    () => void
 *   branchId:     number       (bắt buộc)
 *   initialDate?: string       YYYY-MM-DD
 */
export default function RecurringBookingModal({ open, onClose, onSuccess, branchId, initialDate }) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [services, setServices]       = useState([]);
  const [staffList, setStaffList]     = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [resolutions, setResolutions] = useState({});
  const [confirming, setConfirming]   = useState(false);

  const { previewing, previewData, preview, reset } = useRecurringBooking(branchId);

  // Load services + staff khi mở modal
  useEffect(() => {
    if (!open || !branchId) return;
    setLoadingMeta(true);
    Promise.all([
      api.get(`/api/v1/branches/${branchId}/services`).then((r) => r.data?.data || r.data || []),
      api.get(`/api/v1/branches/${branchId}/staff`).then((r) => r.data?.data || r.data || []),
    ])
      .then(([svc, staff]) => { setServices(svc); setStaffList(staff); })
      .catch(() => message.error("Không thể tải dữ liệu"))
      .finally(() => setLoadingMeta(false));
  }, [open, branchId]);

  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setResolutions({});
    reset();
    onClose();
  };

  // Tính endTime tự động từ startTime + duration dịch vụ đã chọn
  const calcEndTime = (startTime, serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!startTime || !svc?.durationMinutes) return null;
    return startTime.add(svc.durationMinutes, "minute");
  };

  // Bước 1 → gọi preview API
  const handlePreview = useCallback(async () => {
    try { await form.validateFields(); } catch { return; }

    const v       = form.getFieldsValue();
    const endTime = calcEndTime(v.startTime, v.serviceId);

    const data = await preview({
      staffId:   v.staffId,
      serviceId: v.serviceId,
      pattern:   v.pattern,
      startDate: v.startDate.format("YYYY-MM-DD"),
      endDate:   v.endDate.format("YYYY-MM-DD"),
      startTime: v.startTime.format("HH:mm"),
      endTime:   endTime ? endTime.format("HH:mm") : v.startTime.format("HH:mm"),
    });

    if (data) {
      setResolutions(buildDefaultResolutions(data));
      setCurrentStep(1);
    } else {
      message.error("Không thể tải preview");
    }
  }, [form, preview, services]);

  // Bước 2 → gọi confirm API
  const handleConfirm = useCallback(async () => {
    const v       = form.getFieldsValue();
    const endTime = calcEndTime(v.startTime, v.serviceId);

    setConfirming(true);
    try {
      // Payload đúng theo RecurringBookingConfirmRequest:
      // { pattern: RecurringBookingRequest, occurrences: OccurrenceDecision[] }
      await confirmRecurringBookingApi({
        pattern: {
          branchId:  branchId,
          staffId:   v.staffId,
          serviceId: v.serviceId,
          pattern:   v.pattern,
          startDate: v.startDate.format("YYYY-MM-DD"),
          endDate:   v.endDate.format("YYYY-MM-DD"),
          startTime: v.startTime.format("HH:mm"),
          endTime:   endTime ? endTime.format("HH:mm") : v.startTime.format("HH:mm"),
        },
        // Gửi TẤT CẢ occurrences kèm action INCLUDE/SKIP
        occurrences: (previewData?.occurrences || []).map((occ) => ({
          date:   String(occ.date).slice(0, 10),
          action: resolutions[String(occ.date).slice(0, 10)] || "INCLUDE",
        })),
      });
      message.success("Đã đặt lịch định kỳ thành công!");
      handleClose();
      onSuccess?.();
    } catch (err) {
      message.error(err?.response?.data?.message || err.message || "Đặt lịch thất bại");
    } finally {
      setConfirming(false);
    }
  }, [form, resolutions, branchId, previewData, services]);

  // Derived
  const stats          = computeStats(previewData, resolutions);
  const calendarMonths = getCalendarMonths(previewData?.occurrences, 6).map((m) => dayjs(m));
  // Filter conflict từ occurrences (BE không có field conflicts riêng)
  const conflicts      = (previewData?.occurrences || []).filter((o) => o.hasConflict);

  const disableStart = (d) => d && d.isBefore(dayjs(), "day");
  const disableEnd   = (d) => {
    const start = form.getFieldValue("startDate");
    return d && d.isBefore(start ? start.add(7, "day") : dayjs(), "day");
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={currentStep === 1 && calendarMonths.length > 2 ? 900 : 680}
      title={
        <Space>
          <CalendarOutlined style={{ color: "#b5865a" }} />
          <span style={{ fontWeight: 700 }}>Đặt lịch định kỳ</span>
        </Space>
      }
      styles={{ header: { borderBottom: "1px solid #f0e8e0" }, body: { padding: "20px 24px" } }}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        size="small"
        progressDot
        style={{ marginBottom: 24 }}
        items={[
          { title: "Cấu hình lịch", icon: <ScissorOutlined /> },
          { title: "Xem trước & xác nhận", icon: <CalendarOutlined /> },
        ]}
      />

      {/* ── STEP 0: FORM ─────────────────────────────────────── */}
      {currentStep === 0 && (
        <Spin spinning={loadingMeta}>
          <Form form={form} layout="vertical" requiredMark={false}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Dịch vụ" name="serviceId"
                  rules={[{ required: true, message: "Chọn dịch vụ" }]}
                >
                  <Select placeholder="Chọn dịch vụ" showSearch optionFilterProp="children" size="large">
                    {services.map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.name}
                        {s.durationMinutes && (
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
                            {s.durationMinutes} phút
                          </Text>
                        )}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                {/* BE dùng staffId, không phải stylistId */}
                <Form.Item
                  label="Nhân viên" name="staffId"
                  rules={[{ required: true, message: "Chọn nhân viên" }]}
                >
                  <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children" size="large">
                    {staffList.map((s) => (
                      <Option key={s.id} value={s.id}>{s.fullName || s.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                {/* BE dùng startTime, không phải time */}
                <Form.Item
                  label="Giờ bắt đầu" name="startTime"
                  rules={[{ required: true, message: "Chọn giờ" }]}
                >
                  <TimePicker
                    format="HH:mm" minuteStep={15} size="large"
                    style={{ width: "100%" }} placeholder="Chọn giờ"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Ngày bắt đầu" name="startDate"
                  initialValue={initialDate ? dayjs(initialDate) : undefined}
                  rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
                >
                  <DatePicker
                    disabledDate={disableStart} format="DD/MM/YYYY"
                    size="large" style={{ width: "100%" }} placeholder="Ngày bắt đầu"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="Ngày kết thúc" name="endDate"
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker
                    disabledDate={disableEnd} format="DD/MM/YYYY"
                    size="large" style={{ width: "100%" }} placeholder="Ngày kết thúc"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Tần suất lặp lại" name="pattern"
              initialValue="WEEKLY" rules={[{ required: true }]}
            >
              <Radio.Group size="large" style={{ width: "100%" }}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Radio.Button
                      value="WEEKLY"
                      style={{ width: "100%", textAlign: "center", height: 48, lineHeight: "46px" }}
                    >
                      <ReloadOutlined style={{ marginRight: 6 }} />Hàng tuần
                    </Radio.Button>
                  </Col>
                  <Col span={12}>
                    <Radio.Button
                      value="BIWEEKLY"
                      style={{ width: "100%", textAlign: "center", height: 48, lineHeight: "46px" }}
                    >
                      <ReloadOutlined style={{ marginRight: 6 }} />2 tuần / lần
                    </Radio.Button>
                  </Col>
                </Row>
              </Radio.Group>
            </Form.Item>

            <Divider style={{ margin: "12px 0" }} />

            <Alert
              message="Lưu ý: Tối đa 26 lần đặt trong một chu kỳ. endTime tự động tính theo thời lượng dịch vụ."
              type="info" showIcon icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16, borderRadius: 8 }}
            />

            <Row justify="end" gutter={8}>
              <Col><Button onClick={handleClose}>Huỷ</Button></Col>
              <Col>
                <Button
                  type="primary" icon={<CalendarOutlined />}
                  loading={previewing} onClick={handlePreview}
                  style={{ background: "#b5865a", borderColor: "#b5865a" }} size="large"
                >
                  Xem trước lịch hẹn
                </Button>
              </Col>
            </Row>
          </Form>
        </Spin>
      )}

      {/* ── STEP 1: PREVIEW ──────────────────────────────────── */}
      {currentStep === 1 && previewData && stats && (
        <div>
          {/* Summary cards */}
          <Row gutter={12} style={{ marginBottom: 20 }}>
            {[
              { label: "Tổng lần hẹn", value: stats.total,     color: "#b5865a" },
              { label: "Xung đột",     value: stats.conflicts,  color: stats.conflicts > 0 ? "#cf1322" : "#52c41a" },
              { label: "Bỏ qua",       value: stats.skipped,    color: "#8c8c8c" },
              { label: "Sẽ đặt",       value: stats.confirmed,  color: "#389e0d" },
            ].map((s) => (
              <Col span={6} key={s.label}>
                <Card
                  size="small"
                  style={{ textAlign: "center", borderRadius: 8, border: `1px solid ${s.color}33` }}
                  styles={{ body: { padding: "10px 8px" } }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{s.label}</div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Calendar preview */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(calendarMonths.length, 3)}, 1fr)`,
            gap: 16, marginBottom: 16, padding: 16,
            background: "#fdf8f4", borderRadius: 10, border: "1px solid #f0e8e0",
          }}>
            {calendarMonths.map((m) => (
              <MiniCalendar
                key={m.format("YYYY-MM")}
                month={m}
                occurrences={previewData.occurrences || []}
              />
            ))}
          </div>

          {/* Legend */}
          <Space style={{ marginBottom: 16 }} wrap>
            <Tag color="#b5865a" style={{ borderRadius: 4 }}>■ Sẽ đặt</Tag>
            <Tag color="error"   style={{ borderRadius: 4 }}>■ Xung đột</Tag>
            <Tag style={{ borderRadius: 4, border: "1px solid #b5865a", color: "#b5865a" }}>□ Hôm nay</Tag>
          </Space>

          {/* Conflict resolution */}
          {conflicts.length > 0 && (
            <>
              <Divider style={{ margin: "12px 0" }}>
                <Space>
                  <ExclamationCircleOutlined style={{ color: "#cf1322" }} />
                  <Text type="danger" strong>{conflicts.length} xung đột cần xử lý</Text>
                </Space>
              </Divider>
              <div style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                {conflicts.map((c) => (
                  <ConflictRow
                    key={String(c.date)}
                    occurrence={c}
                    resolution={resolutions[String(c.date).slice(0, 10)] || "SKIP"}
                    onResolve={(date, val) =>
                      setResolutions((prev) => ({ ...prev, [date]: val }))
                    }
                  />
                ))}
              </div>
            </>
          )}

          {conflicts.length === 0 && (
            <Alert
              message="Không có xung đột — sẵn sàng đặt lịch!"
              type="success" showIcon style={{ borderRadius: 8, marginBottom: 12 }}
            />
          )}

          <Divider style={{ margin: "16px 0 12px" }} />

          <Row justify="space-between">
            <Col>
              <Button onClick={() => setCurrentStep(0)} icon={<ReloadOutlined />}>
                Quay lại chỉnh sửa
              </Button>
            </Col>
            <Col>
              <Space>
                <Button onClick={handleClose}>Huỷ</Button>
                <Button
                  type="primary" icon={<CheckCircleOutlined />}
                  loading={confirming} onClick={handleConfirm}
                  disabled={stats.confirmed === 0}
                  style={{ background: "#b5865a", borderColor: "#b5865a" }} size="large"
                >
                  Xác nhận đặt {stats.confirmed} lịch
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
}