import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Input,
    Progress,
    Row,
    Select,
    Space,
    Spin,
    Tag,
    Typography,
    message
} from "antd";
import { FileTextOutlined, ReloadOutlined, RocketOutlined, SaveOutlined } from "@ant-design/icons";

import { getMySalonApi } from "@/features/salon/api/salonApi";
import { generateServiceDescriptionApi, getServiceDescriptionQuotaApi } from "../api/serviceDescriptionAiApi";
import { updateServiceApi } from "@/features/service/api/serviceApi";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const normalizeText = (value) => {
    if (value === null || value === undefined) return "";
    return String(value).trim();
};

const buildUpdatePayload = (service, description) => ({
    name: service.name,
    categoryId: service.categoryId ?? null,
    price: service.price,
    durationMinutes: service.durationMinutes,
    description,
    depositRequired: service.depositRequired ?? false,
    depositPercentage: service.depositRequired ? service.depositPercentage ?? null : null,
    images: Array.isArray(service.images) ? service.images : [],
    isActive: service.isActive ?? true
});

export default function ServiceDescriptionAiPanel({
    selectedBranchId,
    services = [],
    onCreateDraft,
    onSaved
}) {
    const [loadingSalon, setLoadingSalon] = useState(true);
    const [loadingQuota, setLoadingQuota] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    const [salon, setSalon] = useState(null);
    const [quota, setQuota] = useState(null);

    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [serviceName, setServiceName] = useState("");
    const [keywords, setKeywords] = useState([]);
    const [generatedDescription, setGeneratedDescription] = useState("");
    const [activeDescription, setActiveDescription] = useState("");

    const selectedService = useMemo(
        () => services.find((item) => String(item.id) === String(selectedServiceId)) || null,
        [services, selectedServiceId]
    );

    useEffect(() => {
        const loadSalon = async () => {
            setLoadingSalon(true);
            try {
                const data = await getMySalonApi();
                setSalon(data || null);
            } catch (error) {
                if (error?.response?.status === 404) {
                    setSalon(null);
                } else {
                    message.error(error?.response?.data?.message || "Không thể tải salon hiện tại.");
                }
            } finally {
                setLoadingSalon(false);
            }
        };

        loadSalon();
    }, []);

    useEffect(() => {
        if (!salon?.id) {
            return;
        }

        let cancelled = false;

        const run = async () => {
            setLoadingQuota(true);
            try {
                const data = await getServiceDescriptionQuotaApi(salon.id);
                if (!cancelled) {
                    setQuota(data || null);
                }
            } catch (error) {
                if (!cancelled) {
                    message.error(error?.response?.data?.message || "Không thể tải quota AI mô tả dịch vụ.");
                }
            } finally {
                if (!cancelled) {
                    setLoadingQuota(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [salon?.id]);

    const remainingToday = Number(quota?.remainingToday ?? 0);
    const quotaLimit = Number(quota?.dailyLimit ?? 0);
    const usedToday = Number(quota?.usedToday ?? 0);
    const quotaPercent = quotaLimit > 0 ? Math.min(100, Math.round((usedToday / quotaLimit) * 100)) : 0;
    const isQuotaExhausted = quotaLimit > 0 && remainingToday <= 0;

    const handleSelectServiceChange = (value) => {
        setSelectedServiceId(value);

        const nextService = services.find((item) => String(item.id) === String(value)) || null;
        if (nextService) {
            setServiceName(nextService.name || "");
            setGeneratedDescription(nextService.description || "");
            setActiveDescription(nextService.description || "");
            setKeywords([]);
        }
    };

    const handleGenerate = async () => {
        const trimmedServiceName = normalizeText(serviceName);

        if (!salon?.id) {
            message.warning("Chưa có salon để dùng AI mô tả dịch vụ.");
            return;
        }

        if (!trimmedServiceName) {
            message.warning("Vui lòng nhập tên dịch vụ.");
            return;
        }

        if (keywords.length < 3 || keywords.length > 5) {
            message.warning("Vui lòng nhập từ 3 đến 5 keywords.");
            return;
        }

        if (isQuotaExhausted) {
            message.error("Hôm nay salon đã dùng hết lượt AI");
            return;
        }

        setGenerating(true);
        try {
            const data = await generateServiceDescriptionApi(salon.id, {
                serviceName: trimmedServiceName,
                keywords
            });

            const draft = data?.generatedDescription || "";
            setGeneratedDescription(draft);
            setActiveDescription(draft);

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

            message.success("Đã tạo mô tả nháp thành công.");
        } catch (error) {
            if (error?.response?.status === 429) {
                message.error("Hôm nay salon đã dùng hết lượt AI");
            } else {
                message.error(error?.response?.data?.message || "Không thể tạo mô tả dịch vụ.");
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveToExistingService = async () => {
        if (!selectedService) {
            message.warning("Vui lòng chọn một dịch vụ hiện có để lưu.");
            return;
        }

        const description = normalizeText(activeDescription);
        if (!description) {
            message.warning("Mô tả dịch vụ không được để trống.");
            return;
        }

        if (!selectedBranchId) {
            message.warning("Không có chi nhánh đang chọn.");
            return;
        }

        setSaving(true);
        try {
            const payload = buildUpdatePayload(selectedService, description);
            await updateServiceApi(selectedBranchId, selectedService.id, payload);
            message.success("Đã lưu mô tả vào dịch vụ hiện có.");
            if (onSaved) {
                await onSaved();
            }
        } catch (error) {
            message.error(error?.response?.data?.message || "Không thể lưu mô tả vào dịch vụ.");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenCreateDraft = () => {
        const description = normalizeText(activeDescription || generatedDescription);

        if (!normalizeText(serviceName)) {
            message.warning("Vui lòng nhập tên dịch vụ trước.");
            return;
        }

        if (!description) {
            message.warning("Vui lòng generate hoặc nhập mô tả trước.");
            return;
        }

        if (onCreateDraft) {
            onCreateDraft({
                name: serviceName.trim(),
                description,
                isActive: true,
                depositRequired: false,
                depositPercentage: null
            });
            message.success("Đã đưa mô tả vào form tạo dịch vụ mới.");
        }
    };

    const canSaveExisting = Boolean(selectedService && normalizeText(activeDescription));

    return (
        <Card
            style={{
                borderRadius: 18,
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                border: "1px solid #eef2f7"
            }}
        >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div>
                    <Title level={4} style={{ marginBottom: 4 }}>
                        <FileTextOutlined style={{ color: "#1677ff", marginRight: 8 }} />
                        AI đề xuất mô tả dịch vụ
                    </Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Chọn salon hiện tại, nhập tên dịch vụ và 3-5 keywords để AI tạo mô tả nháp. Sau đó bạn có thể lưu vào dịch vụ hiện có hoặc đẩy sang form tạo mới.
                    </Paragraph>
                </div>

                {loadingSalon ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <Spin tip="Đang tải salon..." />
                    </div>
                ) : salon ? (
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={8}>
                            <Card size="small" style={{ borderRadius: 14, background: "#f8fbff" }}>
                                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                    <Text type="secondary">Salon đang dùng AI</Text>
                                    <Title level={5} style={{ margin: 0 }}>
                                        {salon.name}
                                    </Title>
                                    <Text type="secondary">Salon ID: #{salon.id}</Text>
                                    <Divider style={{ margin: "8px 0" }} />
                                    {loadingQuota ? (
                                        <Spin size="small" tip="Đang tải quota..." />
                                    ) : quota ? (
                                        <>
                                            <Space wrap>
                                                <Tag color="blue">Used: {quota.usedToday ?? 0}</Tag>
                                                <Tag color="green">Remaining: {quota.remainingToday ?? 0}</Tag>
                                                <Tag color="gold">Limit: {quota.dailyLimit ?? 0}</Tag>
                                            </Space>
                                            <Progress percent={quotaPercent} status={isQuotaExhausted ? "exception" : "active"} />
                                            {quota?.resetAt ? (
                                                <Text type="secondary">
                                                    Reset lúc: {new Date(quota.resetAt).toLocaleString()}
                                                </Text>
                                            ) : null}
                                        </>
                                    ) : (
                                        <Text type="secondary">Chưa có dữ liệu quota.</Text>
                                    )}
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={16}>
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                <Space wrap style={{ width: "100%" }}>
                                    <div style={{ flex: 1, minWidth: 260 }}>
                                        <Text strong>Tên dịch vụ</Text>
                                        <Input
                                            value={serviceName}
                                            onChange={(e) => setServiceName(e.target.value)}
                                            placeholder="Ví dụ: Tóc layer nữ"
                                            size="large"
                                            style={{ marginTop: 6 }}
                                        />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 260 }}>
                                        <Text strong>Chọn dịch vụ hiện có</Text>
                                            <Select
                                                showSearch
                                                allowClear
                                                placeholder="Chọn dịch vụ để cập nhật mô tả"
                                                size="large"
                                                style={{ width: "100%", marginTop: 6 }}
                                                value={selectedServiceId}
                                            onChange={handleSelectServiceChange}
                                                options={services.map((item) => ({
                                                    value: item.id,
                                                    label: `${item.name} (#${item.id})`
                                                }))}
                                            />
                                    </div>
                                </Space>

                                <div>
                                    <Text strong>Keywords</Text>
                                    <Select
                                        mode="tags"
                                        tokenSeparators={[","]}
                                        value={keywords}
                                        onChange={(next) => setKeywords(next.slice(0, 5))}
                                        placeholder="Nhập 3-5 keywords, ví dụ: layer, mềm mại, phù hợp mặt tròn"
                                        style={{ width: "100%", marginTop: 6 }}
                                        size="large"
                                        maxTagCount="responsive"
                                        options={[]}
                                    />
                                    <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                                        AI sẽ tối ưu mô tả theo đúng keywords bạn nhập.
                                    </Text>
                                </div>

                                <Space wrap>
                                    <Button
                                        type="primary"
                                        icon={<RocketOutlined />}
                                        onClick={handleGenerate}
                                        loading={generating}
                                        disabled={isQuotaExhausted}
                                    >
                                        Generate
                                    </Button>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => {
                                            setServiceName(selectedService?.name || "");
                                            setKeywords([]);
                                            setGeneratedDescription(selectedService?.description || "");
                                            setActiveDescription(selectedService?.description || "");
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </Space>

                                {isQuotaExhausted ? (
                                    <Alert
                                        type="error"
                                        showIcon
                                        message="Hôm nay salon đã dùng hết lượt AI"
                                        description="Nút Generate đang bị khóa cho đến khi quota được reset."
                                    />
                                ) : null}

                                <div>
                                    <Text strong>Mô tả nháp có thể chỉnh sửa</Text>
                                    <TextArea
                                        value={activeDescription}
                                        onChange={(e) => setActiveDescription(e.target.value)}
                                        rows={8}
                                        style={{ marginTop: 6 }}
                                        placeholder="Mô tả AI sẽ xuất hiện ở đây, bạn có thể sửa trực tiếp trước khi lưu."
                                    />
                                </div>

                                <Space wrap>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleSaveToExistingService}
                                        loading={saving}
                                        disabled={!canSaveExisting}
                                    >
                                        Lưu vào dịch vụ hiện có
                                    </Button>
                                    <Button
                                        onClick={handleOpenCreateDraft}
                                        disabled={!normalizeText(activeDescription || generatedDescription)}
                                    >
                                        Đưa vào form tạo mới
                                    </Button>
                                </Space>

                                <Alert
                                    type="info"
                                    showIcon
                                    message="Luồng lưu mô tả"
                                    description="Generate xong thì bạn có thể sửa nội dung, lưu trực tiếp vào service hiện có, hoặc đẩy mô tả sang form tạo service mới để điền thêm giá, thời lượng và danh mục."
                                />
                            </Space>
                        </Col>
                    </Row>
                ) : (
                    <Alert
                        type="warning"
                        showIcon
                        message="Chưa có salon"
                        description="Owner cần tạo salon trước khi dùng AI đề xuất mô tả dịch vụ."
                    />
                )}
            </Space>
        </Card>
    );
}
