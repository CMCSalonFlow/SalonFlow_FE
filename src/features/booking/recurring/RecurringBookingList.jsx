import React, { useEffect, useState } from "react";
import {
  Table, Tag, Space, Typography, Button,
  Popconfirm, message, Skeleton, Empty,
} from "antd";
import { ReloadOutlined, StopOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import api from "@/core/api/axios";

dayjs.locale("vi");

const { Text } = Typography;

const PATTERN_LABEL = { WEEKLY: "Hàng tuần", BIWEEKLY: "2 tuần / lần" };
const STATUS_COLOR  = { ACTIVE: "green", CANCELLED: "red", COMPLETED: "default" };
const STATUS_LABEL  = { ACTIVE: "Đang hoạt động", CANCELLED: "Đã huỷ", COMPLETED: "Hoàn tất" };

/**
 * RecurringBookingList
 *
 * Props:
 *   branchId:     number   – ID chi nhánh (bắt buộc)
 *   customerId?:  number   – filter theo khách hàng
 *   refreshKey?:  any      – thay đổi giá trị này để trigger reload
 */
export default function RecurringBookingList({ branchId, customerId, refreshKey }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!branchId) return;
    setLoading(true);
    api
      .get(`/api/v1/branches/${branchId}/recurring-bookings`, {
        params: customerId ? { customerId } : undefined,
      })
      .then((res) => setData(res.data?.data || res.data || []))
      .catch((err) =>
        message.error(err?.response?.data?.message || "Không thể tải lịch định kỳ")
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [branchId, customerId, refreshKey]);

  const handleCancel = (id) => {
    api
      .delete(`/api/v1/recurring-bookings/${id}`)
      .then(() => { message.success("Đã huỷ lịch định kỳ"); load(); })
      .catch((err) =>
        message.error(err?.response?.data?.message || "Không thể huỷ")
      );
  };

  const columns = [
    {
      title: "Dịch vụ",
      dataIndex: "serviceName",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Stylist",
      dataIndex: "stylistName",
    },
    {
      title: "Giờ",
      dataIndex: "time",
      render: (v) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: "#b5865a" }} />
          {v}
        </Space>
      ),
    },
    {
      title: "Tần suất",
      dataIndex: "pattern",
      render: (v) => (
        <Tag icon={<ReloadOutlined />} color="gold">
          {PATTERN_LABEL[v] || v}
        </Tag>
      ),
    },
    {
      title: "Khoảng thời gian",
      render: (_, row) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(row.startDate).format("DD/MM/YYYY")} → {dayjs(row.endDate).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Số lịch",
      dataIndex: "totalOccurrences",
      align: "center",
      render: (v) => <Tag color="blue">{v} lịch</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (v) => (
        <Tag color={STATUS_COLOR[v] || "default"}>{STATUS_LABEL[v] || v}</Tag>
      ),
    },
    {
      title: "",
      align: "right",
      render: (_, row) =>
        row.status === "ACTIVE" ? (
          <Popconfirm
            title="Huỷ tất cả lịch còn lại trong chu kỳ này?"
            okText="Huỷ lịch"
            cancelText="Không"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleCancel(row.id)}
          >
            <Button size="small" danger icon={<StopOutlined />}>
              Huỷ định kỳ
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      pagination={{ pageSize: 10, showSizeChanger: false }}
      locale={{
        emptyText: (
          <Empty
            description="Chưa có lịch định kỳ nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
      style={{ borderRadius: 8, overflow: "hidden" }}
    />
  );
}