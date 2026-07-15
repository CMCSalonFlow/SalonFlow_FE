import { Modal, Form, Input, Select, InputNumber, DatePicker } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const VoucherFormModal = ({ open, onClose, onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        expiresAt: values.expiresAt.toISOString(),
      };
      const ok = await onSubmit(payload);
      if (ok) {
        form.resetFields();
        onClose();
      }
    } catch {
      // validation error — antd tự hiển thị
    }
  };

  return (
    <Modal
      title="Tạo Voucher"
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="code"
          label="Mã voucher"
          rules={[
            { required: true, message: "Vui lòng nhập mã" },
            { pattern: /^[A-Z0-9_-]+$/, message: "Chỉ chữ hoa, số, _ hoặc -" },
            { min: 4, message: "Tối thiểu 4 ký tự" },
          ]}
        >
          <Input
            placeholder="VD: SALE50"
            style={{ textTransform: "uppercase" }}
            onChange={(e) =>
              form.setFieldValue("code", e.target.value.toUpperCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="discountType"
          label="Loại giảm giá"
          rules={[{ required: true, message: "Chọn loại giảm giá" }]}
        >
          <Select placeholder="Chọn loại">
            <Option value="FIXED">Giảm tiền cố định (VNĐ)</Option>
            <Option value="PERCENT">Giảm theo phần trăm (%)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="discountValue"
          label="Giá trị giảm"
          rules={[{ required: true, message: "Nhập giá trị giảm" }]}
        >
          <InputNumber
            min={0.01}
            style={{ width: "100%" }}
            placeholder="VD: 50000 hoặc 10"
          />
        </Form.Item>

        <Form.Item
          name="maxUses"
          label="Số lần dùng tối đa"
          rules={[{ required: true, message: "Nhập số lần dùng" }]}
          initialValue={1}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="expiresAt"
          label="Ngày hết hạn"
          rules={[{ required: true, message: "Chọn ngày hết hạn" }]}
        >
          <DatePicker
            showTime
            style={{ width: "100%" }}
            disabledDate={(d) => d && d.isBefore(dayjs())}
            format="DD/MM/YYYY HH:mm"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VoucherFormModal;
