import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Button, Space, Select, DatePicker, Table, Tag, Spin, Alert, Segmented, message, Divider } from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  MailOutlined,
  ReloadOutlined,
  CalendarOutlined,
  LineChartOutlined,
  TeamOutlined,
  ScissorOutlined,
  PrinterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getReportDataApi, triggerWeeklyEmailApi } from '../api/reportApi';
import { getMyBranchesApi } from '@/features/branch/api/branchApi';
import { exportReportToExcel } from '../utils/excelReportGenerator';
import { exportReportToPdf } from '../utils/pdfReportGenerator';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [reportType, setReportType] = useState('doanh_thu');
  const [dateRange, setDateRange] = useState([dayjs().minus(30, 'day'), dayjs()]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Fetch branches
  useEffect(() => {
    getMyBranchesApi()
      .then((res) => setBranches(res || []))
      .catch((err) => console.error("Lỗi lấy danh sách chi nhánh:", err));
  }, []);

  // Fetch Report Data
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const fromStr = dateRange && dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null;
      const toStr = dateRange && dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null;

      const res = await getReportDataApi({
        reportType,
        from: fromStr,
        to: toStr,
        branchId: selectedBranchId
      });
      setReportData(res);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu báo cáo:", err);
      message.error("Không thể tải dữ liệu báo cáo!");
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, selectedBranchId]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Handle Export Excel
  const handleExportExcel = async () => {
    try {
      message.loading({ content: 'Đang khởi tạo file ExcelJS...', key: 'excel' });
      await exportReportToExcel({
        reportType,
        fromDate: dateRange && dateRange[0] ? dateRange[0].format('DD/MM/YYYY') : '',
        toDate: dateRange && dateRange[1] ? dateRange[1].format('DD/MM/YYYY') : '',
        data: reportData,
        salonName: 'SalonFlow'
      });
      message.success({ content: 'Đã xuất file Excel thành công!', key: 'excel' });
    } catch (err) {
      console.error("Lỗi xuất file Excel:", err);
      message.error({ content: 'Lỗi khi xuất file Excel!', key: 'excel' });
    }
  };

  // Handle Export PDF
  const handleExportPdf = async () => {
    try {
      message.loading({ content: 'Đang tạo file PDF...', key: 'pdf' });
      await exportReportToPdf('printable-report-area', `Bao_Cao_${reportType}_SalonFlow_${dayjs().format('YYYY-MM-DD')}.pdf`);
      message.success({ content: 'Đã xuất file PDF thành công!', key: 'pdf' });
    } catch (err) {
      console.error("Lỗi xuất PDF:", err);
      message.error({ content: 'Lỗi khi tạo file PDF!', key: 'pdf' });
    }
  };

  // Trigger Weekly Email
  const handleTriggerEmail = async () => {
    setEmailLoading(true);
    try {
      const res = await triggerWeeklyEmailApi();
      message.success(res.message || "Đã kích hoạt gửi Email Báo Cáo Tuần 8h sáng thứ 2 thành công!");
    } catch (err) {
      console.error("Lỗi gửi email:", err);
      message.error("Lỗi khi gửi email thử nghiệm!");
    } finally {
      setEmailLoading(false);
    }
  };

  // Define Dynamic Table Columns for Live Preview
  const getTableColumns = () => {
    if (reportType === 'nhan_vien') {
      return [
        { title: 'Hạng', dataIndex: 'overallRank', key: 'overallRank', width: 70, render: (r) => <Tag color="blue">#{r || 1}</Tag> },
        { title: 'Nhân viên', dataIndex: 'staffName', key: 'staffName', render: (t, r) => <div><Text strong>{t}</Text><br/><Text type="secondary" style={{ fontSize: 11 }}>{r.branchName}</Text></div> },
        { title: 'Lịch hoàn thành', dataIndex: 'completedBookings', key: 'completedBookings', render: (v) => <Tag color="green">{v} đơn</Tag> },
        { title: 'Doanh thu cá nhân', dataIndex: 'totalRevenue', key: 'totalRevenue', render: (v) => <Text strong style={{ color: '#4f46e5' }}>{Number(v || 0).toLocaleString('vi-VN')} đ</Text> },
        { title: 'Rating', dataIndex: 'avgRating', key: 'avgRating', render: (v) => <Text style={{ color: '#f59e0b', fontWeight: 600 }}>⭐ {v} / 5.0</Text> }
      ];
    }
    if (reportType === 'dich_vu') {
      return [
        { title: '#', render: (_, __, i) => i + 1, width: 60 },
        { title: 'Tên Dịch Vụ / Danh Mục', dataIndex: 'categoryName', key: 'categoryName', render: (t, r) => <Text strong>{r.serviceName || t || 'Dịch vụ Salon'}</Text> },
        { title: 'Số lượt đặt', dataIndex: 'bookingCount', key: 'bookingCount', render: (v) => <Tag color="blue">{v || 0} lượt</Tag> },
        { title: 'Doanh thu mang về', dataIndex: 'revenue', key: 'revenue', render: (v) => <Text strong style={{ color: '#4f46e5' }}>{Number(v || 0).toLocaleString('vi-VN')} đ</Text> },
        { title: 'Tỉ lệ đóng góp', dataIndex: 'percentage', key: 'percentage', render: (v) => <Tag color="purple">{v || 0}%</Tag> }
      ];
    }
    // Doanh thu
    return [
      { title: '#', render: (_, __, i) => i + 1, width: 60 },
      { title: 'Thời Gian', dataIndex: 'dateLabel', key: 'dateLabel', render: (t, r) => <Text strong>{t || r.periodLabel}</Text> },
      { title: 'Số Đơn Hàng', dataIndex: 'bookingCount', key: 'bookingCount', render: (v) => <Tag color="green">{v || 0} đơn</Tag> },
      { title: 'Doanh Thu', dataIndex: 'revenue', key: 'revenue', render: (v) => <Text strong style={{ color: '#4f46e5', fontSize: 15 }}>{Number(v || 0).toLocaleString('vi-VN')} đ</Text> },
      { title: 'Trạng Thái', render: () => <Tag color="success">Đã hoàn thành</Tag> }
    ];
  };

  const getDataSource = () => {
    if (!reportData || !reportData.details) return [];
    if (reportType === 'nhan_vien') return reportData.details.staffPerformanceList || [];
    if (reportType === 'dich_vu') return reportData.details.serviceBreakdown || [];
    return reportData.details.timeline || [];
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* CONTROL & FILTER CARD */}
      <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space align="center" size="middle">
              <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '12px 14px', borderRadius: 12, color: '#fff' }}>
                <LineChartOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                  Trung Tâm Xuất Báo Cáo SalonFlow
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Xuất dữ liệu Excel/PDF theo khoảng thời gian tùy chọn & Cấu hình gửi Email định kỳ 8:00 AM Thứ 2 hàng tuần
                </Text>
              </div>
            </Space>
          </Col>

          <Col>
            <Space wrap size="small">
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                size="large"
                style={{ backgroundColor: '#10b981', borderColor: '#10b981', borderRadius: 8, fontWeight: 600 }}
                onClick={handleExportExcel}
              >
                Xuất Excel (.xlsx)
              </Button>

              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                size="large"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', borderRadius: 8, fontWeight: 600 }}
                onClick={handleExportPdf}
              >
                Xuất PDF (.pdf)
              </Button>

              <Button
                type="default"
                icon={<MailOutlined />}
                size="large"
                loading={emailLoading}
                style={{ borderRadius: 8, borderColor: '#6366f1', color: '#6366f1', fontWeight: 600 }}
                onClick={handleTriggerEmail}
              >
                Gửi Email 8h Sáng T2
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space wrap size="middle">
              <Text strong style={{ fontSize: 14 }}>Loại báo cáo:</Text>
              <Segmented
                options={[
                  { label: '💰 Doanh Thu', value: 'doanh_thu', icon: <LineChartOutlined /> },
                  { label: '👥 Hiệu Suất Nhân Viên', value: 'nhan_vien', icon: <TeamOutlined /> },
                  { label: '✂️ Sử Dụng Dịch Vụ', value: 'dich_vu', icon: <ScissorOutlined /> }
                ]}
                value={reportType}
                onChange={(val) => setReportType(val)}
                size="large"
              />
            </Space>
          </Col>

          <Col>
            <Space wrap size="middle">
              <Text strong style={{ fontSize: 14 }}>Kỳ báo cáo:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                size="large"
                style={{ borderRadius: 8 }}
              />

              <Select
                placeholder="Tất cả chi nhánh"
                value={selectedBranchId}
                onChange={(val) => setSelectedBranchId(val)}
                allowClear
                style={{ width: 180, borderRadius: 8 }}
                size="large"
              >
                {branches.map((b) => (
                  <Option key={b.id} value={b.id}>{b.name}</Option>
                ))}
              </Select>

              <Button
                icon={<ReloadOutlined />}
                size="large"
                style={{ borderRadius: 8 }}
                onClick={fetchReportData}
              >
                Tải lại
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* PRINTABLE PREVIEW CONTAINER FOR PDF & EXCEL DATA */}
      <Card
        id="printable-report-area"
        style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 12 }}
      >
        {/* REPORT PRINT HEADER BANNER */}
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #4f46e5' }}>
          <Title level={3} style={{ margin: 0, color: '#4f46e5', fontWeight: 800 }}>
            📊 BÁO CÁO SALONFLOW - {reportType === 'nhan_vien' ? 'HIỆU SUẤT NHÂN VIÊN' : reportType === 'dich_vu' ? 'SỬ DỤNG DỊCH VỤ' : 'DOANH THU KINH DOANH'}
          </Title>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
            Thời gian từ: <strong>{dateRange && dateRange[0] ? dateRange[0].format('DD/MM/YYYY') : '---'}</strong> đến: <strong>{dateRange && dateRange[1] ? dateRange[1].format('DD/MM/YYYY') : '---'}</strong>
          </Text>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Đang tổng hợp dữ liệu báo cáo..." />
          </div>
        ) : (
          <Table
            dataSource={getDataSource()}
            columns={getTableColumns()}
            rowKey={(r, i) => r.staffId || r.serviceId || i}
            pagination={{ pageSize: 15 }}
            bordered
          />
        )}
      </Card>
    </div>
  );
}
