import { Empty, Typography } from "antd";

const { Text } = Typography;

const chartWidth = 920;
const chartHeight = 360;
const padding = {
    top: 24,
    right: 28,
    bottom: 42,
    left: 78
};

const formatCurrency = (value) => {
    const amount = Number(value || 0);

    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)}B`;
    }

    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }

    if (amount >= 1000) {
        return `${Math.round(amount / 1000)}K`;
    }

    return `${Math.round(amount)}`;
};

const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit"
    });
};

const getDateValue = (item) => item?.date || item?.ds || item?.day || item?.bookingDate;

const getActualValue = (item) => item?.revenue ?? item?.actual ?? item?.y ?? item?.totalRevenue;

const getForecastValue = (item) => item?.yhat ?? item?.forecast ?? item?.revenue;

const getLowerValue = (item) => item?.yhatLower ?? item?.yhat_lower ?? item?.lower;

const getUpperValue = (item) => item?.yhatUpper ?? item?.yhat_upper ?? item?.upper;

const buildPath = (points) => points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

export default function RevenueForecastChart({ actuals = [], forecast = [] }) {
    const actualPoints = actuals
        .map((item) => ({
            date: getDateValue(item),
            value: Number(getActualValue(item))
        }))
        .filter((item) => item.date && Number.isFinite(item.value));

    const forecastPoints = forecast
        .map((item) => ({
            date: getDateValue(item),
            value: Number(getForecastValue(item)),
            lower: Number(getLowerValue(item)),
            upper: Number(getUpperValue(item))
        }))
        .filter((item) => item.date && Number.isFinite(item.value));

    const series = [...actualPoints, ...forecastPoints];

    if (series.length === 0) {
        return <Empty description="Chưa có dữ liệu doanh thu để hiển thị." />;
    }

    const values = series.flatMap((item) => {
        const interval = forecastPoints.find((point) => point.date === item.date);
        return [
            item.value,
            interval?.lower,
            interval?.upper
        ].filter(Number.isFinite);
    });

    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(...values);
    const valueRange = Math.max(maxValue - minValue, 1);
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const xStep = series.length > 1 ? innerWidth / (series.length - 1) : innerWidth;

    const xForIndex = (index) => padding.left + index * xStep;
    const yForValue = (value) => padding.top + innerHeight - ((value - minValue) / valueRange) * innerHeight;

    const actualSvgPoints = actualPoints.map((item, index) => ({
        ...item,
        x: xForIndex(index),
        y: yForValue(item.value)
    }));

    const forecastStartIndex = Math.max(actualPoints.length - 1, 0);
    const lastActual = actualPoints[actualPoints.length - 1];
    const forecastSeries = [
        ...(lastActual ? [{
            ...lastActual,
            lower: lastActual.value,
            upper: lastActual.value
        }] : []),
        ...forecastPoints
    ];

    const forecastSvgPoints = forecastSeries.map((item, index) => ({
        ...item,
        x: xForIndex(forecastStartIndex + index),
        y: yForValue(item.value),
        lowerY: yForValue(Number.isFinite(item.lower) ? item.lower : item.value),
        upperY: yForValue(Number.isFinite(item.upper) ? item.upper : item.value)
    }));

    const intervalPath = forecastSvgPoints.length > 1
        ? [
            ...forecastSvgPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.upperY}`),
            ...forecastSvgPoints.slice().reverse().map((point) => `L ${point.x} ${point.lowerY}`),
            "Z"
        ].join(" ")
        : "";

    const yTicks = Array.from({ length: 5 }, (_, index) => {
        const value = minValue + (valueRange / 4) * index;
        return {
            value,
            y: yForValue(value)
        };
    }).reverse();

    const labelIndexes = Array.from(
        new Set([
            0,
            Math.floor(series.length / 2),
            Math.max(series.length - 1, 0)
        ])
    );

    return (
        <div style={{ width: "100%", overflowX: "auto" }}>
            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label="Revenue forecast chart"
                style={{ width: "100%", minWidth: 680, display: "block" }}
            >
                <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#fff" />

                {yTicks.map((tick) => (
                    <g key={tick.value}>
                        <line
                            x1={padding.left}
                            x2={chartWidth - padding.right}
                            y1={tick.y}
                            y2={tick.y}
                            stroke="#f0f0f0"
                        />
                        <text
                            x={padding.left - 12}
                            y={tick.y + 4}
                            textAnchor="end"
                            fontSize="12"
                            fill="#8c8c8c"
                        >
                            {formatCurrency(tick.value)}
                        </text>
                    </g>
                ))}

                <line
                    x1={padding.left}
                    x2={chartWidth - padding.right}
                    y1={padding.top + innerHeight}
                    y2={padding.top + innerHeight}
                    stroke="#d9d9d9"
                />

                {intervalPath ? (
                    <path d={intervalPath} fill="#8b5cf6" opacity="0.14" />
                ) : null}

                <path
                    d={buildPath(actualSvgPoints)}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                <path
                    d={buildPath(forecastSvgPoints)}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="7 7"
                />

                {actualSvgPoints.map((point) => (
                    <circle key={`actual-${point.date}`} cx={point.x} cy={point.y} r="3" fill="#16a34a" />
                ))}

                {forecastSvgPoints.slice(1).map((point) => (
                    <circle key={`forecast-${point.date}`} cx={point.x} cy={point.y} r="3.5" fill="#7c3aed" />
                ))}

                {labelIndexes.map((index) => (
                    <text
                        key={series[index]?.date || index}
                        x={xForIndex(index)}
                        y={chartHeight - 14}
                        textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"}
                        fontSize="12"
                        fill="#8c8c8c"
                    >
                        {formatDate(series[index]?.date)}
                    </text>
                ))}
            </svg>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
                <Text>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: "#16a34a", borderRadius: 2, marginRight: 6 }} />
                    Doanh thu thực tế
                </Text>
                <Text>
                    <span style={{ display: "inline-block", width: 10, height: 10, background: "#7c3aed", borderRadius: 2, marginRight: 6 }} />
                    Dự báo
                </Text>
                <Text type="secondary">
                    <span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(124, 58, 237, 0.18)", borderRadius: 2, marginRight: 6 }} />
                    Khoảng tin cậy
                </Text>
            </div>
        </div>
    );
}
