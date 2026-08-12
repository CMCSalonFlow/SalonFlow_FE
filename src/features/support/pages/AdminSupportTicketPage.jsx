import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Button, Space, Table, Tag, Form, Input, Select, Drawer, Avatar, Divider, Spin, message, Alert, Switch, Statistic, Badge } from 'antd';
import {
  CustomerServiceOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  LockOutlined,
  SendOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAdminTicketsApi, getTicketKpiStatsApi, getTicketDetailsApi, updateTicketStatusApi, assignTicketApi, addReplyApi } from '../api/supportTicketApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminSupportTicketPage() {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [kpiStats, setKpiStats] = useState({ openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, slaBreachedCount: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Filter States
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [slaBreachedFilter, setSlaBreachedFilter] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Drawer / Workspace State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch KPI Stats
  const fetchKpiStats = async () => {
    try {
      const res = await getTicketKpiStatsApi();
      setKpiStats(res);
    } catch (err) {
      console.error("Lỗi lấy thống kê KPI:", err);
    }
  };

  // Fetch Admin Tickets
  const fetchAdminTickets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAdminTicketsApi({
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        slaBreached: slaBreachedFilter,
        search: searchText,
        page: page - 1,
        size: pagination.pageSize
      });
      setTickets(res.content || []);
      setPagination(prev => ({ ...prev, current: page, total: res.totalElements || 0 }));
    } catch (err) {
      console.error("Lỗi lấy danh sách ticket admin:", err);
      message.error("Không thể tải danh sách Ticket hỗ trợ!");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, slaBreachedFilter, searchText, pagination.pageSize]);

  useEffect(() => {
    fetchKpiStats();
    fetchAdminTickets(1);
  }, [fetchAdminTickets]);

  // Open Workspace Drawer
  const handleOpenWorkspace = async (ticketId) => {
    setDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const res = await getTicketDetailsApi(ticketId);
      setSelectedTicketDetail(res);
    } catch (err) {
      console.error("Lỗi lấy chi tiết ticket admin:", err);
      message.error("Lỗi tải chi tiết Ticket!");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTicketStatusApi(selectedTicketDetail.ticket.id, { status: newStatus });
      message.success(`Đã chuyển trạng thái sang: ${newStatus}`);
      fetchKpiStats();
      fetchAdminTickets(pagination.current);
      const updated = await getTicketDetailsApi(selectedTicketDetail.ticket.id);
      setSelectedTicketDetail(updated);
    } catch (err) {
      console.error("Lỗi đổi trạng thái:", err);
      message.error("Lỗi khi cập nhật trạng thái!");
    }
  };

  // Send Admin Reply
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await addReplyApi(selectedTicketDetail.ticket.id, {
        message: replyText,
        isInternalNote
      });
      message.success(isInternalNote ? "Đã thêm Ghi chú nội bộ!" : "Đã gửi phản hồi tới người dùng!");
      setReplyText('');
      fetchAdminTickets(pagination.current);
      const updated = await getTicketDetailsApi(selectedTicketDetail.ticket.id);
      setSelectedTicketDetail(updated);
    } catch (err) {
      console.error("Lỗi gửi reply admin:", err);
      message.error("Lỗi khi gửi phản hồi!");
    } finally {
      setSendingReply(false);
    }
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority) => {
    if (priority === 'P1') return <Tag color="red" style={{ fontWeight: 700 }}>🚨 P1 - Khẩn cấp (&lt;4h)</Tag>;
    if (priority === 'P2') return <Tag color="orange" style={{ fontWeight: 700 }}>⚡ P2 - Cao (&lt;24h)</Tag>;
    return <Tag color="blue" style={{ fontWeight: 600 }}>📌 P3 - Bình thường (&lt;72h)</Tag>;
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    if (status === 'OPEN') return <Tag color="cyan">Mới tiếp nhận</Tag>;
    if (status === 'IN_PROGRESS') return <Tag color="processing">Đang xử lý</Tag>;
    if (status === 'RESOLVED') return <Tag color="success">Đã giải quyết</Tag>;
    return <Tag color="default">Đã đóng</Tag>;
  };

  // Render SLA Badge
  const renderSlaBadge = (ticket) => {
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return <Tag color="gray">Đã hoàn tất</Tag>;
    }
    if (ticket.slaBreached) {
      return <Tag color="error" icon={<ExclamationCircleOutlined />}>Vi phạm SLA</Tag>;
    }
    if (ticket.remainingMinutes < 120) {
      return <Tag color="warning" icon={<ClockCircleOutlined />}>Sắp hết hạn ({Math.max(0, ticket.remainingMinutes)}m)</Tag>;
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>Trong SLA</Tag>;
  };

  const columns = [
    { title: 'Mã Ticket', dataIndex: 'ticketCode', key: 'ticketCode', render: (t) => <Text strong style={{ color: '#4f46e5' }}>#{t}</Text> },
    { title: 'Tiêu đề', dataIndex: 'subject', key: 'subject', render: (t, r) => <div><Text strong>{t}</Text><br/><Text type="secondary" style={{ fontSize: 12 }}>Người tạo: {r.createdByUserName} ({r.createdByUserEmail})</Text></div> },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'Độ ưu tiên', dataIndex: 'priority', key: 'priority', render: (p) => renderPriorityBadge(p) },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s) => renderStatusBadge(s) },
    { title: 'Cam kết SLA', key: 'sla', render: (_, r) => renderSlaBadge(r) },
    { title: 'Cán bộ xử lý', dataIndex: 'assignedToUserName', key: 'assignedToUserName', render: (u) => <Tag color="purple">{u}</Tag> },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, r) => (
        <Button type="primary" size="small" onClick={() => handleOpenWorkspace(r.id)} style={{ borderRadius: 6 }}>
          Xử lý Ticket
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER & KPI STATS */}
      <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Space align="center" size="middle">
              <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '14px 16px', borderRadius: 14, color: '#fff' }}>
                <CustomerServiceOutlined style={{ fontSize: 28 }} />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                  Admin Support Ticket Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Quản lý, phân công cán bộ xử lý & Giám sát thời gian cam kết SLA (P1 &lt; 4h, P2 &lt; 24h, P3 &lt; 72h)
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchKpiStats(); fetchAdminTickets(1); }} size="large" style={{ borderRadius: 8 }}>
              Tải lại
            </Button>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={5}>
            <Card style={{ background: '#ecfeff', borderRadius: 12, border: '1px solid #cff4fc' }}>
              <Statistic title={<Text type="secondary" style={{ fontSize: 12 }}>Mới tiếp nhận (Open)</Text>} value={kpiStats.openCount} valueStyle={{ color: '#0891b2', fontWeight: 800 }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={{ background: '#eff6ff', borderRadius: 12, border: '1px solid #dbeafe' }}>
              <Statistic title={<Text type="secondary" style={{ fontSize: 12 }}>Đang xử lý (In Progress)</Text>} value={kpiStats.inProgressCount} valueStyle={{ color: '#2563eb', fontWeight: 800 }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={{ background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7' }}>
              <Statistic title={<Text type="secondary" style={{ fontSize: 12 }}>Đã giải quyết (Resolved)</Text>} value={kpiStats.resolvedCount} valueStyle={{ color: '#16a34a', fontWeight: 800 }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <Statistic title={<Text type="secondary" style={{ fontSize: 12 }}>Đã đóng (Closed)</Text>} value={kpiStats.closedCount} valueStyle={{ color: '#64748b', fontWeight: 800 }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card style={{ background: '#fef2f2', borderRadius: 12, border: '1px solid #fee2e2' }}>
              <Statistic title={<Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>🚨 Vi phạm SLA</Text>} value={kpiStats.slaBreachedCount} valueStyle={{ color: '#dc2626', fontWeight: 900 }} />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* FILTER & TABLE CARD */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[12, 12]}>
          <Col>
            <Space wrap size="middle">
              <Input
                placeholder="Tìm mã ticket, tiêu đề..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220, borderRadius: 8 }}
              />

              <Select placeholder="Trạng thái" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 150, borderRadius: 8 }}>
                <Option value="OPEN">Mới tiếp nhận</Option>
                <Option value="IN_PROGRESS">Đang xử lý</Option>
                <Option value="RESOLVED">Đã giải quyết</Option>
                <Option value="CLOSED">Đã đóng</Option>
              </Select>

              <Select placeholder="Độ ưu tiên SLA" value={priorityFilter} onChange={setPriorityFilter} allowClear style={{ width: 160, borderRadius: 8 }}>
                <Option value="P1">🚨 P1 - Khẩn cấp (&lt;4h)</Option>
                <Option value="P2">⚡ P2 - Cao (&lt;24h)</Option>
                <Option value="P3">📌 P3 - Bình thường (&lt;72h)</Option>
              </Select>

              <Select placeholder="Vi phạm SLA" value={slaBreachedFilter} onChange={setSlaBreachedFilter} allowClear style={{ width: 150, borderRadius: 8 }}>
                <Option value={true}>🚨 Đã vi phạm SLA</Option>
                <Option value={false}>🟢 Trong thời hạn</Option>
              </Select>
            </Space>
          </Col>

          <Col>
            <Button type="primary" icon={<FilterOutlined />} onClick={() => fetchAdminTickets(1)} style={{ borderRadius: 8, fontWeight: 600 }}>
              Áp dụng lọc
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={tickets}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchAdminTickets(page)
          }}
          bordered
        />
      </Card>

      {/* ADMIN TICKET WORKSPACE DRAWER */}
      <Drawer
        title={
          selectedTicketDetail && (
            <Space align="center">
              <Text strong style={{ fontSize: 16 }}>Workspace Ticket #{selectedTicketDetail.ticket.ticketCode}</Text>
              {renderPriorityBadge(selectedTicketDetail.ticket.priority)}
            </Space>
          )
        }
        width={680}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {loadingDetail || !selectedTicketDetail ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Đang tải dữ liệu Ticket Workspace..." />
          </div>
        ) : (
          <div>
            {/* METADATA & CONTROL ACTIONS */}
            <Card style={{ background: '#f8fafc', borderRadius: 12, marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>{selectedTicketDetail.ticket.subject}</Title>
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                Người gửi: <strong>{selectedTicketDetail.ticket.createdByUserName}</strong> ({selectedTicketDetail.ticket.createdByUserEmail})
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Text strong style={{ fontSize: 13 }}>Cập nhật trạng thái:</Text>
                  <Select
                    value={selectedTicketDetail.ticket.status}
                    onChange={handleUpdateStatus}
                    style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  >
                    <Option value="OPEN">Mới tiếp nhận</Option>
                    <Option value="IN_PROGRESS">Đang xử lý</Option>
                    <Option value="RESOLVED">Đã giải quyết</Option>
                    <Option value="CLOSED">Đã đóng</Option>
                  </Select>
                </Col>

                <Col span={12}>
                  <Text strong style={{ fontSize: 13 }}>Thời hạn SLA:</Text>
                  <div style={{ marginTop: 4 }}>
                    {renderSlaBadge(selectedTicketDetail.ticket)}
                  </div>
                </Col>
              </Row>

              <Paragraph style={{ marginTop: 14, fontSize: 14, color: '#334155', background: '#fff', padding: 12, borderRadius: 8 }}>
                {selectedTicketDetail.ticket.description}
              </Paragraph>
            </Card>

            {/* THREAD DISCUSSION & INTERNAL NOTES */}
            <Title level={5}>💬 Nhật Ký Phản Hồi & Ghi Chú Nội Bộ</Title>
            <Divider style={{ margin: '12px 0' }} />

            <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 8, marginBottom: 20 }}>
              {selectedTicketDetail.replies.length === 0 ? (
                <Text type="secondary">Chưa có nội dung trao đổi nào.</Text>
              ) : (
                selectedTicketDetail.replies.map((reply) => (
                  <div
                    key={reply.id}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      borderRadius: 12,
                      background: reply.isInternalNote ? '#fffbe6' : (reply.isAdmin ? '#e0e7ff' : '#f1f5f9'),
                      border: reply.isInternalNote ? '1px solid #ffe58f' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <Space>
                        <strong>{reply.userName}</strong>
                        {reply.isAdmin && <Tag color="purple">Admin</Tag>}
                        {reply.isInternalNote && <Tag color="gold" icon={<LockOutlined />}>Ghi chú nội bộ</Tag>}
                      </Space>
                      <Text type="secondary">{dayjs(reply.createdAt).format('HH:mm DD/MM/YYYY')}</Text>
                    </div>
                    <div style={{ fontSize: 14, color: reply.isInternalNote ? '#873800' : '#1e293b', lineHeight: 1.5 }}>
                      {reply.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* REPLY EDITOR AREA */}
            <Card style={{ background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 13 }}>Viết phản hồi:</Text>
                <Space>
                  <Text style={{ fontSize: 12 }}>Ghi chú nội bộ (Chỉ Admin xem):</Text>
                  <Switch checked={isInternalNote} onChange={setIsInternalNote} size="small" />
                </Space>
              </div>

              <TextArea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternalNote ? "Nhập ghi chú nội bộ dành riêng cho đội ngũ Admin..." : "Nhập phản hồi trực tiếp gửi tới người dùng..."}
                style={{ borderRadius: 8, marginBottom: 12 }}
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sendingReply}
                onClick={handleSendReply}
                style={{ borderRadius: 8, fontWeight: 700, background: isInternalNote ? '#d97706' : '#4f46e5' }}
              >
                {isInternalNote ? "Thêm Ghi Chú Nội Bộ" : "Gửi Phản Hồi Cho User"}
              </Button>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
