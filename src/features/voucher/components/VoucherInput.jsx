import { Input, Button, Tag, Space, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useVoucherValidate } from "../hooks/useVoucherValidate";

const { Text } = Typography;

/**
 * Component áp dụng voucher tại checkout.
 *
 * Props:
 *   orderTotal (number)         - Tổng tiền trước giảm
 *   onApply ({ code, discountAmount }) - Callback khi áp dụng thành công
 *   onRemove ()                 - Callback khi gỡ voucher
 */
const VoucherInput = ({ orderTotal, onApply, onRemove }) => {
  const {
    code,
    setCode,
    applied,
    validating,
    validate,
    remove,
    discountAmount,
    formatDiscount,
    result,
  } = useVoucherValidate(orderTotal);

  const handleApply = async () => {
    await validate();
    if (result?.valid) {
      onApply?.({ code: result.code, discountAmount });
    }
  };

  const handleRemove = () => {
    remove();
    onRemove?.();
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Text strong>Mã giảm giá</Text>
      <Space.Compact style={{ width: "100%", marginTop: 6 }}>
        <Input
          placeholder="Nhập mã voucher"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={applied}
          onPressEnter={!applied ? handleApply : undefined}
          style={{ textTransform: "uppercase" }}
        />
        {applied ? (
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleRemove}
          >
            Gỡ
          </Button>
        ) : (
          <Button
            type="primary"
            loading={validating}
            onClick={handleApply}
          >
            Áp dụng
          </Button>
        )}
      </Space.Compact>

      {applied && result && (
        <div style={{ marginTop: 8 }}>
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
          >
            {result.code} — Giảm {formatDiscount()}
          </Tag>
        </div>
      )}
    </div>
  );
};

export default VoucherInput;
