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
    List,
    message,
    Upload,
    Alert,
    Tooltip,
    Progress,
    Tag
} from "antd";
import {
    DeleteOutlined,
    RocketOutlined,
    UploadOutlined
} from "@ant-design/icons";

import { getCategoriesApi } from "../api/serviceApi";
import { uploadMediaApi } from "@/features/media/api/mediaApi";
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

    const [photoList, setPhotoList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [salon, setSalon] = useState(null);
    const [quota, setQuota] = useState(null);
    const [loadingAiMeta, setLoadingAiMeta] = useState(false);
    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [descriptionKeywords, setDescriptionKeywords] = useState([]);

    useEffect(() => {

        const fetchCategories = async () => {
            try {
                const data = await getCategoriesApi();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        if (visible) {
            fetchCategories();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || !enableAiDescription) {
            return;
        }

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
                name: initialValues.name,
                price: initialValues.price,
                durationMinutes: initialValues.durationMinutes,
                categoryId: initialValues.categoryId,
                description: initialValues.description,
                isActive: initialValues.isActive !== false,
                depositRequired: initialValues.depositRequired ?? false,
                depositPercentage: initialValues.depositPercentage
            });
            setPhotoList(
                (initialValues.images || []).map((url, index) => ({
                    uid: `existing-${index}-${url}`,
                    name: `image-${index + 1}`,
                    status: "done",
                    url
                }))
            );
            setDescriptionKeywords([]);
        } else {
            form.resetFields();
            form.setFieldsValue({
                isActive: true,
                depositRequired: false,
                depositPercentage: null
            });
            setPhotoList([]);
            setDescriptionKeywords([]);
        }
    };

    const handleCustomUpload = async ({ file, onSuccess, onError }) => {
        try {
            setUploading(true);
            const localPreview = URL.createObjectURL(file);
            const tempUid = file.uid || `photo-${Date.now()}-${Math.random()}`;

            setPhotoList((prev) => [
                ...prev,
                {
                    uid: tempUid,
                    name: file.name || "image.png",
                    status: "uploading",
                    url: localPreview,
                    thumbUrl: localPreview
                }
            ]);

            const response = await uploadMediaApi(file);
            const imageUrl = response?.url || response?.fileUrl;

            if (!imageUrl) {
                throw new Error("Không nhận được URL ảnh từ server");
            }

            setPhotoList((prev) =>
                prev.map((item) =>
                    item.uid === tempUid
                        ? {
                            ...item,
                            status: "done",
                            url: imageUrl,
                            thumbUrl: imageUrl,
                            serverUrl: imageUrl
                        }
                        : item
                )
            );

            onSuccess?.(response, file);
            message.success("Upload ảnh thành công");
        } catch (error) {
            setPhotoList((prev) => prev.filter((item) => item.uid !== file.uid));
            message.error(error?.response?.data?.message || error.message || "Lỗi khi upload ảnh.");
            onError?.(error);
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = (file) => {
        setPhotoList((prev) => prev.filter((item) => item.uid !== file.uid));
        return true;
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                ...values,
                depositRequired:
                    values.depositRequired ?? false,
                depositPercentage:
                    values.depositRequired
                        ? values.depositPercentage
                        : null,
                images: photoList
                    .filter((item) => item.status === "done" && (item.serverUrl || item.url))
                    .map((item) => item.serverUrl || item.url)
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
            title={
                initialValues
                    ? "Chỉnh sửa dịch vụ"
                    : "Thêm dịch vụ mới"
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            width={650}
            confirmLoading={uploading}
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
                    <Input placeholder="Ví dụ: Cắt tóc nam Standard" />
                </Form.Item>

                <Form.Item
                    name="categoryId"
                    label="Danh mục dịch vụ"
                >
                    <Select
                        placeholder="Chọn danh mục"
                        allowClear
                    >
                        {categories.map(cat => (
                            <Select.Option
                                key={cat.id}
                                value={cat.id}
                            >
                                {cat.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <div
                    style={{
                        display: "flex",
                        gap: 16
                    }}
                >

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
                            style={{ width: "100%" }}
                            formatter={(value) =>
                                `${value}`.replace(
                                    /\B(?=(\d{3})+(?!\d))/g,
                                    ","
                                )
                            }
                            parser={(value) =>
                                value.replace(/\$\s?|(,*)/g, "")
                            }
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
                        <Select>
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

                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <Input.TextArea
                        rows={5}
                        placeholder="Mô tả ngắn..."
                    />
                </Form.Item>

                <div
                    style={{
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 12,
                        marginTop: -8,
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

                <Form.Item
                    name="depositRequired"
                    label="Yêu cầu đặt cọc"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="Có"
                        unCheckedChildren="Không"
                        onChange={(checked) => {

                            if (!checked) {

                                form.setFieldValue(
                                    "depositPercentage",
                                    null
                                );

                            }

                        }}
                    />
                </Form.Item>

                {depositRequired && (

                    <Form.Item
                        name="depositPercentage"
                        label="Tỷ lệ đặt cọc (%)"
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

                <Form.Item
                    name="isActive"
                    label="Trạng thái"
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren="Hoạt động"
                        unCheckedChildren="Tạm ngưng"
                    />
                </Form.Item>

                <div style={{ marginBottom: 20 }}>

                    <label
                        style={{
                            display: "block",
                            marginBottom: 8
                        }}
                    >
                        Album hình ảnh
                    </label>

                    <Upload
                        customRequest={handleCustomUpload}
                        fileList={photoList}
                        onRemove={handleRemovePhoto}
                        listType="picture-card"
                        accept="image/*"
                        maxCount={10}
                    >
                        {photoList.length < 10 ? (
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>Tải ảnh</div>
                            </div>
                        ) : null}
                    </Upload>

                    <List
                        bordered
                        size="small"
                        dataSource={photoList.filter((item) => item.status === "done")}
                        locale={{
                            emptyText:
                                "Chưa có hình ảnh."
                        }}
                        renderItem={(item) => (

                            <List.Item
                                actions={[
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemovePhoto(item)}
                                    />
                                ]}
                            >

                                <Space>

                                    <img
                                        src={item.url}
                                        alt=""
                                        style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: "cover",
                                            borderRadius: 4
                                        }}
                                    />

                                    <span
                                        style={{
                                            maxWidth: 420,
                                            overflow: "hidden",
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis"
                                        }}
                                    >
                                        {item.url}
                                    </span>
                                </Space>
                            </List.Item>
                        )}
                    />
                </div>
            </Form>
        </Modal>
    );
}
