import { Modal, Form, Input, Select, InputNumber, DatePicker, Row, Col } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const VoucherFormModal = ({ open, onClose, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const discountType = Form.useWatch("discountType", form);

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
      title="Tạo Voucher Mới"
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okText="Tạo mới"
      cancelText="Hủy"
      confirmLoading={loading}
      centered
      width={560}
      destroyOnClose
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
            placeholder="VD: SALE50, TET2026"
            style={{ textTransform: "uppercase" }}
            onChange={(e) =>
              form.setFieldValue("code", e.target.value.toUpperCase())
            }
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="discountValue"
              label="Giá trị giảm"
              rules={[{ required: true, message: "Nhập giá trị giảm" }]}
            >
              <InputNumber
                min={0.01}
                style={{ width: "100%" }}
                placeholder={discountType === "PERCENT" ? "VD: 10 (%)" : "VD: 50000 (VNĐ)"}
                formatter={(value) =>
                  discountType === "FIXED" && value
                    ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    : value
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Điều kiện áp dụng */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="minOrderAmount"
              label="Đơn hàng tối thiểu (VNĐ)"
              tooltip="Áp dụng khi tổng đơn hàng đạt từ mức này trở lên"
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                placeholder="VD: 200000 (Để trống = 0đ)"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            {discountType === "PERCENT" ? (
              <Form.Item
                name="maxDiscountAmount"
                label="Mức giảm tối đa (VNĐ)"
                tooltip="Số tiền giảm tối đa nếu tính theo phần trăm"
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="VD: 100000 (Không giới hạn)"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="maxUses"
                label="Số lần dùng tối đa"
                tooltip="Tổng số lượt mã này có thể được áp dụng trên toàn hệ thống"
                rules={[{ required: true, message: "Nhập số lần dùng" }]}
                initialValue={100}
              >
                <InputNumber min={1} style={{ width: "100%" }} placeholder="VD: 100" />
              </Form.Item>
            )}
          </Col>
        </Row>

        {discountType === "PERCENT" && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxUses"
                label="Số lần dùng tối đa"
                tooltip="Tổng số lượt mã này có thể được áp dụng trên toàn hệ thống"
                rules={[{ required: true, message: "Nhập số lần dùng" }]}
                initialValue={100}
              >
                <InputNumber min={1} style={{ width: "100%" }} placeholder="VD: 100" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            </Col>
          </Row>
        )}

        {discountType !== "PERCENT" && (
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
        )}
      </Form>
    </Modal>
  );
};

export default VoucherFormModal;
