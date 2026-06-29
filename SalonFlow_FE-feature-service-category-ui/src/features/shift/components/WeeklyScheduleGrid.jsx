import { TimePicker, Switch, Card, Row, Col, Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

const DAYS = [
    { value: 1, label: "Thứ 2" },
    { value: 2, label: "Thứ 3" },
    { value: 3, label: "Thứ 4" },
    { value: 4, label: "Thứ 5" },
    { value: 5, label: "Thứ 6" },
    { value: 6, label: "Thứ 7" },
    { value: 7, label: "Chủ nhật" },
];

/**
 * Grid chọn lịch làm việc theo tuần.
 * Mỗi ngày có toggle bật/tắt + TimePicker giờ bắt đầu/kết thúc.
 *
 * Props:
 *   value: [{ dayOfWeek, startTime, endTime }]
 *   onChange: (newDetails) => void
 */
export default function WeeklyScheduleGrid({ value = [], onChange }) {

    // Lấy config của 1 ngày từ value
    const getDayConfig = (dayOfWeek) => {
        return value.find((d) => d.dayOfWeek === dayOfWeek) || null;
    };

    // Bật/tắt ngày
    const toggleDay = (dayOfWeek, checked) => {
        if (checked) {
            // Bật: thêm config mặc định 08:00 - 17:00
            onChange([
                ...value,
                {
                    dayOfWeek,
                    startTime: "08:00",
                    endTime: "17:00",
                },
            ]);
        } else {
            // Tắt: xóa ngày đó
            onChange(value.filter((d) => d.dayOfWeek !== dayOfWeek));
        }
    };

    // Cập nhật giờ
    const updateTime = (dayOfWeek, field, timeValue) => {
        const formatted = timeValue ? timeValue.format("HH:mm") : null;
        onChange(
            value.map((d) =>
                d.dayOfWeek === dayOfWeek ? { ...d, [field]: formatted } : d
            )
        );
    };

    return (
        <div>
            {DAYS.map((day) => {
                const config = getDayConfig(day.value);
                const isActive = !!config;

                return (
                    <Card
                        key={day.value}
                        size="small"
                        style={{
                            marginBottom: 8,
                            borderColor: isActive ? "#1677ff" : "#f0f0f0",
                            background: isActive ? "#f0f7ff" : "#fafafa",
                        }}
                    >
                        <Row align="middle" gutter={16}>
                            {/* Toggle bật/tắt ngày */}
                            <Col flex="100px">
                                <Switch
                                    checked={isActive}
                                    onChange={(checked) =>
                                        toggleDay(day.value, checked)
                                    }
                                    checkedChildren={day.label}
                                    unCheckedChildren={day.label}
                                    style={{ width: 90 }}
                                />
                            </Col>

                            {/* TimePicker giờ bắt đầu/kết thúc */}
                            {isActive ? (
                                <>
                                    <Col>
                                        <Text type="secondary" style={{ marginRight: 8 }}>
                                            Từ
                                        </Text>
                                        <TimePicker
                                            value={
                                                config.startTime
                                                    ? dayjs(config.startTime, "HH:mm")
                                                    : null
                                            }
                                            format="HH:mm"
                                            minuteStep={15}
                                            onChange={(t) =>
                                                updateTime(day.value, "startTime", t)
                                            }
                                            placeholder="Bắt đầu"
                                            style={{ width: 110 }}
                                        />
                                    </Col>
                                    <Col>
                                        <Text type="secondary" style={{ marginRight: 8 }}>
                                            đến
                                        </Text>
                                        <TimePicker
                                            value={
                                                config.endTime
                                                    ? dayjs(config.endTime, "HH:mm")
                                                    : null
                                            }
                                            format="HH:mm"
                                            minuteStep={15}
                                            onChange={(t) =>
                                                updateTime(day.value, "endTime", t)
                                            }
                                            placeholder="Kết thúc"
                                            style={{ width: 110 }}
                                        />
                                    </Col>
                                </>
                            ) : (
                                <Col>
                                    <Text type="secondary">Không làm việc</Text>
                                </Col>
                            )}
                        </Row>
                    </Card>
                );
            })}
        </div>
    );
}