import { Modal, Form, Input, Select, InputNumber, DatePicker } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const VoucherBatchModal = ({ open, onClose, onSubmit, loading }) => {
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
      // validation error
    }
  };

  return (
    <Modal
      title="Tạo Batch Voucher"
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okText="Tạo Batch"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="prefix"
          label="Prefix (tiền tố)"
          rules={[
            { required: true, message: "Nhập prefix" },
            { pattern: /^[A-Z0-9]+$/, message: "Chỉ chữ hoa và số" },
            { max: 20, message: "Tối đa 20 ký tự" },
          ]}
          extra="Code sẽ có dạng: PREFIX_XXXXXX"
        >
          <Input
            placeholder="VD: SUMMER"
            onChange={(e) =>
              form.setFieldValue("prefix", e.target.value.toUpperCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Số lượng voucher"
          rules={[{ required: true, message: "Nhập số lượng" }]}
          initialValue={10}
        >
          <InputNumber min={1} max={500} style={{ width: "100%" }} />
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
          <InputNumber min={0.01} style={{ width: "100%" }} />
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

export default VoucherBatchModal;
