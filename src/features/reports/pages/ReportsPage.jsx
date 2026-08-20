import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Row, Col, Typography, Button, Space, Select, DatePicker,
  Table, Tag, Spin, Segmented, message, Progress, Avatar, Tooltip, Empty
} from 'antd';
import {
  FileExcelOutlined, FilePdfOutlined, MailOutlined, ReloadOutlined,
  BarChartOutlined, DollarOutlined, TeamOutlined, AppstoreOutlined,
  ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, FireOutlined,
  CalendarOutlined, ShoppingOutlined, StarOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';
import dayjs from 'dayjs';
import { getReportDataApi, triggerWeeklyEmailApi } from '../api/reportApi';
import { getMyBranchesApi } from '@/features/branch/api/branchApi';
import { exportReportToExcel } from '../utils/excelReportGenerator';
import { exportReportToPdf } from '../utils/pdfReportGenerator';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import FeatureLockOverlay from '@/features/subscription/components/FeatureLockOverlay';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ─── Palette ─────────────────────────────────────────────────────────────────
const COLORS = {
  primary:   '#6366f1',
  success:   '#10b981',
  warning:   '#f59e0b',
  danger:    '#ef4444',
  teal:      '#14b8a6',
  pink:      '#ec4899',
  chart:     ['#6366f1','#10b981','#f59e0b','#ef4444','#14b8a6','#ec4899','#8b5cf6'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;
const fmtMoneyShort = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} tr`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}k`;
  return `${n}đ`;
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon, color, growth }) {
  const isUp   = growth > 0;
  const isDown = growth < 0;
  return (
    <Card
      style={{
        borderRadius: 16, border: 'none',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        boxShadow: `0 4px 20px ${color}20`,
        height: '100%'
      }}
      bodyStyle={{ padding: '16px 18px' }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 500, letterSpacing: 0.3 }}>{title}</Text>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', lineHeight: 1.2, margin: '4px 0 3px', wordBreak: 'break-all' }}>
            {value}
          </div>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>{sub}</Text>
          {growth !== undefined && growth !== null && (
            <div style={{ marginTop: 6 }}>
              <Tag
                color={isUp ? 'success' : isDown ? 'error' : 'default'}
                icon={isUp ? <ArrowUpOutlined /> : isDown ? <ArrowDownOutlined /> : null}
                style={{ fontWeight: 600, fontSize: 11, borderRadius: 6 }}
              >
                {isUp ? '+' : ''}{growth?.toFixed(1)}% so với cùng kỳ
              </Tag>
            </div>
          )}
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 20, flexShrink: 0,
          boxShadow: `0 4px 12px ${color}50`
        }}>
          {icon}
        </div>
      </Space>
    </Card>
  );
}

// ─── Custom Tooltip cho Recharts ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '10px 16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
    }}>
      <Text strong style={{ fontSize: 13, color: '#374151' }}>{label}</Text>
      {payload.map((p, i) => (
        <div key={i} style={{ marginTop: 4 }}>
          <Text style={{ color: p.color, fontSize: 12 }}>{p.name}: </Text>
          <Text strong style={{ fontSize: 12 }}>
            {p.name?.includes('Đơn') ? `${p.value} đơn` : fmtMoney(p.value)}
          </Text>
        </div>
      ))}
    </div>
  );
};

