import React, { useState } from "react";
import { Button, Tooltip } from "antd";
import { RetweetOutlined } from "@ant-design/icons";
import RecurringBookingModal from "./RecurringBookingModal";

/**
 * RecurringBookingButton
 *
 * Props:
 *   branchId:     number           – ID chi nhánh (bắt buộc)
 *   initialDate?: string           – YYYY-MM-DD, pre-fill ngày bắt đầu
 *   onSuccess?:   () => void       – callback sau khi đặt xong
 *   buttonProps?: AntD ButtonProps – override style/size/...
 */
export default function RecurringBookingButton({ branchId, initialDate, onSuccess, buttonProps = {} }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Đặt lịch định kỳ (hàng tuần / 2 tuần)">
        <Button
          icon={<RetweetOutlined />}
          onClick={() => setOpen(true)}
          style={{ borderColor: "#b5865a", color: "#b5865a" }}
          {...buttonProps}
        >
          Đặt lịch định kỳ
        </Button>
      </Tooltip>

      <RecurringBookingModal
        open={open}
        branchId={branchId}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); onSuccess?.(); }}
        initialDate={initialDate}
      />
    </>
  );
}
