import { useState } from "react";
import { message } from "antd";
import { validateVoucher } from "../api/voucherApi";

/**
 * Hook dùng tại bước checkout để validate và áp dụng voucher.
 * @param {number} orderTotal - Tổng tiền đơn hàng (để tính discountAmount)
 */
export const useVoucherValidate = (orderTotal) => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // ValidateVoucherResponse
  const [validating, setValidating] = useState(false);
  const [applied, setApplied] = useState(false);

  const validate = async () => {
    if (!code.trim()) {
      message.warning("Vui lòng nhập mã voucher.");
      return;
    }
    setValidating(true);
    try {
      const res = await validateVoucher(code.trim().toUpperCase(), orderTotal);
      const data = res.data;
      if (data.valid) {
        setResult(data);
        setApplied(true);
        message.success(`Áp dụng thành công! Giảm ${formatDiscount(data)}`);
      } else {
        setResult(null);
        setApplied(false);
        message.error(data.message);
      }
    } catch {
      message.error("Không thể kiểm tra voucher, vui lòng thử lại.");
    } finally {
      setValidating(false);
    }
  };

  const remove = () => {
    setCode("");
    setResult(null);
    setApplied(false);
  };

  const formatDiscount = (data) => {
    if (!data) return "";
    if (data.discountType === "FIXED") {
      return `${Number(data.discountAmount).toLocaleString("vi-VN")}đ`;
    }
    return `${data.discountValue}% (${Number(data.discountAmount).toLocaleString("vi-VN")}đ)`;
  };

  /** Số tiền thực tế được giảm để tính tổng cuối */
  const discountAmount = result?.discountAmount ? Number(result.discountAmount) : 0;

  return {
    code,
    setCode,
    result,
    applied,
    validating,
    validate,
    remove,
    discountAmount,
    formatDiscount: () => formatDiscount(result),
  };
};
