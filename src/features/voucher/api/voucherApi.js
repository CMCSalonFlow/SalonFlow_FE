import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

// ── Admin ──────────────────────────────────────────────

/** Lấy toàn bộ voucher (hoặc theo params như salonId) */
export const getAllVouchers = (params) =>
  api.get(ENDPOINTS.VOUCHERS, { params });

/** Tạo 1 voucher đơn */
export const createVoucher = (data) =>
  api.post(ENDPOINTS.VOUCHERS, data);

/** Tạo batch voucher */
export const createBatchVouchers = (data) =>
  api.post(ENDPOINTS.VOUCHERS_BATCH, data);

/** Vô hiệu hóa voucher */
export const deactivateVoucher = (id) =>
  api.patch(`${ENDPOINTS.VOUCHERS}/${id}/deactivate`);

// ── Customer ───────────────────────────────────────────

/** Validate voucher tại checkout, orderTotal optional, salonId optional */
export const validateVoucher = (code, orderTotal, salonId) =>
  api.post(ENDPOINTS.VOUCHERS_VALIDATE, { code, salonId }, {
    params: orderTotal ? { orderTotal } : {},
  });
