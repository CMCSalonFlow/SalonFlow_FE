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
      message.error("Không thể tải danh sách yêu cầu hỗ trợ!");
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
      message.success(`Đã gửi yêu cầu #${res.ticketCode} thành công!`);
      form.resetFields();
      setActiveTab('2');
    } catch (err) {
      console.error("Lỗi tạo ticket:", err);
      message.error(err.response?.data?.message || "Không thể gửi yêu cầu hỗ trợ!");
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
      message.error("Không thể tải thông tin yêu cầu!");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle Send Reply
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await addReplyApi(selectedTicketDetail.ticket.id, { message: replyText, isInternalNote: false });
      message.success("Đã gửi phản hồi!");
      setReplyText('');
      const updatedDetail = await getTicketDetailsApi(selectedTicketDetail.ticket.id);
      setSelectedTicketDetail(updatedDetail);
    } catch (err) {
      console.error("Lỗi gửi reply:", err);
      message.error("Không thể gửi phản hồi!");
    } finally {
      setSendingReply(false);
    }
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority) => {
    if (priority === 'P1') return <Tag color="red" style={{ fontWeight: 600 }}>P1 - Khẩn cấp (&lt; 4h)</Tag>;
    if (priority === 'P2') return <Tag color="orange" style={{ fontWeight: 600 }}>P2 - Cao (&lt; 24h)</Tag>;
    return <Tag color="blue" style={{ fontWeight: 500 }}>P3 - Bình thường (&lt; 72h)</Tag>;
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
      return <Tag color="error" icon={<ExclamationCircleOutlined />}>Quá hạn</Tag>;
    }
    if (ticket.remainingMinutes < 120) {
      return <Tag color="warning" icon={<ClockCircleOutlined />}>Sắp hết hạn ({Math.max(0, ticket.remainingMinutes)} phút)</Tag>;
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>Đúng hạn</Tag>;
  };

  const columns = [
    { title: 'Mã yêu cầu', dataIndex: 'ticketCode', key: 'ticketCode', render: (t) => <Text strong style={{ color: '#0284c7' }}>#{t}</Text> },
    { title: 'Tiêu đề', dataIndex: 'subject', key: 'subject', render: (t, r) => <div><Text strong>{t}</Text><br/><Text type="secondary" style={{ fontSize: 12 }}>{r.categoryName}</Text></div> },
    { title: 'Mức độ', dataIndex: 'priority', key: 'priority', render: (p) => renderPriorityBadge(p) },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s) => renderStatusBadge(s) },
    { title: 'Hạn xử lý', key: 'sla', render: (_, r) => renderSlaBadge(r) },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (d) => dayjs(d).format('HH:mm DD/MM/YYYY') },
    {
      title: '',
      key: 'action',
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => handleOpenDetail(r.id)}>
          Xem chi tiết
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER BANNER */}
      <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center" size="middle">
              <div style={{ background: '#0284c7', padding: '12px 14px', borderRadius: 12, color: '#fff' }}>
                <CustomerServiceOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                  Trung tâm hỗ trợ Salon
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Gửi yêu cầu trợ giúp về kỹ thuật, thanh toán hoặc vận hành salon
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* MAIN TABS */}
      <Card style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: '1',
              label: <span><PlusCircleOutlined /> Tạo yêu cầu mới</span>,
              children: (
                <div style={{ maxWidth: 720, margin: '20px auto 0 auto' }}>


                  <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
                    <Form.Item
                      name="subject"
                      label={<Text strong>Tiêu đề</Text>}
                      rules={[{ required: true, message: 'Vui lòng nhập tiêu đề yêu cầu!' }]}
                    >
                      <Input placeholder="Ví dụ: Không mở được ca làm việc cho nhân viên" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="category"
                          label={<Text strong>Danh mục</Text>}
                          rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
                        >
                          <Select placeholder="Chọn danh mục" size="large" style={{ borderRadius: 8 }}>
                            <Option value="TECHNICAL">Sự cố kỹ thuật</Option>
                            <Option value="BILLING">Thanh toán & Hóa đơn</Option>
                            <Option value="ACCOUNT">Tài khoản & Phân quyền</Option>
                            <Option value="SALON_OPERATION">Vận hành salon</Option>
                            <Option value="OTHER">Vấn đề khác</Option>
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item
                          name="priority"
                          label={<Text strong>Mức độ ưu tiên</Text>}
                          rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên!' }]}
                        >
                          <Select placeholder="Chọn mức độ ưu tiên" size="large" style={{ borderRadius: 8 }}>
                            <Option value="P1">P1 - Khẩn cấp (&lt; 4h)</Option>
                            <Option value="P2">P2 - Cao (&lt; 24h)</Option>
                            <Option value="P3">P3 - Bình thường (&lt; 72h)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="description"
                      label={<Text strong>Nội dung chi tiết</Text>}
                      rules={[{ required: true, message: 'Vui lòng mô tả chi tiết vấn đề!' }]}
                    >
                      <TextArea rows={5} placeholder="Mô tả cụ thể diễn biến sự cố, thời điểm phát sinh và chi nhánh bị ảnh hưởng..." style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        icon={<SendOutlined />}
                        loading={submitting}
                        block
                        style={{ borderRadius: 8, fontWeight: 600, height: 44, backgroundColor: '#0284c7' }}
                      >
                        Gửi yêu cầu
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            },
            {
              key: '2',
              label: <span><HistoryOutlined /> Lịch sử yêu cầu</span>,
              children: (
                <Table
                  dataSource={tickets}
                  columns={columns}
                  rowKey="id"
                  loading={loadingTickets}
                  scroll={{ x: 750 }}
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
              <Text strong style={{ fontSize: 16 }}>Yêu cầu #{selectedTicketDetail.ticket.ticketCode}</Text>
              {renderStatusBadge(selectedTicketDetail.ticket.status)}
              {renderSlaBadge(selectedTicketDetail.ticket)}
            </Space>
          )
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={720}
      >
        {loadingDetail || !selectedTicketDetail ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="Đang tải dữ liệu..." />
          </div>
        ) : (
          <div>
            <Card style={{ background: '#f8fafc', borderRadius: 12, marginBottom: 20 }}>
              <Title level={5} style={{ margin: 0, color: '#1e293b' }}>{selectedTicketDetail.ticket.subject}</Title>
              <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                <Space split={<Divider type="vertical" />}>
                  <span>Danh mục: <strong>{selectedTicketDetail.ticket.categoryName}</strong></span>
                  <span>Mức độ: {renderPriorityBadge(selectedTicketDetail.ticket.priority)}</span>
                  <span>Phụ trách: <strong>{selectedTicketDetail.ticket.assignedToUserName}</strong></span>
                </Space>
              </div>
              <Paragraph style={{ marginTop: 12, fontSize: 14, color: '#334155', background: '#fff', padding: 12, borderRadius: 8 }}>
                {selectedTicketDetail.ticket.description}
              </Paragraph>
            </Card>

            <Title level={5} style={{ fontSize: 15 }}>Lịch sử trao đổi</Title>
            <Divider style={{ margin: '12px 0' }} />

            <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 8, marginBottom: 20 }}>
              {selectedTicketDetail.replies.length === 0 ? (
                <Text type="secondary">Chưa có phản hồi nào.</Text>
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
                        <strong>{reply.userName}</strong> {reply.isAdmin && <Tag color="purple">Hỗ trợ viên</Tag>} • {dayjs(reply.createdAt).format('HH:mm DD/MM/YYYY')}
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
                  placeholder="Nhập phản hồi của bạn..."
                  style={{ borderRadius: 8, marginBottom: 12 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={sendingReply}
                  onClick={handleSendReply}
                  style={{ borderRadius: 8, fontWeight: 600, backgroundColor: '#0284c7' }}
                >
                  Gửi phản hồi
                </Button>
              </Card>
            ) : (
              <Alert message="Yêu cầu này đã được đóng." type="info" showIcon />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
