import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Image,
    Progress,
    Row,
    Radio,
    Space,
    Spin,
    Tabs,
    Tag,
    Typography,
    Upload,
    message
} from "antd";
import {
    CameraOutlined,
    CheckCircleOutlined,
    PictureOutlined,
    ReloadOutlined,
    ScissorOutlined,
    StarOutlined,
    ThunderboltOutlined,
    UploadOutlined
} from "@ant-design/icons";

import { uploadMediaApi } from "@/features/media/api/mediaApi";
import {
    analyzeHairStyleApi,
    confirmHairStyleApi,
    getHairStyleProfileApi
} from "../api/hairStyleAiApi";
import HairColorTryOnView from "../components/HairColorTryOnView";

const { Title, Text, Paragraph } = Typography;

const formatLabel = (value) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    return String(value)
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
};

const formatConfidence = (value) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return String(value);
    }

    if (numeric <= 1) {
        return `${(numeric * 100).toFixed(1)}%`;
    }

    return `${numeric.toFixed(1)}%`;
};

const toPercent = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric <= 1) return Math.round(numeric * 100);
    return Math.min(100, Math.round(numeric));
};

const extractMediaId = (payload) => payload?.id ?? payload?.mediaId ?? payload?.data?.id ?? payload?.data?.mediaId ?? null;

