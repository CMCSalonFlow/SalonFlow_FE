import { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    Space,
    Button,
    message,
    Alert,
    Tooltip,
    Progress,
    Tag,
    Row,
    Col
} from "antd";
import {
    RocketOutlined
} from "@ant-design/icons";

import { getCategoriesApi } from "../api/serviceApi";
import { getMySalonApi } from "@/features/salon/api/salonApi";
import {
    generateServiceDescriptionApi,
    getServiceDescriptionQuotaApi
} from "@/features/service-description-ai/api/serviceDescriptionAiApi";

const normalizeText = (value) => {
    if (value === null || value === undefined) return "";
    return String(value).trim();
};

export default function ServiceFormModal({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    enableAiDescription = false
}) {
    const [form] = Form.useForm();
    const depositRequired = Form.useWatch("depositRequired", form);

    const [categories, setCategories] = useState([]);
    const [salon, setSalon] = useState(null);
    const [quota, setQuota] = useState(null);
    const [loadingAiMeta, setLoadingAiMeta] = useState(false);
    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [descriptionKeywords, setDescriptionKeywords] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategoriesApi();
                setCategories(data || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        if (visible) {
            fetchCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || !enableAiDescription) return;

        let cancelled = false;

        const loadAiMeta = async () => {
            setLoadingAiMeta(true);
            try {
                const salonData = await getMySalonApi();
                if (cancelled) return;

                setSalon(salonData || null);

                if (salonData?.id) {
                    const quotaData = await getServiceDescriptionQuotaApi(salonData.id);
                    if (!cancelled) {
                        setQuota(quotaData || null);
                    }
                }
            } catch (error) {
                if (!cancelled) {
                    setSalon(null);
                    setQuota(null);
                    message.error(error?.response?.data?.message || "Không thể tải thông tin AI mô tả dịch vụ.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingAiMeta(false);
                }
            }
        };

        loadAiMeta();

        return () => {
            cancelled = true;
        };
    }, [visible, enableAiDescription]);

    const syncModalState = () => {
        if (initialValues) {
            form.setFieldsValue({
                categoryId: initialValues.categoryId,
                name: initialValues.name,
                price: initialValues.price,
                durationMinutes: initialValues.durationMinutes,
                description: initialValues.description,
                depositRequired: initialValues.depositRequired ?? false,
                depositPercentage: initialValues.depositPercentage,
                isActive: initialValues.isActive !== false
            });
            setDescriptionKeywords([]);
        } else {
            form.resetFields();
            form.setFieldsValue({
                isActive: true,
                depositRequired: false,
                depositPercentage: null
            });
            setDescriptionKeywords([]);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                depositRequired: values.depositRequired ?? false,
                depositPercentage: values.depositRequired ? values.depositPercentage : null
            };
            onSubmit(payload);
        } catch (error) {
            console.error(error);
        }
    };

    const remainingToday = Number(quota?.remainingToday ?? 0);
    const quotaLimit = Number(quota?.dailyLimit ?? 0);
    const usedToday = Number(quota?.usedToday ?? 0);
    const quotaPercent = quotaLimit > 0 ? Math.min(100, Math.round((usedToday / quotaLimit) * 100)) : 0;
    const isQuotaExhausted = quotaLimit > 0 && remainingToday <= 0;

    const handleGenerateDescription = async () => {
        const serviceName = normalizeText(form.getFieldValue("name"));

        if (!salon?.id) {
            message.warning("Chưa có salon để dùng AI mô tả dịch vụ.");
            return;
        }

        if (!serviceName) {
            message.warning("Vui lòng nhập tên dịch vụ trước khi tạo mô tả.");
            return;
        }

        if (descriptionKeywords.length < 3 || descriptionKeywords.length > 5) {
            message.warning("Vui lòng nhập từ 3 đến 5 keywords.");
            return;
        }

        if (isQuotaExhausted) {
            message.error("Hôm nay salon đã dùng hết lượt AI.");
            return;
        }

        setGeneratingDescription(true);
        try {
            const data = await generateServiceDescriptionApi(salon.id, {
                serviceName,
                keywords: descriptionKeywords
            });

            const generatedDescription = data?.generatedDescription || "";
            form.setFieldValue("description", generatedDescription);

            if (typeof data?.remainingToday === "number") {
                setQuota({
                    salonId: data.salonId ?? salon.id,
                    usedToday: data.usedToday,
                    dailyLimit: data.dailyLimit,
                    remainingToday: data.remainingToday,
                    quotaDate: quota?.quotaDate,
                    resetAt: quota?.resetAt
                });
            }

            message.success("Đã tạo mô tả bằng AI.");
        } catch (error) {
            if (error?.response?.status === 429) {
                message.error("Hôm nay salon đã dùng hết lượt AI.");
            } else {
                message.error(error?.response?.data?.message || "Không thể tạo mô tả dịch vụ.");
            }
        } finally {
            setGeneratingDescription(false);
        }
    };

    return (
        <Modal
            title={initialValues ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={600}
            centered
            destroyOnClose
            afterOpenChange={(open) => {
                if (open) {
                    syncModalState();
                }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 20 }}
            >
                {/* 1. Danh mục dịch vụ */}
                <Form.Item
                    name="categoryId"
                    label="Danh mục dịch vụ"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng chọn danh mục dịch vụ!"
                        }
                    ]}
                >
                    <Select
                        placeholder="Chọn danh mục"
                        allowClear
                        size="large"
                    >
                        {categories.map(cat => (
                            <Select.Option key={cat.id} value={cat.id}>
                                {cat.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                {/* 2. Tên dịch vụ */}
                <Form.Item
                    name="name"
                    label="Tên dịch vụ"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên dịch vụ!"
                        }
                    ]}
                >
                    <Input placeholder="Ví dụ: Cắt tóc nam Standard" size="large" />
                </Form.Item>

                {/* 3. Giá dịch vụ & Thời gian */}
                <div style={{ display: "flex", gap: 16 }}>
                    <Form.Item
                        name="price"
                        label="Giá dịch vụ"
                        style={{ flex: 1 }}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập giá!"
                            }
                        ]}
                    >
                        <InputNumber
                            min={0}
                            size="large"
                            style={{ width: "100%" }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        />
                    </Form.Item>

                    <Form.Item
                        name="durationMinutes"
                        label="Thời gian (phút)"
                        style={{ flex: 1 }}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn thời gian!"
                            }
                        ]}
                    >
                        <Select size="large">
                            <Select.Option value={15}>15 phút</Select.Option>
                            <Select.Option value={30}>30 phút</Select.Option>
                            <Select.Option value={45}>45 phút</Select.Option>
                            <Select.Option value={60}>60 phút</Select.Option>
                            <Select.Option value={75}>75 phút</Select.Option>
                            <Select.Option value={90}>90 phút</Select.Option>
                            <Select.Option value={120}>120 phút</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                {/* 4. Mô tả */}
                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Mô tả ngắn..."
                    />
                </Form.Item>

                {/* 5. AI Mô Tả */}
                <div
                    style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 12,
                        marginTop: -4,
                        marginBottom: 20,
                        background: enableAiDescription ? "#fbfdff" : "#fafafa"
                    }}
                >
                    <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
                            <Space wrap>
                                <Tag color={enableAiDescription ? "blue" : "default"}>AI mô tả</Tag>
                                {enableAiDescription && quota ? (
                                    <>
                                        <Tag color="green">Còn {quota.remainingToday ?? 0}/{quota.dailyLimit ?? 0}</Tag>
                                        <Progress
                                            percent={quotaPercent}
                                            size="small"
                                            style={{ width: 120 }}
                                            status={isQuotaExhausted ? "exception" : "active"}
                                        />
                                    </>
                                ) : null}
                            </Space>
                            <Tooltip title={enableAiDescription ? "" : "Yêu cầu gói ENTERPRISE để sử dụng AI"}>
                                <Button
                                    icon={<RocketOutlined />}
                                    onClick={handleGenerateDescription}
                                    loading={generatingDescription || loadingAiMeta}
                                    disabled={!enableAiDescription || isQuotaExhausted}
                                >
                                    Tạo mô tả bằng AI
                                </Button>
                            </Tooltip>
                        </Space>

                        <Select
                            mode="tags"
                            tokenSeparators={[","]}
                            value={descriptionKeywords}
                            onChange={(next) => setDescriptionKeywords(next.slice(0, 5))}
                            placeholder="Nhập 3-5 keywords, ví dụ: layer, mềm mại, phù hợp mặt tròn"
                            style={{ width: "100%" }}
                            disabled={!enableAiDescription || isQuotaExhausted}
                            maxTagCount="responsive"
                            options={[]}
                        />

                        {enableAiDescription && isQuotaExhausted ? (
                            <Alert
                                type="error"
                                showIcon
                                message="Hôm nay salon đã dùng hết lượt AI."
                            />
                        ) : null}
                    </Space>
                </div>

                {/* 6. Yêu cầu đặt cọc & Trạng thái */}
                <Row gutter={16} style={{ marginBottom: depositRequired ? 12 : 16 }}>
                    <Col span={12}>
                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "#fafafa",
                                borderRadius: 8,
                                border: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <span style={{ fontWeight: 600, color: "#262626" }}>Yêu cầu đặt cọc</span>
                            <Form.Item
                                name="depositRequired"
                                valuePropName="checked"
                                noStyle
                            >
                                <Switch
                                    checkedChildren="Có"
                                    unCheckedChildren="Không"
                                    onChange={(checked) => {
                                        if (!checked) {
                                            form.setFieldValue("depositPercentage", null);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </div>
                    </Col>

                    <Col span={12}>
                        <div
                            style={{
                                padding: "12px 16px",
                                backgroundColor: "#fafafa",
                                borderRadius: 8,
                                border: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <span style={{ fontWeight: 600, color: "#262626" }}>Trạng thái</span>
                            <Form.Item
                                name="isActive"
                                valuePropName="checked"
                                noStyle
                            >
                                <Switch
                                    checkedChildren="Hoạt động"
                                    unCheckedChildren="Tạm ngưng"
                                />
                            </Form.Item>
                        </div>
                    </Col>
                </Row>

                {depositRequired && (
                    <Form.Item
                        name="depositPercentage"
                        label="Tỷ lệ đặt cọc (%)"
                        style={{ marginTop: 8 }}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tỷ lệ đặt cọc!"
                            },
                            {
                                type: "number",
                                min: 1,
                                max: 100,
                                message: "Giá trị phải từ 1 đến 100%"
                            }
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={100}
                            style={{ width: "100%" }}
                            addonAfter="%"
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
}
