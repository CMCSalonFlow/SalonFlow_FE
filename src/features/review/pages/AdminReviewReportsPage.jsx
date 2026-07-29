import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Input,
  Tabs,
  message,
  Rate,
} from "antd";
import dayjs from "dayjs";
import {
  getAdminReviewReportsApi,
  approveReviewReportApi,
  rejectReviewReportApi,
} from "../api/reviewReportApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminReviewReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Modal approve/reject
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("APPROVE"); // APPROVE or REJECT
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadReports = async (page = 1, status = activeTab) => {
    setLoading(true);
    try {
      const data = await getAdminReviewReportsApi(status, page - 1, pagination.pageSize);
      setReports(data.content || []);
      setPagination({
        current: (data.number || 0) + 1,
        pageSize: data.size || 10,
        total: data.totalElements || 0,
      });
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách báo cáo vi phạm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(1, activeTab);
  }, [activeTab]);

  const handleAction = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      if (modalType === "APPROVE") {
        await approveReviewReportApi(selectedReport.id, adminNotes);
        message.success("Đã chấp nhận báo cáo! Bài đánh giá đã bị ẩn khỏi công khai & đã gửi email cho 2 bên.");
      } else {
        await rejectReviewReportApi(selectedReport.id, adminNotes);
        message.success("Đã từ chối báo cáo! Đã gửi email thông báo kết quả cho người báo cáo.");
      }
      setModalOpen(false);
      setSelectedReport(null);
      setAdminNotes("");
      loadReports(pagination.current, activeTab);
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "Đánh giá bị báo cáo",
      dataIndex: "reviewComment",
      render: (_, record) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Rate disabled defaultValue={record.reviewRating || 5} style={{ fontSize: 13 }} />
            <Text strong>{record.reviewAuthorName || "Khách hàng"}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>({record.reviewAuthorEmail || ""})</Text>
          </div>
          <div style={{ background: "#f9f9f9", padding: "6px 10px", borderRadius: 6, border: "1px solid #f0f0f0", fontSize: 13 }}>
            "{record.reviewComment || "Không có bình luận"}"
          </div>
        </div>
      ),
    },
    {
      title: "Người báo cáo",
      dataIndex: "reporterName",
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong>{record.reporterName || "-"}</Text>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>{record.reporterEmail || ""}</div>
        </div>
      ),
    },
    {
      title: "Lý do báo cáo",
      dataIndex: "reason",
      width: 240,
      render: (val) => (
        <Text type="danger" style={{ fontWeight: 500 }}>
          {val}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (val) => {
        if (val === "APPROVED") return <Tag color="green">Đã ẩn Review</Tag>;
        if (val === "REJECTED") return <Tag color="red">Đã từ chối</Tag>;
        return <Tag color="gold">Chờ xử lý</Tag>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 150,
      render: (val) => (val ? dayjs(val).format("DD/MM/YYYY HH:mm") : "-"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_, record) => {
        if (record.status !== "PENDING") {
          return (
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              Xử lý bởi: {record.resolvedByName || "Admin"}
              {record.adminNotes && <div>Ghi chú: "{record.adminNotes}"</div>}
            </div>
          );
        }
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
              onClick={() => {
                setSelectedReport(record);
                setModalType("APPROVE");
                setAdminNotes("");
                setModalOpen(true);
              }}
            >
              Duyệt Ẩn Bài
            </Button>
            <Button
              danger
              size="small"
              onClick={() => {
                setSelectedReport(record);
                setModalType("REJECT");
                setAdminNotes("");
                setModalOpen(true);
              }}
            >
              Từ chối
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>
          Hàng đợi báo cáo vi phạm đánh giá
        </Title>
        <Text type="secondary">
          Duyệt các báo cáo từ Salon Owner/Khách hàng. Khi duyệt chấp nhận, bài đánh giá sẽ bị ẩn khỏi công khai (giữ trong DB) & gửi Email tới cả 2 bên.
        </Text>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            { key: "PENDING", label: "Chờ xử lý (Pending)" },
            { key: "APPROVED", label: "Đã duyệt ẩn bài (Approved)" },
            { key: "REJECTED", label: "Đã từ chối (Rejected)" },
          ]}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (p) => loadReports(p, activeTab),
          }}
        />
      </Card>

      <Modal
        title={modalType === "APPROVE" ? "Xác nhận duyệt ẩn bài đánh giá" : "Xác nhận từ chối báo cáo"}
        open={modalOpen}
        onOk={handleAction}
        confirmLoading={actionLoading}
        onCancel={() => setModalOpen(false)}
        okText={modalType === "APPROVE" ? "Chấp nhận & Ẩn review" : "Từ chối báo cáo"}
        okButtonProps={{ danger: modalType === "REJECT" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modalType === "APPROVE" ? (
            <Text type="warning">
              ⚠️ Khi duyệt chấp nhận, bài đánh giá này sẽ bị <strong>ẨN KHỎI TẤT CẢ GIAO DIỆN CÔNG KHẢI</strong> (vẫn lưu lại trong CSDL) và hệ thống sẽ <strong>tự động gửi Email thông báo kết quả cho cả 2 bên</strong>.
            </Text>
          ) : (
            <Text>
              Yêu cầu báo cáo vi phạm này sẽ bị từ chối. Bài đánh giá vẫn được hiển thị công khai bình thường.
            </Text>
          )}

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Ghi chú xử lý của Admin (sẽ gửi qua Email):</label>
            <TextArea
              rows={3}
              placeholder={modalType === "APPROVE" ? "Nhập lý do vi phạm (ví dụ: Chứa từ ngữ thô tục, xúc phạm...)" : "Nhập lý do từ chối..."}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
