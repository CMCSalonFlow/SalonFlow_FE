import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Button, Space, Tag, Spin, Alert, Table, Select, DatePicker, Avatar, Progress, Tooltip, Badge } from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  WarningOutlined,
  StarFilled,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DashboardOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getStaffPerformanceReportApi } from '../api/analyticsApi';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function StaffPerformanceReportTab({ selectedBranchId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [dateRange, setDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let fromStr = null;
      let toStr = null;
      if (period === 'custom' && dateRange && dateRange[0] && dateRange[1]) {
        fromStr = dateRange[0].format('YYYY-MM-DD');
        toStr = dateRange[1].format('YYYY-MM-DD');
      }

      const res = await getStaffPerformanceReportApi({
        period,
        from: fromStr,
        to: toStr,
        branchId: selectedBranchId
      });
      setData(res);
    } catch (err) {
      console.error("Lỗi khi tải báo cáo hiệu suất nhân viên:", err);
    } finally {
      setLoading(false);
    }
  }, [period, dateRange, selectedBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Đang tổng hợp dữ liệu Báo cáo Hiệu suất Nhân viên..." />
      </Card>
    );
  }

  const top3List = data?.top3Performers || [];
  const warnings = data?.lowRatingWarnings || [];
  const staffList = data?.staffPerformanceList || [];

  const filteredStaffList = staffList.filter(staff =>
    staff.staffName?.toLowerCase().includes(searchText.toLowerCase()) ||
    staff.branchName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Define Table Columns
  const columns = [
    {
      title: 'Hạng',
      dataIndex: 'overallRank',
      key: 'overallRank',
      width: 80,
      sorter: (a, b) => a.overallRank - b.overallRank,
      render: (rank) => {
        if (rank === 1) return <Badge count="🥇 #1" style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 8px' }} />;
        if (rank === 2) return <Badge count="🥈 #2" style={{ backgroundColor: '#94a3b8', color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 8px' }} />;
        if (rank === 3) return <Badge count="🥉 #3" style={{ backgroundColor: '#b45309', color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 8px' }} />;
        return <Tag color="blue" style={{ fontWeight: 600 }}>#{rank}</Tag>;
      }
    },
    {
      title: 'Nhân viên',
      dataIndex: 'staffName',
      key: 'staffName',
      sorter: (a, b) => a.staffName.localeCompare(b.staffName),
      render: (_, record) => (
        <Space size="middle">
          <Avatar
            src={record.avatarUrl}
            icon={<UserOutlined />}
            size={42}
            style={{ backgroundColor: '#6366f1' }}
          />
          <div>
            <Text strong style={{ fontSize: 15, display: 'block' }}>{record.staffName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.branchName} {record.specialties ? `• ${record.specialties}` : ''}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Lịch hẹn hoàn thành',
      dataIndex: 'completedBookings',
      key: 'completedBookings',
      sorter: (a, b) => a.completedBookings - b.completedBookings,
      render: (val, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 15, color: '#10b981' }}>
            <CheckCircleOutlined style={{ marginRight: 6 }} />
            {val} lịch
          </Text>
          <Tag color="green" style={{ fontSize: 11 }}>Hạng doanh số #{record.bookingRank}</Tag>
        </Space>
      )
    },
    {
      title: 'Doanh thu cá nhân',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
      render: (val, record) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 16, color: '#4f46e5' }}>
            {Number(val || 0).toLocaleString('vi-VN')} đ
          </Text>
          <Tag color="purple" style={{ fontSize: 11 }}>Hạng doanh thu #{record.revenueRank}</Tag>
        </Space>
      )
    },
    {
      title: 'Đánh giá Rating',
      dataIndex: 'avgRating',
      key: 'avgRating',
      sorter: (a, b) => a.avgRating - b.avgRating,
      render: (val, record) => {
        const isLow = val < 3.5;
        return (
          <Space direction="vertical" size={2}>
            <Space size={4}>
              <StarFilled style={{ color: isLow ? '#ef4444' : '#f59e0b', fontSize: 16 }} />
              <Text strong style={{ fontSize: 15, color: isLow ? '#ef4444' : '#1e293b' }}>
                {val} / 5.0
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({record.totalReviewsCount} review)
              </Text>
            </Space>
            <Tag color={isLow ? 'error' : 'warning'} style={{ fontSize: 11 }}>
              Hạng rating #{record.ratingRank}
            </Tag>
          </Space>
        );
      }
    },
    {
      title: 'Tỉ lệ Slot lấp đầy (Slot Full)',
      dataIndex: 'slotOccupancyRate',
      key: 'slotOccupancyRate',
      sorter: (a, b) => a.slotOccupancyRate - b.slotOccupancyRate,
      render: (rate, record) => (
        <div style={{ width: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: 600 }}>{rate}%</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.bookedSlotsCount}/{record.totalAvailableSlots} slot</Text>
          </div>
          <Progress
            percent={rate}
            showInfo={false}
            strokeColor={rate > 80 ? '#10b981' : rate > 50 ? '#6366f1' : '#f59e0b'}
            size="small"
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* FILTER CONTROLS BAR */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space align="center" size="middle">
              <div style={{ background: '#e0e7ff', padding: '10px 12px', borderRadius: 12, color: '#4f46e5' }}>
                <TrophyOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  Báo Cáo Hiệu Suất Nhân Viên
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Theo dõi doanh thu, tổng lịch hẹn hoàn thành, rating đánh giá và tỉ lệ full slot làm việc
                </Text>
              </div>
            </Space>
          </Col>

          <Col>
            <Space wrap size="middle">
              <Select
                value={period}
                onChange={(val) => setPeriod(val)}
                style={{ width: 160, borderRadius: 8 }}
                size="large"
              >
                <Option value="this_month">📅 Tháng này</Option>
                <Option value="last_month">🗓️ Tháng trước</Option>
                <Option value="last_30_days">⏳ 30 ngày qua</Option>
                <Option value="custom">🛠️ Tùy chọn ngày</Option>
              </Select>

              {period === 'custom' && (
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  style={{ borderRadius: 8 }}
                  size="large"
                />
              )}

              <Button
                type="primary"
                ghost
                icon={<ReloadOutlined />}
                size="large"
                style={{ borderRadius: 8 }}
                onClick={fetchData}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* RATING WARNING ALERT BANNER */}
      {warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined style={{ fontSize: 20 }} />}
          style={{ borderRadius: 12, border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}
          message={
            <Text strong style={{ fontSize: 15, color: '#b45309' }}>
              ⚠️ CẢNH BÁO CHẤT LƯỢNG: Có {warnings.length} nhân viên có điểm đánh giá trung bình &lt; 3.5 trong 30 ngày qua
            </Text>
          }
          description={
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {warnings.map((w) => (
                <div key={w.staffId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Badge status="error" />
                  <Text style={{ fontSize: 13, color: '#78350f' }}>
                    {w.warningMessage}
                  </Text>
                </div>
              ))}
            </div>
          }
        />
      )}

      {/* TOP 3 PERFORMERS LEADERBOARD PODIUM */}
      <div>
        <Title level={4} style={{ marginBottom: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CrownOutlined style={{ color: '#f59e0b' }} /> Top 3 Nhân Viên Xuất Sắc Nhất
        </Title>
        <Row gutter={[20, 20]}>
          {top3List.map((staff, idx) => {
            const colors = [
              { bg: 'linear-gradient(135deg, #fef3c7 0%, #fff 100%)', border: '#fde047', badge: '🥇 Hạng 1 (Gold)', iconColor: '#f59e0b' },
              { bg: 'linear-gradient(135deg, #f1f5f9 0%, #fff 100%)', border: '#cbd5e1', badge: '🥈 Hạng 2 (Silver)', iconColor: '#64748b' },
              { bg: 'linear-gradient(135deg, #ffedd5 0%, #fff 100%)', border: '#fed7aa', badge: '🥉 Hạng 3 (Bronze)', iconColor: '#d97706' }
            ];
            const theme = colors[idx] || colors[0];

            return (
              <Col xs={24} sm={12} md={8} key={staff.staffId}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    background: theme.bg,
                    borderColor: theme.border,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Tag
                    color={idx === 0 ? 'gold' : idx === 1 ? 'default' : 'orange'}
                    style={{ position: 'absolute', top: 12, right: 12, borderRadius: 8, fontWeight: 700, padding: '2px 10px' }}
                  >
                    {theme.badge}
                  </Tag>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <Avatar
                      src={staff.avatarUrl}
                      icon={<UserOutlined />}
                      size={54}
                      style={{ border: `2px solid ${theme.iconColor}`, backgroundColor: '#4f46e5' }}
                    />
                    <div>
                      <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                        {staff.staffName}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {staff.branchName}
                      </Text>
                    </div>
                  </div>

                  <Row gutter={[12, 12]} style={{ background: '#ffffffcc', padding: 12, borderRadius: 12 }}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Doanh thu</Text>
                      <Text strong style={{ fontSize: 14, color: '#4f46e5' }}>
                        {Number(staff.totalRevenue || 0).toLocaleString('vi-VN')} đ
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Lịch hoàn thành</Text>
                      <Text strong style={{ fontSize: 14, color: '#10b981' }}>
                        {staff.completedBookings} đơn
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Rating</Text>
                      <Text strong style={{ fontSize: 14, color: '#f59e0b' }}>
                        ⭐ {staff.avgRating} / 5.0
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Tỉ lệ slot full</Text>
                      <Text strong style={{ fontSize: 14, color: '#6366f1' }}>
                        ⚡ {staff.slotOccupancyRate}%
                      </Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* MAIN DATA TABLE FOR ALL STAFF */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            📊 Bảng Chi Tiết Hiệu Suất & Xếp Hạng Nhân Viên
          </Title>

          <input
            placeholder="🔍 Tìm theo tên nhân viên..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
              width: 240,
              fontSize: 14
            }}
          />
        </div>

        <Table
          dataSource={filteredStaffList}
          columns={columns}
          rowKey="staffId"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          loading={loading}
          bordered={false}
        />
      </Card>
    </div>
  );
}
