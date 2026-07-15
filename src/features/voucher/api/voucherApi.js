import api from "@/core/api/axios";
import { ENDPOINTS } from "@/core/api/endpoints";

// ── Admin ──────────────────────────────────────────────

/** Lấy toàn bộ voucher */
export const getAllVouchers = () =>
  api.get(ENDPOINTS.VOUCHERS);

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

/** Validate voucher tại checkout, orderTotal optional */
export const validateVoucher = (code, orderTotal) =>
  api.post(ENDPOINTS.VOUCHERS_VALIDATE, { code }, {
    params: orderTotal ? { orderTotal } : {},
  });
