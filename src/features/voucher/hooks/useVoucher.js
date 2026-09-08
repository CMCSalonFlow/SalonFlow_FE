import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  getAllVouchers,
  createVoucher,
  createBatchVouchers,
  deactivateVoucher,
} from "../api/voucherApi";

export const useVoucher = (salonId, enabled = true) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = salonId ? { salonId } : {};
      const res = await getAllVouchers(params);
      setVouchers(res.data);
    } catch {
      message.error("Không thể tải danh sách voucher.");
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    if (enabled) {
      fetchVouchers();
    }
  }, [fetchVouchers, enabled]);

  const handleCreate = async (values) => {
    try {
      await createVoucher(values);
      message.success("Tạo voucher thành công!");
      fetchVouchers();
      return true;
    } catch (err) {
      message.error(err.response?.data?.message || "Tạo voucher thất bại.");
      return false;
    }
  };

  const handleCreateBatch = async (values) => {
    try {
      const res = await createBatchVouchers(values);
      message.success(`Đã tạo ${res.data.length} voucher thành công!`);
      fetchVouchers();
      return true;
    } catch (err) {
      message.error(err.response?.data?.message || "Tạo batch thất bại.");
      return false;
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await deactivateVoucher(id);
      message.success("Đã vô hiệu hóa voucher.");
      fetchVouchers();
    } catch {
      message.error("Vô hiệu hóa thất bại.");
    }
  };

  return {
    vouchers,
    loading,
    fetchVouchers,
    handleCreate,
    handleCreateBatch,
    handleDeactivate,
  };
};
