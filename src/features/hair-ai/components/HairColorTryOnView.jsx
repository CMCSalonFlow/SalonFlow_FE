import { useEffect, useRef, useState, useCallback } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    ColorPicker,
    Divider,
    Empty,
    Modal,
    Radio,
    Row,
    Slider,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
    Upload,
    message
} from "antd";
import {
    CameraOutlined,
    CloudUploadOutlined,
    DownloadOutlined,
    EyeOutlined,
    InfoCircleOutlined,
    PictureOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
    ScissorOutlined,
    SlidersOutlined,
    StarOutlined,
    SwapOutlined
} from "@ant-design/icons";

import { segmentHair } from "../utils/hairSegmenterService";
import { HAIR_COLOR_PRESETS, applyHairColorToCanvas } from "../utils/hairColorEngine";

import mauNuImg from "./mau_nu.jpg";
import mauNamImg from "./mau_nam.jpg";

const { Title, Text, Paragraph } = Typography;

// Sample demo photos
const SAMPLE_PHOTOS = [
    {
        id: "model_female",
        label: "Mẫu Nữ",
        url: mauNuImg
    },
    {
        id: "model_male",
        label: "Mẫu Nam",
        url: mauNamImg
    }
];

export default function HairColorTryOnView() {
    // Camera snapshot modal states
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState("user");

    // Selected image & mask state (Empty by default)
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [hairMaskData, setHairMaskData] = useState(null);
    const [maskWidth, setMaskWidth] = useState(0);
    const [maskHeight, setMaskHeight] = useState(0);
    const [isSegmenting, setIsSegmenting] = useState(false);
    const [dyedPixelsCount, setDyedPixelsCount] = useState(0);

    // Hair color options (No color selected by default)
    const [selectedPresetId, setSelectedPresetId] = useState(null);
    const [customHex, setCustomHex] = useState("#d9ab55");
    const [activeColorCategory, setActiveColorCategory] = useState("all");

    // Sliders (Harmonious natural defaults)
    const [opacity, setOpacity] = useState(0.50);
    const [shine, setShine] = useState(0.60);
    const [satMultiplier, setSatMultiplier] = useState(1.0);
    const [brightnessShift, setBrightnessShift] = useState(0);

    // Split comparison slider state
    const [isCompareActive, setIsCompareActive] = useState(false);
    const [splitPosition, setSplitPosition] = useState(50); // percentage 0-100%

    // DOM references
    const videoRef = useRef(null);
    const sourceImageRef = useRef(null);
    const outputCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const isDraggingRef = useRef(false);

    // Current active color hex calculation (null if no color selected)
    const activeHexColor = selectedPresetId === "custom"
        ? customHex
        : (selectedPresetId ? HAIR_COLOR_PRESETS.find((p) => p.id === selectedPresetId)?.hex : null);

    /**
     * Process & segment static image
     */
    const processImageSegmentation = useCallback(async (imageElement) => {
        if (!imageElement) return;
        setIsSegmenting(true);
        try {
            const segResult = await segmentHair(imageElement);
            if (segResult && segResult.mask) {
                setHairMaskData(segResult.mask);
                setMaskWidth(segResult.width);
                setMaskHeight(segResult.height);
            } else {
                message.warning("Không tìm thấy vùng tóc trong ảnh. Hãy thử ảnh rõ nét hơn.");
                setHairMaskData(null);
            }
        } catch (err) {
            console.error("Hair segmentation failed:", err);
            message.error("Lỗi khi bóc tách vùng tóc.");
            setHairMaskData(null);
        } finally {
            setIsSegmenting(false);
        }
    }, []);

    /**
     * Handle Image Load
     */
    const handleSourceImageLoad = () => {
        if (sourceImageRef.current) {
            processImageSegmentation(sourceImageRef.current);
        }
    };

    /**
     * Render canvas output on static image
     */
    const renderCanvasOutput = useCallback(() => {
        if (!outputCanvasRef.current || !hairMaskData || !sourceImageRef.current) return;

        const srcElement = sourceImageRef.current;
        const targetW = srcElement.naturalWidth || srcElement.width || 800;
        const targetH = srcElement.naturalHeight || srcElement.height || 600;

        if (outputCanvasRef.current.width !== targetW || outputCanvasRef.current.height !== targetH) {
            outputCanvasRef.current.width = targetW;
            outputCanvasRef.current.height = targetH;
        }

        const count = applyHairColorToCanvas(
            outputCanvasRef.current,
            srcElement,
            hairMaskData,
            maskWidth,
            maskHeight,
            {
                hexColor: activeHexColor,
                opacity,
                shine,
                satMultiplier,
                brightnessShift
            }
        );

        setDyedPixelsCount(count);

        // If Compare Mode is active, clip left region and draw original photo + divider line
        if (isCompareActive) {
            const ctx = outputCanvasRef.current.getContext("2d");
            const splitX = Math.round(targetW * (splitPosition / 100));

            ctx.save();
            // Clip left side to draw original photo
            ctx.beginPath();
            ctx.rect(0, 0, splitX, targetH);
            ctx.clip();
            ctx.drawImage(srcElement, 0, 0, targetW, targetH);
            ctx.restore();

            // Draw divider line & handle
            ctx.save();
            const strokeW = Math.max(3, Math.round(targetW / 260));
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = strokeW;
            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(splitX, 0);
            ctx.lineTo(splitX, targetH);
            ctx.stroke();

            // Draw circular handle knob
            const handleR = Math.max(14, Math.round(targetW / 45));
            const centerY = targetH / 2;

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(splitX, centerY, handleR, 0, 2 * Math.PI);
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#38bdf8";
            ctx.stroke();

            // Draw arrow icon inside knob
            ctx.fillStyle = "#0284c7";
            ctx.font = `bold ${Math.round(handleR * 0.95)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("↔", splitX, centerY);

            ctx.restore();
        }
    }, [hairMaskData, maskWidth, maskHeight, activeHexColor, opacity, shine, satMultiplier, brightnessShift, isCompareActive, splitPosition]);

    useEffect(() => {
        renderCanvasOutput();
    }, [renderCanvasOutput]);

    /**
     * Camera Snapshot Management
     */
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCameraModal = async (facingMode = cameraFacingMode) => {
        stopCamera();
        setIsCameraLoading(true);
        setIsCameraModalOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            message.error("Không thể truy cập camera. Vui lòng cấp quyền camera trình duyệt.");
            setIsCameraModalOpen(false);
        } finally {
            setIsCameraLoading(false);
        }
    };

    const closeCameraModal = () => {
        stopCamera();
        setIsCameraModalOpen(false);
    };

    const handleCaptureSnapshot = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        if (cameraFacingMode === "user") {
            ctx.translate(w, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, w, h);

        const snapshotUrl = canvas.toDataURL("image/jpeg", 0.92);
        setSelectedImageSrc(snapshotUrl);

        closeCameraModal();
        message.success("Đã chụp ảnh từ Camera!");
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    /**
     * File Upload Handler
     */
    const handleBeforeUpload = (file) => {
        if (!file.type?.startsWith("image/")) {
            message.warning("Vui lòng chọn file hình ảnh hợp lệ.");
            return Upload.LIST_IGNORE;
        }

        const url = URL.createObjectURL(file);
        setSelectedImageSrc(url);
        return false;
    };

    /**
     * Download Dyed Photo
     */
    const handleDownload = () => {
        if (!outputCanvasRef.current) return;
        const link = document.createElement("a");
        link.download = `SalonFlow_HairTryOn_${selectedPresetId}_${Date.now()}.png`;
        link.href = outputCanvasRef.current.toDataURL("image/png");
        link.click();
        message.success("Đã tải ảnh thử màu tóc về máy!");
    };

    /**
     * Reset Sliders to Defaults
     */
    const handleResetControls = () => {
        setOpacity(0.50);
        setShine(0.60);
        setSatMultiplier(1.0);
        setBrightnessShift(0);
        message.info("Đã đặt lại thông số điều chỉnh về mức hài hòa tự nhiên nhất.");
    };

    // Filter color presets by active category
    const filteredPresets = HAIR_COLOR_PRESETS.filter((preset) => {
        if (activeColorCategory === "all") return true;
        return preset.category === activeColorCategory;
    });

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 0 32px" }}>
            {/* Header Hero Banner */}
            <div
                style={{
                    borderRadius: 24,
                    padding: "24px 32px",
                    marginBottom: 24,
                    color: "#fff",
                    background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #d946ef 100%)",
                    boxShadow: "0 16px 40px rgba(67, 56, 202, 0.25)"
                }}
            >
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                    <Tag color="magenta" style={{ borderRadius: 12, padding: "2px 12px", border: "none", fontWeight: 600, width: "fit-content" }}>
                        ✨ AI Hair Dye Try-On
                    </Tag>
                    <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                        Thử Màu Tóc AI Trực Quan & Tự Nhiên
                    </Title>
                    <Paragraph style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, margin: 0, maxWidth: 900 }}>
                        Tự động phát hiện vùng tóc và mô phỏng màu nhuộm 3D chuẩn salon. Tùy chỉnh màu sắc, độ bóng và cường độ nhuộm trực quan trên ảnh chân dung hoặc ảnh chụp từ camera.
                    </Paragraph>
                </Space>
            </div>

            <Row gutter={[24, 24]}>
                {/* LEFT COLUMN: Main Visual Preview */}
                <Col xs={24} lg={15}>
                    <Card
                        style={{
                            borderRadius: 24,
                            boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
                            border: "1px solid #eef2f7"
                        }}
                        title={
                            <Row align="middle" justify="space-between">
                                <Col>
                                    <Space size={12}>
                                        <ScissorOutlined style={{ color: "#d946ef", fontSize: 20 }} />
                                        <Text strong style={{ fontSize: 16 }}>Khung Nhìn Thử Màu Tóc</Text>
                                    </Space>
                                </Col>
                                <Col>
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={handleDownload}
                                        style={{
                                            background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                                            border: "none",
                                            borderRadius: 12,
                                            fontWeight: 600
                                        }}
                                    >
                                        Tải Ảnh Kết Quả
                                    </Button>
                                </Col>
                            </Row>
                        }
                    >
                        {/* Hidden native source image element */}
                        {selectedImageSrc && (
                            <img
                                ref={sourceImageRef}
                                src={selectedImageSrc}
                                alt="Original hair source"
                                crossOrigin="anonymous"
                                onLoad={handleSourceImageLoad}
                                style={{ display: "none" }}
                            />
                        )}

                        {/* Output Canvas Preview Container or Empty Placeholder */}
                        {!selectedImageSrc ? (
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    minHeight: 460,
                                    borderRadius: 18,
                                    overflow: "hidden",
                                    background: "#0f172a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: 24,
                                    textAlign: "center"
                                }}
                            >
                                <Empty
                                    image={<PictureOutlined style={{ fontSize: 64, color: "#38bdf8" }} />}
                                    description={
                                        <Space direction="vertical" size={6} style={{ marginTop: 12 }}>
                                            <Text strong style={{ color: "#fff", fontSize: 16 }}>
                                                Chưa chọn ảnh thử màu
                                            </Text>
                                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, maxWidth: 440 }}>
                                                Vui lòng tải ảnh của bạn lên, chụp từ Camera hoặc chọn một ảnh mẫu bên dưới để bắt đầu thử màu tóc AI.
                                            </Text>
                                        </Space>
                                    }
                                >
                                    <Space wrap style={{ marginTop: 12 }}>
                                        <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept="image/*">
                                            <Button type="primary" size="large" icon={<CloudUploadOutlined />} style={{ borderRadius: 12 }}>
                                                Tải Ảnh Của Bạn
                                            </Button>
                                        </Upload>
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<CameraOutlined />}
                                            onClick={() => startCameraModal()}
                                            style={{
                                                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                                                border: "none",
                                                borderRadius: 12
                                            }}
                                        >
                                            Chụp Ảnh Camera
                                        </Button>
                                    </Space>
                                </Empty>
                            </div>
                        ) : (
                            <div
                                onMouseDown={(e) => {
                                    if (!isCompareActive) return;
                                    isDraggingRef.current = true;
                                    const rect = outputCanvasRef.current?.getBoundingClientRect();
                                    if (rect) {
                                        const x = e.clientX - rect.left;
                                        setSplitPosition(Math.min(100, Math.max(0, Math.round((x / rect.width) * 100))));
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (!isDraggingRef.current || !isCompareActive) return;
                                    const rect = outputCanvasRef.current?.getBoundingClientRect();
                                    if (rect) {
                                        const x = e.clientX - rect.left;
                                        setSplitPosition(Math.min(100, Math.max(0, Math.round((x / rect.width) * 100))));
                                    }
                                }}
                                onMouseUp={() => { isDraggingRef.current = false; }}
                                onMouseLeave={() => { isDraggingRef.current = false; }}
                                onTouchStart={(e) => {
                                    if (!isCompareActive) return;
                                    isDraggingRef.current = true;
                                    const rect = outputCanvasRef.current?.getBoundingClientRect();
                                    if (rect && e.touches[0]) {
                                        const x = e.touches[0].clientX - rect.left;
                                        setSplitPosition(Math.min(100, Math.max(0, Math.round((x / rect.width) * 100))));
                                    }
                                }}
                                onTouchMove={(e) => {
                                    if (!isDraggingRef.current || !isCompareActive) return;
                                    const rect = outputCanvasRef.current?.getBoundingClientRect();
                                    if (rect && e.touches[0]) {
                                        const x = e.touches[0].clientX - rect.left;
                                        setSplitPosition(Math.min(100, Math.max(0, Math.round((x / rect.width) * 100))));
                                    }
                                }}
                                onTouchEnd={() => { isDraggingRef.current = false; }}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    minHeight: 460,
                                    borderRadius: 18,
                                    overflow: "hidden",
                                    background: "#0f172a",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: isCompareActive ? "ew-resize" : "default",
                                    userSelect: "none"
                                }}
                            >
                                {isSegmenting ? (
                                    <div style={{ position: "absolute", zIndex: 10, textAlign: "center", color: "#fff" }}>
                                        <Spin size="large" />
                                        <div style={{ marginTop: 12, fontWeight: 600 }}>
                                            AI đang bóc tách mái tóc...
                                        </div>
                                    </div>
                                ) : null}

                                {/* Main Output Canvas */}
                                <canvas
                                    ref={outputCanvasRef}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: 560,
                                        width: "auto",
                                        height: "auto",
                                        borderRadius: 16,
                                        objectFit: "contain",
                                        display: "block"
                                    }}
                                />
                            </div>
                        )}

                        {/* Interactive Toolbar below preview */}
                        <div style={{ marginTop: 16 }}>
                            <Space wrap size={10}>
                                <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept="image/*">
                                    <Button icon={<CloudUploadOutlined />}>Tải ảnh lên</Button>
                                </Upload>

                                <Button
                                    type="primary"
                                    icon={<CameraOutlined />}
                                    onClick={() => startCameraModal()}
                                    style={{
                                        background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                                        border: "none"
                                    }}
                                >
                                    Chụp Ảnh Camera
                                </Button>

                                <Tooltip title="So sánh trước và sau khi nhuộm">
                                    <Button
                                        type={isCompareActive ? "primary" : "default"}
                                        icon={<EyeOutlined />}
                                        onClick={() => setIsCompareActive(!isCompareActive)}
                                    >
                                        {isCompareActive ? "Tắt So Sánh" : "So Sánh Trước/Sau"}
                                    </Button>
                                </Tooltip>

                                <Button icon={<ReloadOutlined />} onClick={handleResetControls}>
                                    Đặt lại
                                </Button>
                            </Space>

                            {/* Split position slider if compare mode active */}
                            {isCompareActive && (
                                <Card size="small" style={{ marginTop: 16, borderRadius: 14, background: "#f8fafc" }}>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Row justify="space-between">
                                            <Text strong>Thanh trượt so sánh Trước / Sau:</Text>
                                            <Text type="secondary">{splitPosition}% Ảnh gốc</Text>
                                        </Row>
                                        <Slider
                                            value={splitPosition}
                                            onChange={setSplitPosition}
                                            min={0}
                                            max={100}
                                            tooltip={{ formatter: (v) => `${v}% Ảnh gốc` }}
                                        />
                                    </Space>
                                </Card>
                            )}

                            {/* Sample model selector */}
                            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed #e2e8f0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Hoặc chọn ảnh mẫu nhanh:
                                </Text>
                                <Space wrap>
                                    {SAMPLE_PHOTOS.map((photo) => (
                                        <Button
                                            key={photo.id}
                                            size="small"
                                            type={selectedImageSrc === photo.url ? "primary" : "default"}
                                            onClick={() => setSelectedImageSrc(photo.url)}
                                            style={{ borderRadius: 10 }}
                                        >
                                            {photo.label}
                                        </Button>
                                    ))}
                                </Space>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* RIGHT COLUMN: Color Palette Presets & Fine-Tuning Controls */}
                <Col xs={24} lg={9}>
                    <Space direction="vertical" size={20} style={{ width: "100%" }}>
                        {/* Panel 1: Color Presets Selection */}
                        <Card
                            title={
                                <Space>
                                    <StarOutlined style={{ color: "#d946ef" }} />
                                    <Text strong>1. Bảng Màu Nhuộm Salon</Text>
                                </Space>
                            }
                            style={{
                                borderRadius: 20,
                                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                border: "1px solid #eef2f7"
                            }}
                        >
                            <Space direction="vertical" size={14} style={{ width: "100%" }}>
                                {/* Category Filter Tabs */}
                                <Radio.Group
                                    value={activeColorCategory}
                                    onChange={(e) => setActiveColorCategory(e.target.value)}
                                    size="small"
                                    buttonStyle="solid"
                                >
                                    <Radio.Button value="all">Tất cả</Radio.Button>
                                    <Radio.Button value="natural">Tự Nhiên</Radio.Button>
                                    <Radio.Button value="fashion">Thời Trang</Radio.Button>
                                    <Radio.Button value="vibrant">Rực Rỡ</Radio.Button>
                                </Radio.Group>

                                {/* Color Swatches Grid */}
                                <Row gutter={[10, 10]}>
                                    {filteredPresets.map((preset) => {
                                        const isSelected = selectedPresetId === preset.id;
                                        return (
                                            <Col span={12} key={preset.id}>
                                                <div
                                                    onClick={() => setSelectedPresetId(preset.id)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                        padding: "8px 12px",
                                                        borderRadius: 14,
                                                        cursor: "pointer",
                                                        background: isSelected ? "#f0f5ff" : "#f8fafc",
                                                        border: isSelected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: "50%",
                                                            backgroundColor: preset.hex,
                                                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                                            border: "2px solid #fff"
                                                        }}
                                                    />
                                                    <Text strong={isSelected} style={{ fontSize: 13, flex: 1 }}>
                                                        {preset.name}
                                                    </Text>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>

                                <Divider style={{ margin: "10px 0" }} />

                                {/* Custom Color Picker */}
                                <Row align="middle" justify="space-between">
                                    <Col>
                                        <Text strong>Tùy chọn màu Hex linh hoạt:</Text>
                                    </Col>
                                    <Col>
                                        <Space>
                                            <ColorPicker
                                                value={customHex}
                                                onChange={(color) => {
                                                    setCustomHex(color.toHexString());
                                                    setSelectedPresetId("custom");
                                                }}
                                                showText
                                            />
                                        </Space>
                                    </Col>
                                </Row>
                            </Space>
                        </Card>

                        {/* Panel 2: Fine-Tuning Sliders */}
                        <Card
                            title={
                                <Space>
                                    <SlidersOutlined style={{ color: "#3b82f6" }} />
                                    <Text strong>2. Tinh Chỉnh Sắc Độ & Độ Bóng 3D</Text>
                                    <Tooltip title="Hướng dẫn: Chỉnh Cường độ màu để tăng/giảm độ phủ, Độ bóng 3D để tạo lọn tóc bắt sáng, Feather để làm mịn đường viền trán/tai, Saturation và Brightness để phù hợp với nền tóc gốc.">
                                        <InfoCircleOutlined style={{ color: "#8c8c8c", cursor: "pointer", fontSize: 14 }} />
                                    </Tooltip>
                                </Space>
                            }
                            style={{
                                borderRadius: 20,
                                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                                border: "1px solid #eef2f7"
                            }}
                        >
                            <Space direction="vertical" size={14} style={{ width: "100%" }}>
                                <div>
                                    <Row justify="space-between">
                                        <Space size={4}>
                                            <Text>Cường độ màu (Opacity):</Text>
                                            <Tooltip title="Độ đậm nhạt của màu nhuộm. 40-60% giữ tông tự nhiên, 80-100% phủ màu đậm rõ nét.">
                                                <QuestionCircleOutlined style={{ color: "#bfbfbf", fontSize: 12, cursor: "pointer" }} />
                                            </Tooltip>
                                        </Space>
                                        <Text type="secondary">{Math.round(opacity * 100)}%</Text>
                                    </Row>
                                    <Slider min={0.2} max={1.0} step={0.05} value={opacity} onChange={setOpacity} />
                                </div>

                                <div>
                                    <Row justify="space-between">
                                        <Space size={4}>
                                            <Text>Độ bóng lọn tóc 3D (Shine):</Text>
                                            <Tooltip title="Tạo phản chiếu ánh sáng bắt mắt trên các lọn tóc 3D, giúp tóc trông mềm mượt bóng bẩy như vừa hấp dầu tại salon.">
                                                <QuestionCircleOutlined style={{ color: "#bfbfbf", fontSize: 12, cursor: "pointer" }} />
                                            </Tooltip>
                                        </Space>
                                        <Text type="secondary">{Math.round(shine * 100)}%</Text>
                                    </Row>
                                    <Slider min={0.0} max={1.0} step={0.05} value={shine} onChange={setShine} />
                                </div>

                                <div>
                                    <Row justify="space-between">
                                        <Space size={4}>
                                            <Text>Độ rực màu (Saturation):</Text>
                                            <Tooltip title="Tăng/giảm độ đậm đặc của sắc màu. Hạ thấp (0.4-0.6x) để tạo tông màu khói/pastel; nâng cao (1.2-1.8x) để có màu tươi rực rỡ.">
                                                <QuestionCircleOutlined style={{ color: "#bfbfbf", fontSize: 12, cursor: "pointer" }} />
                                            </Tooltip>
                                        </Space>
                                        <Text type="secondary">{satMultiplier.toFixed(1)}x</Text>
                                    </Row>
                                    <Slider min={0.2} max={2.0} step={0.1} value={satMultiplier} onChange={setSatMultiplier} />
                                </div>

                                <div>
                                    <Row justify="space-between">
                                        <Space size={4}>
                                            <Text>Tăng/giảm độ sáng (Brightness):</Text>
                                            <Tooltip title="Tăng hoặc giảm độ sáng màu tóc. Nâng dương (+10% đến +20%) cho nền tóc sáng/tẩy; hạ âm (-10% đến -20%) cho màu đằm ấm.">
                                                <QuestionCircleOutlined style={{ color: "#bfbfbf", fontSize: 12, cursor: "pointer" }} />
                                            </Tooltip>
                                        </Space>
                                        <Text type="secondary">{brightnessShift > 0 ? `+${brightnessShift}` : brightnessShift}%</Text>
                                    </Row>
                                    <Slider min={-30} max={30} step={2} value={brightnessShift} onChange={setBrightnessShift} />
                                </div>
                            </Space>
                        </Card>
                    </Space>
                </Col>
            </Row>

            {/* Camera Snapshot Modal */}
            <Modal
                title={
                    <Space>
                        <CameraOutlined style={{ color: "#2563eb" }} />
                        <span>Chụp Ảnh Mới Bằng Camera</span>
                    </Space>
                }
                open={isCameraModalOpen}
                onCancel={closeCameraModal}
                footer={
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Button
                                icon={<SwapOutlined />}
                                onClick={() => {
                                    const nextFacing = cameraFacingMode === "user" ? "environment" : "user";
                                    setCameraFacingMode(nextFacing);
                                    startCameraModal(nextFacing);
                                }}
                            >
                                Đổi Camera ({cameraFacingMode === "user" ? "Trước" : "Sau"})
                            </Button>
                        </Col>
                        <Col>
                            <Space>
                                <Button onClick={closeCameraModal}>Hủy</Button>
                                <Button
                                    type="primary"
                                    icon={<CameraOutlined />}
                                    onClick={handleCaptureSnapshot}
                                    style={{
                                        background: "linear-gradient(135deg, #2563eb 0%, #d946ef 100%)",
                                        border: "none",
                                        fontWeight: 600
                                    }}
                                >
                                    📸 Chụp Ảnh Ngay
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                }
                width={720}
                centered
                destroyOnClose
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        minHeight: 380,
                        background: "#0f172a",
                        borderRadius: 16,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {isCameraLoading && (
                        <div style={{ position: "absolute", zIndex: 10, textAlign: "center", color: "#fff" }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 12, fontWeight: 600 }}>Đang kết nối Camera...</div>
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        style={{
                            width: "100%",
                            maxHeight: 480,
                            objectFit: "contain",
                            transform: cameraFacingMode === "user" ? "scaleX(-1)" : "none"
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}