export default function HairStyleAiPage() {
    const [activeTab, setActiveTab] = useState("analysis");
    const [selectedTryOnStyleId, setSelectedTryOnStyleId] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [confirmingStyleId, setConfirmingStyleId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [analysisResponse, setAnalysisResponse] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [gender, setGender] = useState(null);

    const handleOpenTryOn = (style) => {
        const styleNameLower = (style?.styleName || "").toLowerCase();
        let matchedId = "layered_bob";
        if (styleNameLower.includes("curtain")) matchedId = "curtain_bangs";
        else if (styleNameLower.includes("pixie")) matchedId = "pixie_cut";
        else if (styleNameLower.includes("undercut")) matchedId = "undercut_fade";
        else if (styleNameLower.includes("wave") || styleNameLower.includes("perm") || styleNameLower.includes("xoăn")) matchedId = "korean_perm";
        else if (styleNameLower.includes("crop")) matchedId = "textured_crop";
        else if (styleNameLower.includes("buzz")) matchedId = "buzz_cut";

        setSelectedTryOnStyleId(matchedId);
        setActiveTab("tryon");
        message.info(`Đã mở Filter AR cho kiểu tóc: ${style.styleName}`);
    };

    useEffect(() => {
        const loadProfile = async () => {
            setLoadingProfile(true);
            try {
                const data = await getHairStyleProfileApi();
                setProfile(data || null);
            } catch (error) {
                if (error?.response?.status !== 404) {
                    message.error(error?.response?.data?.message || "Không thể tải hồ sơ tóc hiện tại.");
                }
                setProfile(null);
            } finally {
                setLoadingProfile(false);
            }
        };

        loadProfile();
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const resetAnalysis = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl("");
        setAnalysisResponse(null);
    };

    const handleBeforeUpload = (file) => {
        if (!file.type?.startsWith("image/")) {
            message.warning("Vui lòng chọn một file hình ảnh hợp lệ.");
            return Upload.LIST_IGNORE;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setAnalysisResponse(null);
        return false;
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            message.warning("Vui lòng upload ảnh tóc trước khi phân tích.");
            return;
        }

        if (!gender) {
            message.warning("Vui lòng chọn giới tính để AI lọc đúng nhóm kiểu tóc.");
            return;
        }

        setAnalyzing(true);
        try {
            const uploaded = await uploadMediaApi(selectedFile);
            const mediaId = extractMediaId(uploaded);

            if (!mediaId) {
                throw new Error("Không lấy được mediaId sau khi upload ảnh.");
            }

            const data = await analyzeHairStyleApi({ mediaId, gender });
            setAnalysisResponse(data || null);
            message.success("Đã phân tích tóc thành công.");
        } catch (error) {
            message.error(error?.response?.data?.message || error.message || "Không thể phân tích tóc lúc này.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirmStyle = async (style) => {
        if (!analysisResponse?.analysisResultId) {
            message.warning("Chưa có kết quả phân tích để xác nhận.");
            return;
        }

        if (!style?.styleId) {
            message.warning("Không tìm thấy kiểu tóc để xác nhận.");
            return;
        }

        setConfirmingStyleId(style.styleId);
        try {
            const data = await confirmHairStyleApi({
                analysisResultId: analysisResponse.analysisResultId,
                styleId: style.styleId,
                styleImageId: style.sampleImage?.id ?? null
            });

            setProfile(data || null);
            message.success("Đã xác nhận kiểu tóc và lưu hồ sơ thành công.");
        } catch (error) {
            message.error(error?.response?.data?.message || "Không thể xác nhận kiểu tóc.");
        } finally {
            setConfirmingStyleId(null);
        }
    };

    const analysis = analysisResponse?.analysis || profile?.analysis || null;
    const suggestedStyles = analysisResponse?.suggestedStyles || [];
    const confirmedStyle = profile?.selectedStyle || null;
    const confidencePercent = toPercent(analysis?.confidence);

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 0 24px" }}>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="large"
                items={[
                    {
                        key: "analysis",
                        label: (
                            <Space style={{ fontSize: 16, fontWeight: 600 }}>
                                <ThunderboltOutlined style={{ color: "#1677ff" }} />
                                <span>1. AI Phân Tích & Gợi Ý Kiểu Tóc</span>
                            </Space>
                        ),
                        children: (
                            <div style={{ paddingTop: 12 }}>
                                <div
                                    style={{
                                        borderRadius: 24,
                                        padding: 24,
                                        marginBottom: 24,
                                        color: "#fff",
                                        background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%)",
                                        boxShadow: "0 16px 40px rgba(15, 23, 42, 0.22)"
                                    }}
                                >
                                    <Row gutter={[24, 24]} align="middle">
                                        <Col xs={24} lg={16}>
                                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                                <Space size={10} wrap>
                                                    <Tag color="cyan" style={{ border: "none" }}>
                                                        AI Hair
                                                    </Tag>
                                                    <Tag color="blue" style={{ border: "none" }}>
                                                        Phân tích tóc và gợi ý kiểu tóc
                                                    </Tag>
                                                </Space>
                                                <Title level={2} style={{ color: "#fff", margin: 0 }}>
                                                    Upload ảnh tóc, xem gợi ý kiểu phù hợp và xác nhận hồ sơ.
                                                </Title>
                                                <Paragraph style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, marginBottom: 0 }}>
                                                    Hệ thống sẽ phân tích hình dạng khuôn mặt, độ dài, độ dày và kết cấu tóc để đề xuất những kiểu tóc phù hợp nhất.
                                                </Paragraph>
                                            </Space>
                                        </Col>
                                        <Col xs={24} lg={8}>
                                            <Card
                                                bordered={false}
                                                style={{
                                                    borderRadius: 18,
                                                    background: "rgba(255,255,255,0.12)",
                                                    color: "#fff",
                                                    backdropFilter: "blur(10px)"
                                                }}
                                            >
                                                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                                    <Text style={{ color: "rgba(255,255,255,0.9)" }}>Trạng thái hồ sơ hiện tại</Text>
                                                    {confirmedStyle ? (
                                                        <>
                                                            <Title level={4} style={{ color: "#fff", margin: 0 }}>
                                                                {confirmedStyle.styleName}
                                                            </Title>
                                                            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                                                                {profile?.currentStyle || "Chưa có mô tả style hiện tại"}
                                                            </Text>
                                                        </>
                                                    ) : (
                                                        <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                                                            Chưa có kiểu tóc được xác nhận.
                                                        </Text>
                                                    )}
                                                </Space>
                                            </Card>
                                        </Col>
                                    </Row>
                                </div>

                                <Row gutter={[24, 24]} align="stretch">
                                    <Col xs={24} lg={14}>
                                        <Card
                                            title={
                                                <Space>
                                                    <CameraOutlined style={{ color: "#1677ff" }} />
                                                    <span>1. Chọn giới tính và upload ảnh tóc</span>
                                                </Space>
                                            }
                                            style={{
                                                borderRadius: 20,
                                                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                                border: "1px solid #eef2f7",
                                                height: '100%'
                                            }}
                                        >
                                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                                <Text type="secondary">
                                                    Chọn ảnh rõ nét, ánh sáng tốt để AI phân tích chính xác hơn.
                                                </Text>

                                                <Card size="small" bordered style={{ borderRadius: 14, background: "#f8fbff" }}>
                                                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                                        <Text strong>Giới tính</Text>
                                                        <Radio.Group
                                                            value={gender}
                                                            onChange={(e) => setGender(e.target.value)}
                                                            optionType="button"
                                                            buttonStyle="solid"
                                                        >
                                                            <Radio.Button value="MEN">Nam</Radio.Button>
                                                            <Radio.Button value="WOMEN">Nữ</Radio.Button>
                                                        </Radio.Group>
                                                        <Text type="secondary">
                                                            AI sẽ chỉ gợi ý các kiểu tóc cùng nhóm giới tính và chọn ảnh mẫu tương ứng.
                                                        </Text>
                                                    </Space>
                                                </Card>

                                                <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept="image/*" multiple={false}>
                                                    <div
                                                        style={{
                                                            border: "1.5px dashed #91caff",
                                                            borderRadius: 18,
                                                            background: previewUrl
                                                                ? "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)"
                                                                : "linear-gradient(180deg, #fdfdfd 0%, #f8fbff 100%)",
                                                            padding: 18,
                                                            textAlign: "center",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        {previewUrl ? (
                                                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                                                <Image
                                                                    src={previewUrl}
                                                                    alt="Hair preview"
                                                                    height={280}
                                                                    style={{ objectFit: "cover", borderRadius: 14 }}
                                                                    preview={false}
                                                                />
                                                                <Space wrap style={{ justifyContent: "center", width: "100%" }}>
                                                                    <Tag color="blue">Ảnh đã chọn</Tag>
                                                                    <Text strong>{selectedFile?.name}</Text>
                                                                </Space>
                                                            </Space>
                                                        ) : (
                                                            <Space direction="vertical" size={10} style={{ padding: "36px 12px" }}>
                                                                <UploadOutlined style={{ fontSize: 38, color: "#1677ff" }} />
                                                                <Title level={4} style={{ margin: 0 }}>
                                                                    Kéo thả hoặc bấm để chọn ảnh
                                                                </Title>
                                                                <Text type="secondary">
                                                                    Hỗ trợ ảnh JPG, PNG, WebP.
                                                                </Text>
                                                            </Space>
                                                        )}
                                                    </div>
                                                </Upload>

                                                <Space wrap>
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        icon={<ThunderboltOutlined />}
                                                        onClick={handleAnalyze}
                                                        loading={analyzing}
                                                        disabled={!selectedFile || !gender}
                                                    >
                                                        Phân tích tóc
                                                    </Button>
                                                    <Button
                                                        size="large"
                                                        icon={<ReloadOutlined />}
                                                        onClick={resetAnalysis}
                                                        disabled={!selectedFile && !analysisResponse}
                                                    >
                                                        Làm lại
                                                    </Button>
                                                </Space>


                                            </Space>
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={10}>
                                        <Card
                                            title={
                                                <Space>
                                                    <StarOutlined style={{ color: "#1677ff" }} />
                                                    <span>Hồ sơ tóc đã xác nhận</span>
                                                </Space>
                                            }
                                            style={{
                                                borderRadius: 20,
                                                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                                border: "1px solid #eef2f7",
                                                height: "100%"
                                            }}
                                        >
                                            {loadingProfile ? (
                                                <div style={{ textAlign: "center", padding: "48px 0" }}>
                                                    <Spin tip="Đang tải hồ sơ tóc..." />
                                                </div>
                                            ) : confirmedStyle ? (
                                                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                                    <Card
                                                        style={{
                                                            borderRadius: 16,
                                                            background: "linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%)",
                                                            border: "1px solid #d6e8ff"
                                                        }}
                                                    >
                                                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                                            <Tag color="success" icon={<CheckCircleOutlined />}>
                                                                Đã xác nhận
                                                            </Tag>
                                                            <Title level={4} style={{ margin: 0 }}>
                                                                {confirmedStyle.styleName}
                                                            </Title>
                                                            <Text type="secondary">
                                                                {confirmedStyle.description || "Không có mô tả"}
                                                            </Text>
                                                        </Space>
                                                    </Card>

                                                    <Row gutter={[12, 12]}>
                                                        <Col span={12}>
                                                            <Card size="small" bordered style={{ borderRadius: 14 }}>
                                                                <Text type="secondary">Face shape</Text>
                                                                <div style={{ fontWeight: 600 }}>{formatLabel(profile?.faceShape)}</div>
                                                            </Card>
                                                        </Col>
                                                        <Col span={12}>
                                                            <Card size="small" bordered style={{ borderRadius: 14 }}>
                                                                <Text type="secondary">Hair texture</Text>
                                                                <div style={{ fontWeight: 600 }}>{formatLabel(profile?.hairTexture)}</div>
                                                            </Card>
                                                        </Col>
                                                        <Col span={12}>
                                                            <Card size="small" bordered style={{ borderRadius: 14 }}>
                                                                <Text type="secondary">Hair length</Text>
                                                                <div style={{ fontWeight: 600 }}>{formatLabel(profile?.hairLength)}</div>
                                                            </Card>
                                                        </Col>
                                                        <Col span={12}>
                                                            <Card size="small" bordered style={{ borderRadius: 14 }}>
                                                                <Text type="secondary">Hair density</Text>
                                                                <div style={{ fontWeight: 600 }}>{formatLabel(profile?.hairDensity)}</div>
                                                            </Card>
                                                        </Col>
                                                    </Row>

                                                    <Card size="small" bordered style={{ borderRadius: 14 }}>
                                                        <Space direction="vertical" size={6} style={{ width: "100%" }}>
                                                            <Text type="secondary">Current style</Text>
                                                            <Text strong>{profile?.currentStyle || "-"}</Text>
                                                            {profile?.profileSyncedAt ? (
                                                                <Text type="secondary">
                                                                    Đồng bộ lúc: {new Date(profile.profileSyncedAt).toLocaleString()}
                                                                </Text>
                                                            ) : null}
                                                        </Space>
                                                    </Card>
                                                </Space>
                                            ) : (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description="Chưa có hồ sơ tóc được lưu."
                                                />
                                            )}
                                        </Card>
                                    </Col>

                                    <Col xs={24} lg={24}>
                                        <Card
                                            title={
                                                <Space>
                                                    <ScissorOutlined style={{ color: "#1677ff" }} />
                                                    <span>2. Kiểu tóc gợi ý</span>
                                                </Space>
                                            }
                                            style={{
                                                borderRadius: 20,
                                                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                                border: "1px solid #eef2f7"
                                            }}
                                        >
                                            {analyzing ? (
                                                <div style={{ textAlign: "center", padding: "48px 0" }}>
                                                    <Spin size="large" tip="AI đang phân tích mái tóc..." />
                                                </div>
                                            ) : analysis ? (
                                                <>

                                                    {suggestedStyles.length > 0 && (
                                                        <div style={{ marginTop: 32 }}>
                                                            <Title level={5} style={{ marginBottom: 16 }}>Kiểu tóc gợi ý phù hợp nhất</Title>
                                                            <div 
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    overflowX: 'auto', 
                                                                    gap: 16, 
                                                                    paddingBottom: 16,
                                                                    scrollbarWidth: 'thin'
                                                                }}
                                                            >
                                                                {suggestedStyles.map((style) => {
                                                                    const isSelected = profile?.selectedStyle?.styleId
                                                                        ? String(profile.selectedStyle.styleId) === String(style.styleId)
                                                                        : false;

                                                                    return (
                                                                        <Card
                                                                            key={style.styleId}
                                                                            style={{
                                                                                minWidth: 280,
                                                                                maxWidth: 320,
                                                                                flexShrink: 0,
                                                                                borderRadius: 18,
                                                                                overflow: "hidden",
                                                                                border: isSelected ? "1px solid #1677ff" : "1px solid #edf0f5",
                                                                                boxShadow: isSelected ? "0 10px 25px rgba(22, 119, 255, 0.12)" : "none",
                                                                                display: "flex",
                                                                                flexDirection: "column"
                                                                            }}
                                                                            bodyStyle={{ padding: 0, display: "flex", flexDirection: "column", flex: 1 }}
                                                                        >
                                                                            <div style={{ height: 200, background: "#f5f7fa" }}>
                                                                                {style.sampleImage?.url ? (
                                                                                    <Image
                                                                                        src={style.sampleImage.url}
                                                                                        alt={style.styleName}
                                                                                        style={{ width: "100%", height: 200, objectFit: "cover" }}
                                                                                        preview={false}
                                                                                    />
                                                                                ) : (
                                                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                                                                        <PictureOutlined style={{ fontSize: 28, color: "#bfbfbf" }} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                                                                                <Space direction="vertical" size={10} style={{ width: "100%", flex: 1 }}>
                                                                                    <Space wrap>
                                                                                        <Title level={5} style={{ margin: 0 }}>
                                                                                            {style.styleName}
                                                                                        </Title>
                                                                                        {isSelected ? <Tag color="success">Đã chọn</Tag> : null}
                                                                                    </Space>
                                                                                    <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                                        {style.description || "Không có mô tả"}
                                                                                    </Text>

                                                                                    <Space wrap>
                                                                                        {style.difficultyLevel ? <Tag color="orange">Độ khó: {formatLabel(style.difficultyLevel)}</Tag> : null}
                                                                                        {style.maintenanceLevel ? <Tag color="blue">Bảo trì: {formatLabel(style.maintenanceLevel)}</Tag> : null}
                                                                                        {style.priceRange ? <Tag color="purple">{style.priceRange}</Tag> : null}
                                                                                    </Space>



                                                                                    {Array.isArray(style.reasons) && style.reasons.length > 0 ? (
                                                                                        <Space wrap>
                                                                                            {style.reasons.map((reason) => (
                                                                                                <Tag key={reason}>{reason}</Tag>
                                                                                            ))}
                                                                                        </Space>
                                                                                    ) : null}
                                                                                </Space>
                                                                                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                                                                                    <Divider style={{ margin: "0 0 16px 0" }} />
                                                                                    <Button
                                                                                        block
                                                                                        type={isSelected ? "default" : "primary"}
                                                                                        icon={<CheckCircleOutlined />}
                                                                                        loading={confirmingStyleId === style.styleId}
                                                                                        onClick={() => handleConfirmStyle(style)}
                                                                                    >
                                                                                        {isSelected ? "Đã xác nhận" : "Chọn kiểu này"}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </Card>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <Empty
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    description="Chưa có dữ liệu phân tích. Hãy upload ảnh và bấm Phân tích tóc."
                                                />
                                            )}
                                        </Card>
                                    </Col>


                                </Row>
                            </div>
                        )
                    },
                    {
                        key: "tryon",
                        label: (
                            <Space style={{ fontSize: 16, fontWeight: 600 }}>
                                <ScissorOutlined style={{ color: "#d946ef" }} />
                                <span>2. Thử Màu Tóc Realtime</span>
                            </Space>
                        ),
                        children: <HairColorTryOnView />
                    }
                ]}
            />
        </div>
    );
}
