import { useState } from "react";
import {
  Button,
  Table,
  Tag,
  Popconfirm,
  Typography,
  Grid,
} from "antd";
import { PlusOutlined, StopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useVoucher } from "../hooks/useVoucher";
import VoucherFormModal from "../components/VoucherFormModal";

const { Title } = Typography;

const VoucherManagementPage = () => {
  const screens = Grid.useBreakpoint();
  const {
    vouchers,
    loading,
    handleCreate,
    handleDeactivate,
  } = useVoucher();

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmitCreate = async (values) => {
    setSubmitting(true);
    const ok = await handleCreate(values);
    setSubmitting(false);
    return ok;
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Loại",
      dataIndex: "discountType",
      key: "discountType",
      render: (type) =>
        type === "FIXED" ? (
          <Tag color="green">Cố định</Tag>
        ) : (
          <Tag color="orange">Phần trăm</Tag>
        ),
    },
    {
      title: "Giá trị",
      key: "discountValue",
      render: (_, r) =>
        r.discountType === "FIXED"
          ? `${Number(r.discountValue).toLocaleString("vi-VN")}đ`
          : `${r.discountValue}%`,
    },
    {
      title: "Điều kiện áp dụng",
      key: "minOrderAmount",
      render: (_, r) => (
        <div>
          {r.minOrderAmount ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1677ff" }}>
              Đơn từ: {Number(r.minOrderAmount).toLocaleString("vi-VN")}đ
            </div>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Không giới hạn
            </Typography.Text>
          )}
          {r.discountType === "PERCENT" && r.maxDiscountAmount ? (
            <div style={{ fontSize: 11, color: "#8c8c8c" }}>
              Giảm tối đa: {Number(r.maxDiscountAmount).toLocaleString("vi-VN")}đ
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: "Đã dùng / Tối đa",
      key: "uses",
      render: (_, r) => `${r.usedCount} / ${r.maxUses}`,
    },
    {
      title: "Hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (active, r) => {
        const expired = dayjs().isAfter(dayjs(r.expiresAt));
        if (!active) return <Tag color="red">Đã tắt</Tag>;
        if (expired) return <Tag color="default">Hết hạn</Tag>;
        if (r.usedCount >= r.maxUses) return <Tag color="warning">Hết lượt</Tag>;
        return <Tag color="success">Hoạt động</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, r) =>
        r.isActive ? (
          <Popconfirm
            title="Vô hiệu hóa voucher này?"
            onConfirm={() => handleDeactivate(r.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
            >
              Tắt
            </Button>
          </Popconfirm>
        ) : (
          <Tag color="default">Đã tắt</Tag>
        ),
    },
  ];

  return (
    <div style={{ padding: screens.xs ? "12px 4px" : 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Title level={screens.xs ? 4 : 3} style={{ margin: 0 }}>
          Quản lý Voucher
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
          size={screens.xs ? "middle" : "large"}
        >
          Tạo voucher mới
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={vouchers}
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{ pageSize: 10 }}
      />

      <VoucherFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={onSubmitCreate}
        loading={submitting}
      />
    </div>
  );
};

export default VoucherManagementPage;
