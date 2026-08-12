import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Typography, Button, Space, Table, Tag, Form, Input, Select, Tabs, Modal, Avatar, Divider, Spin, message, Alert, Badge } from 'antd';
import {
  CustomerServiceOutlined,
  PlusCircleOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  LockOutlined,
  TagOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { createTicketApi, getUserTicketsApi, getTicketDetailsApi, addReplyApi } from '../api/supportTicketApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState('1');
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Tickets List State
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch My Tickets
  const fetchMyTickets = useCallback(async (page = 1) => {
    setLoadingTickets(true);
    try {
      const res = await getUserTicketsApi({ page: page - 1, size: pagination.pageSize });
      setTickets(res.content || []);
      setPagination(prev => ({ ...prev, current: page, total: res.totalElements || 0 }));
    } catch (err) {
      console.error("Lỗi lấy danh sách ticket:", err);
      message.error("Không thể tải danh sách Ticket hỗ trợ!");
    } finally {
      setLoadingTickets(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    if (activeTab === '2') {
      fetchMyTickets(1);
    }
  }, [activeTab, fetchMyTickets]);

  // Handle Create Ticket
  const handleCreateTicket = async (values) => {
    setSubmitting(true);
    try {
      const res = await createTicketApi(values);
      message.success(`Tạo Ticket #${res.ticketCode} thành công! Thời hạn cam kết SLA: ${res.priorityName}`);
      form.resetFields();
      setActiveTab('2');
    } catch (err) {
      console.error("Lỗi tạo ticket:", err);
      message.error(err.response?.data?.message || "Lỗi khi gửi yêu cầu hỗ trợ!");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Ticket Detail Modal
  const handleOpenDetail = async (ticketId) => {
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await getTicketDetailsApi(ticketId);
      setSelectedTicketDetail(res);
    } catch (err) {
      console.error("Lỗi xem chi tiết ticket:", err);
      message.error("Không thể tải thông tin ticket!");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle Send Reply
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await addReplyApi(selectedTicketDetail.ticket.id, { message: replyText, isInternalNote: false });
      message.success("Đã gửi phản hồi thành công!");
      setReplyText('');
      // Refresh detail
      const updatedDetail = await getTicketDetailsApi(selectedTicketDetail.ticket.id);
      setSelectedTicketDetail(updatedDetail);
    } catch (err) {
      console.error("Lỗi gửi reply:", err);
      message.error("Lỗi khi gửi phản hồi!");
    } finally {
      setSendingReply(false);
    }
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority) => {
    if (priority === 'P1') return <Tag color="red" style={{ fontWeight: 700 }}>🚨 P1 - Khẩn cấp (SLA &lt; 4h)</Tag>;
    if (priority === 'P2') return <Tag color="orange" style={{ fontWeight: 700 }}>⚡ P2 - Cao (SLA &lt; 24h)</Tag>;
    return <Tag color="blue" style={{ fontWeight: 600 }}>📌 P3 - Bình thường (SLA &lt; 72h)</Tag>;
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
      return <Tag color="error" icon={<ExclamationCircleOutlined />}>Quá hạn SLA</Tag>;
    }
    if (ticket.remainingMinutes < 120) {
      return <Tag color="warning" icon={<ClockCircleOutlined />}>Sắp hết hạn ({Math.max(0, ticket.remainingMinutes)}m)</Tag>;
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>Trong SLA</Tag>;
  };

  const columns = [
    { title: 'Mã Ticket', dataIndex: 'ticketCode', key: 'ticketCode', render: (t) => <Text strong color="primary">#{t}</Text> },
    { title: 'Tiêu đề', dataIndex: 'subject', key: 'subject', render: (t, r) => <div><Text strong>{t}</Text><br/><Text type="secondary" style={{ fontSize: 12 }}>{r.categoryName}</Text></div> },
    { title: 'Độ ưu tiên', dataIndex: 'priority', key: 'priority', render: (p) => renderPriorityBadge(p) },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s) => renderStatusBadge(s) },
    { title: 'Cam kết SLA', key: 'sla', render: (_, r) => renderSlaBadge(r) },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (d) => dayjs(d).format('HH:mm DD/MM/YYYY') },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => handleOpenDetail(r.id)}>
          Trao đổi / Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER BANNER */}
      <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center" size="middle">
              <div style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', padding: '14px 16px', borderRadius: 14, color: '#fff' }}>
                <CustomerServiceOutlined style={{ fontSize: 28 }} />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                  Trung Tâm Hỗ Trợ Nội Bộ (Help Center)
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Gửi yêu cầu hỗ trợ kỹ thuật, vận hành, thanh toán - Cam kết thời gian phản hồi SLA tức thì
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* MAIN TABS */}
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: '1',
              label: <span><PlusCircleOutlined /> Gửi Yêu Cầu Hỗ Trợ Mới</span>,
              children: (
                <div style={{ maxWidth: 720, margin: '20px auto 0 auto' }}>
                  <Alert
                    message="Cam Kết Thời Gian Xử Lý (SLA Guarantee)"
                    description={
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        • <strong>P1 - Khẩn Cấp</strong>: Hệ thống lỗi nghiêm trọng, gián đoạn kinh doanh $\rightarrow$ Xử lý &lt; <strong>4 giờ</strong>.<br />
                        • <strong>P2 - Cao</strong>: Lỗi chức năng quan trọng $\rightarrow$ Xử lý &lt; <strong>24 giờ</strong>.<br />
                        • <strong>P3 - Bình Thường</strong>: Thắc mắc, góp ý, hướng dẫn $\rightarrow$ Xử lý &lt; <strong>72 giờ</strong>.
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />

                  <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
                    <Form.Item
                      name="subject"
                      label={<Text strong>Tiêu đề yêu cầu</Text>}
                      rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                      <Input placeholder="Ví dụ: Không thể mở ca làm việc cho nhân viên Stylist A" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="category"
                          label={<Text strong>Danh mục sự cố</Text>}
                          rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                        >
                          <Select placeholder="Chọn danh mục" size="large" style={{ borderRadius: 8 }}>
                            <Option value="TECHNICAL">💻 Sự cố kỹ thuật</Option>
                            <Option value="BILLING">💰 Thanh toán & Hóa đơn</Option>
                            <Option value="ACCOUNT">🔑 Tài khoản & Phân quyền</Option>
                            <Option value="SALON_OPERATION">✂️ Vận hành Salon</Option>
                            <Option value="OTHER">❓ Khác</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          name="priority"
                          label={<Text strong>Mức độ ưu tiên (SLA)</Text>}
                          rules={[{ required: true, message: 'Vui lòng chọn độ ưu tiên!' }]}
                        >
                          <Select placeholder="Chọn độ ưu tiên" size="large" style={{ borderRadius: 8 }}>
                            <Option value="P1">🚨 P1 - Khẩn cấp (&lt; 4h)</Option>
                            <Option value="P2">⚡ P2 - Cao (&lt; 24h)</Option>
                            <Option value="P3">📌 P3 - Bình thường (&lt; 72h)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="description"
                      label={<Text strong>Mô tả chi tiết nội dung sự cố</Text>}
                      rules={[{ required: true, message: 'Vui lòng nhập mô tả chi tiết!' }]}
                    >
                      <TextArea rows={5} placeholder="Mô tả cụ thể các bước xảy ra lỗi, tên chi nhánh, thời gian bị lỗi..." style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<SendOutlined />}
                        loading={submitting}
                        block
                        style={{ borderRadius: 8, fontWeight: 700, height: 46, background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
                      >
                        Gửi Ticket Hỗ Trợ
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            },
            {
              key: '2',
              label: <span><HistoryOutlined /> Lịch Sử Ticket Của Tôi</span>,
              children: (
                <Table
                  dataSource={tickets}
                  columns={columns}
                  rowKey="id"
                  loading={loadingTickets}
                  pagination={{
                    ...pagination,
                    onChange: (page) => fetchMyTickets(page)
                  }}
                  bordered
                  style={{ marginTop: 12 }}
                />
              )
            }
          ]}
        />
      </Card>

      {/* TICKET DETAILS & DISCUSSION MODAL */}
      <Modal
        title={
          selectedTicketDetail && (
            <Space align="center">
              <Text strong style={{ fontSize: 16 }}>Ticket #{selectedTicketDetail.ticket.ticketCode}</Text>
              {renderStatusBadge(selectedTicketDetail.ticket.status)}
              {renderSlaBadge(selectedTicketDetail.ticket)}
            </Space>
          )
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={760}
      >
        {loadingDetail || !selectedTicketDetail ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Đang tải chi tiết ticket..." />
          </div>
        ) : (
          <div>
            <Card style={{ background: '#f8fafc', borderRadius: 12, marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>{selectedTicketDetail.ticket.subject}</Title>
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                <Space split={<Divider type="vertical" />}>
                  <span>Danh mục: <strong>{selectedTicketDetail.ticket.categoryName}</strong></span>
                  <span>Độ ưu tiên: {renderPriorityBadge(selectedTicketDetail.ticket.priority)}</span>
                  <span>Cán bộ xử lý: <strong>{selectedTicketDetail.ticket.assignedToUserName}</strong></span>
                </Space>
              </div>
              <Paragraph style={{ marginTop: 12, fontSize: 14, color: '#334155', background: '#fff', padding: 12, borderRadius: 8 }}>
                {selectedTicketDetail.ticket.description}
              </Paragraph>
            </Card>

            <Title level={5}>💬 Trao Đổi Phản Hồi (Thread Replies)</Title>
            <Divider style={{ margin: '12px 0' }} />

            <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 8, marginBottom: 20 }}>
              {selectedTicketDetail.replies.length === 0 ? (
                <Text type="secondary">Chưa có phản hồi nào trong trao đổi này.</Text>
              ) : (
                selectedTicketDetail.replies.map((reply) => (
                  <div
                    key={reply.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      marginBottom: 16,
                      flexDirection: reply.isAdmin ? 'row-reverse' : 'row'
                    }}
                  >
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: reply.isAdmin ? '#4f46e5' : '#0284c7' }} />
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ fontSize: 12, color: '#64748b', textAlign: reply.isAdmin ? 'right' : 'left', marginBottom: 2 }}>
                        <strong>{reply.userName}</strong> {reply.isAdmin && <Tag color="purple">Admin Support</Tag>} • {dayjs(reply.createdAt).format('HH:mm DD/MM/YYYY')}
                      </div>
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: reply.isAdmin ? '#e0e7ff' : '#f1f5f9',
                          color: reply.isAdmin ? '#3730a3' : '#1e293b',
                          fontSize: 14,
                          lineHeight: 1.5
                        }}
                      >
                        {reply.message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* REPLY INPUT AREA */}
            {selectedTicketDetail.ticket.status !== 'CLOSED' ? (
              <Card style={{ background: '#f8fafc', borderRadius: 12 }}>
                <TextArea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập nội dung phản hồi của bạn..."
                  style={{ borderRadius: 8, marginBottom: 12 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sendingReply}
                  onClick={handleSendReply}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Gửi Phản Hồi
                </Button>
              </Card>
            ) : (
              <Alert message="Ticket này đã được đóng." type="warning" showIcon />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