// ─── Revenue Chart ─────────────────────────────────────────────────────────────
function RevenueChart({ data }) {
  if (!data?.length) return (
    <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Empty description="Chưa có dữ liệu biểu đồ" />
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={COLORS.teal} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={fmtMoneyShort}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false} tickLine={false} width={50}
        />
        <ReTooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#475569' }}>{value}</span>}
        />
        <Area
          type="monotone" dataKey="currentRevenue" name="Doanh thu kỳ này"
          stroke={COLORS.primary} strokeWidth={2.5}
          fill="url(#colorRevenue)" dot={{ fill: COLORS.primary, r: 3 }}
        />
        {data.some(d => d.previousYearRevenue > 0) && (
          <Area
            type="monotone" dataKey="previousYearRevenue" name="Cùng kỳ năm ngoái"
            stroke={COLORS.teal} strokeWidth={1.5} strokeDasharray="5 3"
            fill="url(#colorPrev)" dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Booking Bar Chart ─────────────────────────────────────────────────────────
function BookingBarChart({ data }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
        <ReTooltip content={<CustomTooltip />} />
        <Bar dataKey="bookingCount" name="Số đơn" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.isPeakPeriod ? COLORS.warning : COLORS.primary} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Service Pie Chart ─────────────────────────────────────────────────────────
function ServicePieChart({ data }) {
  if (!data?.length) return <Empty description="Chưa có dữ liệu" style={{ padding: 40 }} />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data} dataKey="revenue" nameKey="serviceName"
          cx="50%" cy="50%" outerRadius={80} innerRadius={40}
          paddingAngle={3}
          label={({ name, percentage }) => `${name} (${percentage?.toFixed(0)}%)`}
          labelLine={{ stroke: '#94a3b8' }}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS.chart[i % COLORS.chart.length]} />)}
        </Pie>
        <ReTooltip formatter={(v) => fmtMoney(v)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { features } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [reportType, setReportType] = useState('doanh_thu');
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    getMyBranchesApi()
      .then((res) => setBranches(res || []))
      .catch((err) => console.error('Lỗi lấy chi nhánh:', err));
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const effectiveRange = (dateRange?.[0] && dateRange?.[1])
        ? dateRange : [dayjs().subtract(30, 'day'), dayjs()];
      const res = await getReportDataApi({
        reportType,
        from: effectiveRange[0].format('YYYY-MM-DD'),
        to:   effectiveRange[1].format('YYYY-MM-DD'),
        branchId: selectedBranchId,
      });
      setReportData(res);
    } catch (err) {
      console.error('Lỗi báo cáo:', err);
      message.error('Không thể tải dữ liệu báo cáo!');
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, selectedBranchId]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const handleExportExcel = async () => {
    try {
      const effectiveRange = dateRange?.[0] ? dateRange : [dayjs().subtract(30, 'day'), dayjs()];
      message.loading({ content: 'Đang tạo file Excel...', key: 'excel' });
      await exportReportToExcel({
        reportType, fromDate: effectiveRange[0].format('DD/MM/YYYY'),
        toDate: effectiveRange[1].format('DD/MM/YYYY'),
        data: reportData, salonName: 'SalonFlow',
      });
      message.success({ content: 'Xuất file Excel thành công!', key: 'excel' });
    } catch { message.error({ content: 'Lỗi xuất Excel!', key: 'excel' }); }
  };

  const handleExportPdf = async () => {
    try {
      message.loading({ content: 'Đang tạo PDF...', key: 'pdf' });
      await exportReportToPdf('printable-report-area', `BaoCao_${reportType}_${dayjs().format('YYYY-MM-DD')}.pdf`);
      message.success({ content: 'Xuất PDF thành công!', key: 'pdf' });
    } catch { message.error({ content: 'Lỗi xuất PDF!', key: 'pdf' }); }
  };

  const handleTriggerEmail = async () => {
    setEmailLoading(true);
    try {
      const res = await triggerWeeklyEmailApi();
      message.success(res.message || 'Đã kích hoạt gửi Email Báo Cáo Tuần!');
    } catch { message.error('Không thể gửi email báo cáo!'); }
    finally { setEmailLoading(false); }
  };

  // ── Computed data ──────────────────────────────────────────────────────────
  const details        = reportData?.details || {};
  const timeline       = details?.timeline || [];
  const serviceList    = details?.serviceBreakdown || [];
  const staffList      = details?.staffPerformanceList || [];
  const top3           = details?.top3Performers || [];
  const peakPeriod     = details?.peakPeriod || null;
  const totalRevenue   = details?.totalRevenue;
  const yoyRate        = details?.overallYoYGrowthRate;
  const totalBookings  = timeline.reduce((s, d) => s + (d.bookingCount || 0), 0);
  const avgPerBooking  = totalBookings > 0 ? (Number(totalRevenue) / totalBookings) : 0;
  const peakLabel      = peakPeriod?.label ||
    (timeline.reduce((p, c) => (Number(c.currentRevenue) > Number(p?.currentRevenue || 0) ? c : p), null)?.label);
  const effectiveFrom  = (dateRange?.[0] ?? dayjs().subtract(30, 'day')).format('DD/MM/YYYY');
  const effectiveTo    = (dateRange?.[1] ?? dayjs()).format('DD/MM/YYYY');

  // ── Revenue table columns ──────────────────────────────────────────────────
  const revenueColumns = [
    {
      title: '#', width: 50,
      render: (_, __, i) => <Text style={{ color: '#94a3b8', fontWeight: 600 }}>{i + 1}</Text>
    },
    {
      title: 'Thời gian', dataIndex: 'label', key: 'label',
      render: (t, r) => (
        <Space>
          {r.isPeakPeriod && <FireOutlined style={{ color: COLORS.warning }} />}
          <Text strong>{t}</Text>
          {r.isPeakPeriod && <Tag color="orange" style={{ fontSize: 10 }}>Đỉnh</Tag>}
        </Space>
      )
    },
    {
      title: 'Số đơn', dataIndex: 'bookingCount', key: 'bookingCount', align: 'center',
      render: (v) => <Tag color="blue" style={{ fontWeight: 600 }}>{(v || 0).toLocaleString()} đơn</Tag>
    },
    {
      title: 'Doanh thu', dataIndex: 'currentRevenue', key: 'currentRevenue', align: 'right',
      sorter: (a, b) => (Number(a.currentRevenue) || 0) - (Number(b.currentRevenue) || 0),
      render: (v) => <Text strong style={{ color: COLORS.primary, fontSize: 14 }}>{fmtMoney(v)}</Text>
    },
    {
      title: 'Tăng trưởng YoY', dataIndex: 'yoyGrowthRate', key: 'yoyGrowthRate', align: 'center',
      render: (v) => {
        if (v === null || v === undefined) return <Text type="secondary">-</Text>;
        return (
          <Tag
            color={v > 0 ? 'success' : v < 0 ? 'error' : 'default'}
            icon={v > 0 ? <ArrowUpOutlined /> : v < 0 ? <ArrowDownOutlined /> : null}
            style={{ fontWeight: 600 }}
          >
            {v > 0 ? '+' : ''}{v.toFixed(1)}%
          </Tag>
        );
      }
    },
    {
      title: 'Tỷ trọng', key: 'share', align: 'center',
      render: (_, r) => {
        const total = timeline.reduce((s, d) => s + Number(d.currentRevenue || 0), 0);
        const pct   = total > 0 ? (Number(r.currentRevenue || 0) / total * 100) : 0;
        return (
          <div style={{ minWidth: 80 }}>
            <Progress percent={Math.round(pct)} size="small" strokeColor={COLORS.primary} showInfo={false} />
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>{pct.toFixed(1)}%</Text>
          </div>
        );
      }
    },
  ];

  // ── Staff table columns ────────────────────────────────────────────────────
  const staffColumns = [
    {
      title: 'Hạng', dataIndex: 'overallRank', key: 'rank', width: 60, align: 'center',
      render: (r) => {
        const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
        return medals[r] ? (
          <span style={{ fontSize: 20 }}>{medals[r]}</span>
        ) : <Tag color="default">#{r || '-'}</Tag>;
      }
    },
    {
      title: 'Nhân viên', dataIndex: 'staffName', key: 'staffName',
      render: (name, r) => (
        <Space>
          <Avatar src={r.avatarUrl} style={{ background: COLORS.primary }} size={36}>
            {name?.[0]}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>{name}</Text>
            <div><Text type="secondary" style={{ fontSize: 11 }}>{r.branchName}</Text></div>
          </div>
        </Space>
      )
    },
    {
      title: 'Đơn hoàn thành', dataIndex: 'completedBookings', key: 'completedBookings', align: 'center',
      render: (v) => <Tag color="green" style={{ fontWeight: 600 }}>{v || 0} đơn</Tag>
    },
    {
      title: 'Doanh thu', dataIndex: 'totalRevenue', key: 'totalRevenue', align: 'right',
      sorter: (a, b) => (Number(a.totalRevenue) || 0) - (Number(b.totalRevenue) || 0),
      render: (v) => <Text strong style={{ color: COLORS.primary }}>{fmtMoney(v)}</Text>
    },
    {
      title: 'Đánh giá', dataIndex: 'avgRating', key: 'avgRating', align: 'center',
      render: (v) => v ? (
        <Tag color="gold" icon={<StarOutlined />} style={{ fontWeight: 700 }}>
          {Number(v).toFixed(1)} / 5.0
        </Tag>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Lấp đầy slot', dataIndex: 'slotOccupancyRate', key: 'slotOccupancyRate',
      render: (v) => (
        <div style={{ minWidth: 90 }}>
          <Progress
            percent={Math.round(v || 0)} size="small"
            strokeColor={v > 70 ? COLORS.success : v > 40 ? COLORS.warning : COLORS.danger}
            showInfo={false}
          />
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>{(v || 0).toFixed(0)}%</Text>
        </div>
      )
    },
  ];

  // ── Service table columns ──────────────────────────────────────────────────
  const serviceColumns = [
    { title: '#', width: 50, render: (_, __, i) => <Text style={{ color: '#94a3b8', fontWeight: 600 }}>{i + 1}</Text> },
    {
      title: 'Dịch vụ', dataIndex: 'serviceName', key: 'serviceName',
      render: (name, r) => (
        <div>
          <Text strong>{name || r.categoryName}</Text>
          {r.categoryName && name && <div><Text type="secondary" style={{ fontSize: 11 }}>{r.categoryName}</Text></div>}
        </div>
      )
    },
    {
      title: 'Lượt sử dụng', dataIndex: 'itemCount', key: 'itemCount', align: 'center',
      render: (v) => <Tag color="blue" style={{ fontWeight: 600 }}>{(v || 0).toLocaleString()} lượt</Tag>
    },
    {
      title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', align: 'right',
      sorter: (a, b) => (Number(a.revenue) || 0) - (Number(b.revenue) || 0),
      render: (v) => <Text strong style={{ color: COLORS.primary }}>{fmtMoney(v)}</Text>
    },
    {
      title: 'Tỷ trọng', dataIndex: 'percentage', key: 'percentage',
      render: (v) => (
        <div style={{ minWidth: 100 }}>
          <Progress percent={Math.round(v || 0)} size="small" strokeColor={COLORS.success} showInfo={false} trailColor="#f1f5f9" />
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>{(v || 0).toFixed(1)}%</Text>
        </div>
      )
    },
  ];

  const getColumns    = () => reportType === 'nhan_vien' ? staffColumns : reportType === 'dich_vu' ? serviceColumns : revenueColumns;
  const getDataSource = () => reportType === 'nhan_vien' ? staffList    : reportType === 'dich_vu' ? serviceList    : timeline;

  return (
    <FeatureLockOverlay
      allowed={features?.analyticsAdvanced}
      requiredPlan="PRO"
      description="Nâng cấp gói PRO để mở khoá xuất báo cáo Excel/PDF và phân tích nâng cao."
    >
      <div style={{ padding: '16px', background: '#f8faff', minHeight: '100vh' }}>

        {/* HEADER */}
        <div style={{ marginBottom: 16 }}>
          <Space align="center" size={12}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, #818cf8 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px ${COLORS.primary}40`, flexShrink: 0
            }}>
              <BarChartOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#1e293b', fontSize: 18 }}>
                Báo Cáo &amp; Thống Kê
              </Title>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                {effectiveFrom} — {effectiveTo}
              </Text>
            </div>
          </Space>
        </div>

        {/* TOOLBAR */}
        <Card
          style={{ borderRadius: 16, border: '1px solid #e8edf5', marginBottom: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Row gutter={[10, 10]}>
            {/* Dòng 1: Loại báo cáo */}
            <Col xs={24}>
              <Segmented
                options={[
                  { label: 'Doanh thu', value: 'doanh_thu', icon: <DollarOutlined /> },
                  { label: 'Nhân viên', value: 'nhan_vien', icon: <TeamOutlined /> },
                  { label: 'Dịch vụ',   value: 'dich_vu',   icon: <AppstoreOutlined /> },
                ]}
                value={reportType}
                onChange={setReportType}
                size="middle"
                style={{ width: '100%' }}
              />
            </Col>

            {/* Dòng 2: Bộ lọc ngày & chi nhánh */}
            <Col xs={24} sm={14} md={12}>
              <RangePicker
                value={dateRange}
                onChange={(v) => setDateRange(v || [dayjs().subtract(30, 'day'), dayjs()])}
                size="middle"
                style={{ borderRadius: 8, width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={10} md={8}>
              <Select
                placeholder="Tất cả chi nhánh" value={selectedBranchId}
                onChange={setSelectedBranchId} allowClear
                style={{ width: '100%' }} size="middle"
              >
                {branches.map((b) => <Option key={b.id} value={b.id}>{b.name}</Option>)}
              </Select>
            </Col>
            <Col xs={24} md={4}>
              <Button icon={<ReloadOutlined />} onClick={fetchReportData} size="middle" style={{ borderRadius: 8, width: '100%' }}>
                Tải lại
              </Button>
            </Col>

            {/* Dòng 3: Nút xuất */}
            <Col xs={24}>
              <Space wrap size={8}>
                <Button
                  icon={<FileExcelOutlined />} onClick={handleExportExcel}
                  style={{ background: '#059669', borderColor: '#059669', color: '#fff', borderRadius: 8, fontWeight: 600 }}
                >
                  Xuất Excel
                </Button>
                <Button
                  icon={<FilePdfOutlined />} onClick={handleExportPdf}
                  style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff', borderRadius: 8, fontWeight: 600 }}
                >
                  Xuất PDF
                </Button>
                <Tooltip title="Kích hoạt gửi email báo cáo tuần vào Thứ 2, 8:00 SA">
                  <Button
                    icon={<MailOutlined />} loading={emailLoading} onClick={handleTriggerEmail}
                    style={{ borderColor: COLORS.primary, color: COLORS.primary, borderRadius: 8, fontWeight: 600 }}
                  >
                    Email tuần
                  </Button>
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" tip="Đang phân tích dữ liệu..." />
          </div>
        ) : (
          <div id="printable-report-area">

            {/* KPI CARDS - Doanh thu */}
            {reportType === 'doanh_thu' && (
              <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                <Col xs={12} sm={12} lg={6}>
                  <KpiCard
                    title="Tổng doanh thu"
                    value={fmtMoney(totalRevenue)}
                    sub={`${timeline.length} kỳ thống kê`}
                    icon={<DollarOutlined />}
                    color={COLORS.primary}
                    growth={yoyRate}
                  />
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <KpiCard
                    title="Tổng số đơn"
                    value={(totalBookings || 0).toLocaleString()}
                    sub="Đơn hàng hoàn thành"
                    icon={<ShoppingOutlined />}
                    color={COLORS.success}
                  />
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <KpiCard
                    title="Trung bình / đơn"
                    value={fmtMoney(avgPerBooking)}
                    sub="Giá trị trung bình mỗi đơn"
                    icon={<ThunderboltOutlined />}
                    color={COLORS.warning}
                  />
                </Col>
                <Col xs={12} sm={12} lg={6}>
                  <KpiCard
                    title="Mốc doanh thu cao nhất"
                    value={peakLabel || '-'}
                    sub={peakPeriod?.revenue ? fmtMoney(peakPeriod.revenue) : 'Đỉnh điểm'}
                    icon={<TrophyOutlined />}
                    color={COLORS.pink}
                  />
                </Col>
              </Row>
            )}

            {/* STAFF KPI */}
            {reportType === 'nhan_vien' && top3.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                {top3.map((s, i) => (
                  <Col xs={24} sm={8} key={s.staffId}>
                    <KpiCard
                      title={['Nhân viên xuất sắc', 'Á quân', 'Hạng ba'][i]}
                      value={s.staffName}
                      sub={`${fmtMoney(s.totalRevenue)} · ${s.completedBookings} đơn`}
                      icon={<TrophyOutlined />}
                      color={[COLORS.warning, '#94a3b8', '#b45309'][i]}
                    />
                  </Col>
                ))}
              </Row>
            )}

            {/* CHARTS - Doanh thu */}
            {reportType === 'doanh_thu' && timeline.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                <Col xs={24} lg={15}>
                  <Card
                    title={<Space><span style={{ color: COLORS.primary }}>📈</span><Text strong>Xu hướng doanh thu theo thời gian</Text></Space>}
                    style={{ borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    bodyStyle={{ padding: '12px' }}
                  >
                    <RevenueChart data={timeline} />
                  </Card>
                </Col>
                <Col xs={24} lg={9}>
                  <Card
                    title={<Space><span>📊</span><Text strong>Số đơn theo kỳ</Text></Space>}
                    style={{ borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    bodyStyle={{ padding: '12px' }}
                  >
                    <BookingBarChart data={timeline} />
                    {peakPeriod && (
                      <div style={{
                        marginTop: 12, padding: '10px 14px', borderRadius: 10,
                        background: `${COLORS.warning}15`, border: `1px solid ${COLORS.warning}30`
                      }}>
                        <Space>
                          <FireOutlined style={{ color: COLORS.warning }} />
                          <Text style={{ fontSize: 12 }}>
                            <strong>Đỉnh:</strong> {peakPeriod.label} -{' '}
                            <strong style={{ color: COLORS.primary }}>{fmtMoney(peakPeriod.revenue)}</strong>
                            {' '}({peakPeriod.bookingCount} đơn)
                          </Text>
                        </Space>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            )}

            {/* CHARTS - Dịch vụ */}
            {reportType === 'dich_vu' && serviceList.length > 0 && (
              <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                <Col xs={24} lg={10}>
                  <Card
                    title={<Text strong>Phân bổ doanh thu theo dịch vụ</Text>}
                    style={{ borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    bodyStyle={{ padding: '12px 16px' }}
                  >
                    <ServicePieChart data={serviceList} />
                  </Card>
                </Col>
                <Col xs={24} lg={14}>
                  <Card
                    title={<Text strong>Top dịch vụ theo doanh thu</Text>}
                    style={{ borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    bodyStyle={{ padding: '12px 16px' }}
                  >
                    {serviceList.slice(0, 5).map((s, i) => (
                      <div key={s.serviceId || i} style={{ marginBottom: 12 }}>
                        <Row justify="space-between" style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: 13 }}>
                            <span style={{ color: COLORS.chart[i], fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
                            {s.serviceName || s.categoryName}
                          </Text>
                          <Text strong style={{ color: COLORS.primary, fontSize: 13 }}>{fmtMoney(s.revenue)}</Text>
                        </Row>
                        <Progress
                          percent={Math.round(s.percentage || 0)}
                          strokeColor={COLORS.chart[i]}
                          size="small" showInfo={false} trailColor="#f1f5f9"
                        />
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>
            )}

            {/* DATA TABLE */}
            <Card
              title={
                <Space wrap>
                  <span>📋</span>
                  <Text strong>
                    {reportType === 'nhan_vien' ? 'Chi tiết hiệu suất nhân viên' :
                     reportType === 'dich_vu'   ? 'Chi tiết doanh thu dịch vụ'   :
                                                   'Bảng số liệu doanh thu'}
                  </Text>
                  <Tag color="blue">{getDataSource().length} dòng</Tag>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {effectiveFrom} — {effectiveTo}
                </Text>
              }
              style={{ borderRadius: 16, border: '1px solid #e8edf5', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={getDataSource()}
                columns={getColumns()}
                rowKey={(r, i) => r.staffId || r.serviceId || r.label || i}
                pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `Tổng ${t} dòng` }}
                scroll={{ x: 'max-content' }}
                rowClassName={(r) => r.isPeakPeriod ? 'peak-row' : ''}
                style={{ borderRadius: '0 0 16px 16px', overflow: 'hidden' }}
                size="middle"
              />
            </Card>
          </div>
        )}

        <style>{`
          .peak-row td { background: #fffbeb !important; }
          .peak-row:hover td { background: #fef3c7 !important; }
          @media (max-width: 576px) {
            .ant-card-head { padding: 0 12px; }
            .ant-card-body { padding: 12px !important; }
            .ant-table { font-size: 12px; }
            .ant-tag { font-size: 10px; padding: 0 4px; }
            .ant-segmented-item-label { font-size: 12px; padding: 0 6px; }
          }
        `}</style>
      </div>
    </FeatureLockOverlay>
  );
}
