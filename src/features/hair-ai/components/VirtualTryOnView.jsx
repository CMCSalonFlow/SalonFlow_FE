import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    ColorPicker,
    Divider,
    Radio,
    Row,
    Slider,
    Space,
    Spin,
    Tag,
    Typography,
    Upload,
    message
} from "antd";
import {
    CameraOutlined,
    DownloadOutlined,
    PictureOutlined,
    UploadOutlined,
    BgColorsOutlined,
    EyeOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { HAIR_COLOR_PRESETS } from "../utils/hairPresetAssets";
import {
    calculateFaceMetrics,
    detectFaceLandmarks,
    initFaceMeshModel,
    MetricSmoother
} from "../utils/faceLandmarksHelper";
import {
    initHairSegmenter,
    renderTikTokHairPipeline
} from "../utils/hairSegmentationHelper";

const { Title, Text, Paragraph } = Typography;

export default function VirtualTryOnView({ onSelectColor = null }) {
    const navigate = useNavigate();

    // Mode state
    const [mode, setMode] = useState("camera"); // 'camera' | 'upload'
    const [cameraActive, setCameraActive] = useState(false);
    const [loadingModel, setLoadingModel] = useState(true);

    // Color presets & customization (Default null: Original natural hair color)
    const [selectedColor, setSelectedColor] = useState(null);
    const [colorOpacity, setColorOpacity] = useState(0.75);
    const [colorShine, setColorShine] = useState(0.5);
    const [customHex, setCustomHex] = useState("#e89999");
    const [showSplitBeforeAfter, setShowSplitBeforeAfter] = useState(false);

    const [hasLandmarks, setHasLandmarks] = useState(false);
    const [dyedPixels, setDyedPixels] = useState(0);

    // Media & DOM refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const hiddenImageRef = useRef(null);
    const smootherRef = useRef(new MetricSmoother(0.35));
    const animFrameId = useRef(null);
    const faceMeshRef = useRef(null);
    const segmenterRef = useRef(null);
    const latestBodyPixMaskRef = useRef(null);
    const isSegmentingRef = useRef(false);
    const rawLandmarksRef = useRef(null);
    const isProcessingFrameRef = useRef(false);
    const lastStateUpdateRef = useRef(0);

    // 1. Initialize TFJS WebGL FaceMesh Detector & Neural Hair Segmenter
    useEffect(() => {
        let isMounted = true;
        setLoadingModel(false);

        initFaceMeshModel()
            .then((instance) => {
                if (isMounted) {
                    faceMeshRef.current = instance;
                    console.log("%c[SalonFlow AR ✅] Model AI Face Detector sẵn sàng!", "color: #ec4899; font-weight: bold;");
                }
            })
            .catch((err) => {
                console.error("[SalonFlow AR Error] FaceMesh init error:", err);
            });

        initHairSegmenter()
            .then((segmenter) => {
                if (isMounted && segmenter) {
                    segmenterRef.current = segmenter;
                    console.log("%c[SalonFlow AR 🧠] Neural Hair Segmenter đã tích hợp sẵn sàng!", "color: #22c55e; font-weight: bold;");
                }
            })
            .catch((err) => {
                console.warn("[SalonFlow AR Warning] Segmenter init warning:", err);
            });

        return () => {
            isMounted = false;
            stopCamera();
            if (animFrameId.current) {
                cancelAnimationFrame(animFrameId.current);
            }
        };
    }, []);

    // 2. Camera Controls
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
            }
        } catch (err) {
            message.error("Không thể mở webcam. Vui lòng kiểm tra quyền truy cập camera!");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    // 3. Mode Switch Handler
    const handleModeChange = (newMode) => {
        setMode(newMode);
        smootherRef.current.reset();
        if (newMode === "camera") {
            startCamera();
        } else {
            stopCamera();
        }
    };

    // 4. Image Upload Handler
    const handleBeforeUpload = (file) => {
        if (!file.type?.startsWith("image/")) {
            message.warning("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP).");
            return Upload.LIST_IGNORE;
        }
        const url = URL.createObjectURL(file);
        setUploadImageUrl(url);
        smootherRef.current.reset();
        return false;
    };

    // 5. Custom Color Change Handler
    const handleCustomColorChange = (colorObj) => {
        const hex = colorObj.toHexString();
        setCustomHex(hex);
        setSelectedColor({
            id: "custom",
            name: "Màu Tùy Chỉnh",
            hex,
            blendMode: "soft-light",
            opacity: colorOpacity,
            shine: colorShine
        });
    };

    // 6. Main Render Loop
    useEffect(() => {
        const renderLoop = async () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                animFrameId.current = requestAnimationFrame(renderLoop);
                return;
            }
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;

            let sourceElement = null;
            let srcWidth = 640;
            let srcHeight = 480;

            if (mode === "camera" && videoRef.current && cameraActive && videoRef.current.readyState >= 2) {
                sourceElement = videoRef.current;
                srcWidth = videoRef.current.videoWidth || 640;
                srcHeight = videoRef.current.videoHeight || 480;
            } else if (mode === "upload" && hiddenImageRef.current && hiddenImageRef.current.complete) {
                sourceElement = hiddenImageRef.current;
                srcWidth = hiddenImageRef.current.naturalWidth || 640;
                srcHeight = hiddenImageRef.current.naturalHeight || 480;
            }

            if (canvas.width !== srcWidth || canvas.height !== srcHeight) {
                canvas.width = srcWidth;
                canvas.height = srcHeight;
            }

            // Draw original background frame
            if (sourceElement) {
                ctx.save();
                if (mode === "camera") {
                    // Mirror video for natural webcam AR feel
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);
                ctx.restore();

                // Estimate 3D face landmarks directly from active rendered canvas frame (instant 60fps lock)
                if (faceMeshRef.current && !isProcessingFrameRef.current) {
                    isProcessingFrameRef.current = true;
                    detectFaceLandmarks(faceMeshRef.current, canvas)
                        .then((landmarks) => {
                            if (landmarks && landmarks.length > 0) {
                                rawLandmarksRef.current = landmarks;
                                setHasLandmarks(true);
                            } else if (!rawLandmarksRef.current) {
                                setHasLandmarks(false);
                            }
                        })
                        .catch((e) => console.warn("[SalonFlow AI] Detection frame error:", e))
                        .finally(() => {
                            isProcessingFrameRef.current = false;
                        });
                }

                // Run BodyPix Person Mask Segmenter in background worker loop (High Performance "low" resolution)
                if (segmenterRef.current && !isSegmentingRef.current) {
                    isSegmentingRef.current = true;
                    segmenterRef.current
                        .segmentPerson(sourceElement, {
                            flipHorizontal: false,
                            internalResolution: "low",
                            segmentationThreshold: 0.5
                        })
                        .then((segmentation) => {
                            if (segmentation && segmentation.data) {
                                latestBodyPixMaskRef.current = segmentation.data;
                            }
                        })
                        .catch((e) => console.warn("[SalonFlow Hair AI] BodyPix segment error:", e))
                        .finally(() => {
                            isSegmentingRef.current = false;
                        });
                }
            } else {
                ctx.fillStyle = "#0f172a";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // If split before/after view is enabled, draw before side
            if (showSplitBeforeAfter && sourceElement) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, canvas.width / 2, canvas.height);
                ctx.clip();
                if (mode === "camera") {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(sourceElement, 0, 0, canvas.width, canvas.height);

                // Draw split line
                ctx.strokeStyle = "#ec4899";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();

                ctx.restore();
            }

            // Process 7-Stage TikTok AR Hair Color Filter (60 FPS Performance Optimized)
            const rawLandmarks = rawLandmarksRef.current;
            const bodyPixMask = latestBodyPixMaskRef.current;

            if (selectedColor && sourceElement) {
                const count = renderTikTokHairPipeline(
                    ctx,
                    rawLandmarks,
                    bodyPixMask,
                    canvas.width,
                    canvas.height,
                    selectedColor,
                    colorOpacity,
                    colorShine
                );

                // Throttled UI State update to prevent React 60fps re-render lag
                const now = Date.now();
                if (count !== undefined && count > 0 && now - lastStateUpdateRef.current > 1000) {
                    setDyedPixels(count);
                    lastStateUpdateRef.current = now;
                }
            }

            animFrameId.current = requestAnimationFrame(renderLoop);
        };

        animFrameId.current = requestAnimationFrame(renderLoop);
        return () => {
            if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        };
    }, [mode, cameraActive, selectedColor, colorOpacity, colorShine, showSplitBeforeAfter]);

    // 7. Capture Snapshot & Download
    const handleDownloadSnapshot = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `SalonFlow_MauNhuom_${selectedColor?.name || "Filter"}.png`;
        link.href = imageUri;
        link.click();
        message.success("Đã lưu ảnh filter thử màu nhuộm thành công!");
    };

    // 8. Booking Redirect with selected color
    const handleProceedToBooking = () => {
        if (onSelectColor && selectedColor) {
            onSelectColor(selectedColor);
        }
        navigate("/booking", {
            state: {
                selectedHairColor: selectedColor?.name
            }
        });
    };

    return (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 0 24px" }}>
            {/* Top Banner */}
            <div
                style={{
                    borderRadius: 24,
                    padding: "20px 24px",
                    marginBottom: 24,
                    color: "#fff",
                    background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)",
                    boxShadow: "0 16px 40px rgba(253, 29, 29, 0.22)"
                }}
            >
                <Row gutter={[20, 20]} align="middle">
                    <Col xs={24} md={16}>
                        <Space size={10} wrap>
                            <Tag color="magenta" style={{ border: "none", fontWeight: 600 }}>
                                TikTok Hair Color AR
                            </Tag>
                            <Tag color="gold" style={{ border: "none", fontWeight: 600 }}>
                                Real-time Hair Tinting
                            </Tag>
                        </Space>
                        <Title level={3} style={{ color: "#fff", margin: "8px 0 4px" }}>
                            AI Virtual Hair Color Try-On (Thử Màu Nhuộm Tóc TikTok)
                        </Title>
                        <Paragraph style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: 14 }}>
                            Trải nghiệm đổi màu nhuộm thời thượng tức thì trên Live Camera hoặc Ảnh chụp. Tọa độ AI khóa đúng vùng tóc tự nhiên.
                        </Paragraph>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: "right" }}>
                        <Space wrap>
                            <Tag color="magenta" style={{ fontSize: 14, padding: "6px 16px", borderRadius: 10, border: "none", fontWeight: 600 }}>
                                <CameraOutlined style={{ marginRight: 6 }} /> Live Cam Active
                            </Tag>
                        </Space>
                    </Col>
                </Row>
            </div>

            <Row gutter={[24, 24]}>
                {/* Main AR Display Canvas */}
                <Col xs={24} lg={15}>
                    <Card
                        style={{
                            borderRadius: 20,
                            overflow: "hidden",
                            boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
                            border: "1px solid #e2e8f0"
                        }}
                        bodyStyle={{ padding: 16 }}
                    >
                        <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "#090d16", minHeight: 420, display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <video ref={videoRef} playsInline muted style={{ position: "absolute", width: 640, height: 480, opacity: 0, pointerEvents: "none", zIndex: -1 }} />
                            {mode === "upload" && uploadImageUrl && (
                                <img
                                    ref={hiddenImageRef}
                                    src={uploadImageUrl}
                                    alt="User portrait"
                                    style={{ display: "none" }}
                                    crossOrigin="anonymous"
                                />
                            )}

                            {/* Main Render Canvas */}
                            <canvas
                                ref={canvasRef}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: 520,
                                    objectFit: "contain",
                                    borderRadius: 14
                                }}
                            />

                            {/* Canvas AR Overlay Badge */}
                            {((mode === "camera" && cameraActive) || (mode === "upload" && uploadImageUrl)) && (
                                <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8, zIndex: 10, flexWrap: "wrap" }}>
                                    <Tag color="#ec4899" style={{ border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 13 }}>
                                        ✨ Màu đang thử: {selectedColor ? selectedColor.name : "Tự nhiên"}
                                    </Tag>
                                    <Tag color={hasLandmarks ? "success" : "warning"} style={{ border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 13 }}>
                                        {hasLandmarks ? "🟢 Đã nhận diện khuôn mặt" : "🟡 Đang định vị khuôn mặt..."}
                                    </Tag>
                                </div>
                            )}

                            {/* Mode specific prompts */}
                            {mode === "camera" && !cameraActive && (
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#fff", zIndex: 15 }}>
                                    <CameraOutlined style={{ fontSize: 48, color: "#ec4899", marginBottom: 12 }} />
                                    <Title level={4} style={{ color: "#fff", margin: 0 }}>Bật Live Camera để thử màu tóc</Title>
                                    <Button type="primary" size="large" icon={<CameraOutlined />} onClick={startCamera} style={{ marginTop: 16, borderRadius: 12, background: "#ec4899", borderColor: "#ec4899" }}>
                                        Mở Webcam Ngay
                                    </Button>
                                </div>
                            )}

                            {mode === "upload" && !uploadImageUrl && (
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 24, zIndex: 15 }}>
                                    <Upload beforeUpload={handleBeforeUpload} showUploadList={false} accept="image/*">
                                        <Button type="primary" size="large" icon={<UploadOutlined />} style={{ borderRadius: 12, background: "#ec4899", borderColor: "#ec4899" }}>
                                            Upload Ảnh Chân Dung
                                        </Button>
                                    </Upload>
                                    <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 12 }}>
                                        Chọn ảnh mặt nhìn thẳng để AI định vị vùng tóc nhuộm chính xác nhất.
                                    </Text>
                                </div>
                            )}
                        </div>

                        {/* Action Controls */}
                        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadSnapshot}
                                style={{ borderRadius: 10, background: "#ec4899", borderColor: "#ec4899" }}
                            >
                                Tải Ảnh AR HD
                            </Button>
                        </div>
                    </Card>
                </Col>

                {/* Right Selector Panel: Hair Colors & Controls */}
                <Col xs={24} lg={9}>
                    <Space direction="vertical" size={20} style={{ width: "100%" }}>
                        {/* 1. Hair Color Filters */}
                        <Card
                            title={
                                <Space>
                                    <BgColorsOutlined style={{ color: "#ec4899" }} />
                                    <span>Bảng màu nhuộm TikTok</span>
                                </Space>
                            }
                            style={{ borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}
                        >
                            <Row gutter={[10, 10]}>
                                <Col span={24}>
                                    <div
                                        onClick={() => setSelectedColor(null)}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: 12,
                                            border: selectedColor === null ? "2px solid #ec4899" : "1px solid #e2e8f0",
                                            background: selectedColor === null ? "#fdf2f8" : "#fafafa",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <Space size={10} align="center">
                                            <div
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #1e293b, #64748b)",
                                                    border: "2px solid #fff",
                                                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                                                }}
                                            />
                                            <div>
                                                <Text strong style={{ fontSize: 13, display: "block" }}>Màu Gốc Tự Nhiên (Không dùng filter)</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>Click các màu bên dưới để bắt đầu thử nhuộm</Text>
                                            </div>
                                        </Space>
                                        {selectedColor === null && <Tag color="pink">Đang xem màu gốc</Tag>}
                                    </div>
                                </Col>

                                {HAIR_COLOR_PRESETS.map((color) => {
                                    const isSelected = selectedColor?.id === color.id;
                                    return (
                                        <Col span={12} key={color.id}>
                                            <div
                                                onClick={() => setSelectedColor(color)}
                                                style={{
                                                    padding: 10,
                                                    borderRadius: 12,
                                                    border: isSelected ? "2px solid #ec4899" : "1px solid #e2e8f0",
                                                    background: isSelected ? "#fdf2f8" : "#fafafa",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <Space size={8} align="center">
                                                    <div
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            borderRadius: "50%",
                                                            background: color.hex,
                                                            border: "2px solid #fff",
                                                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                                                        }}
                                                    />
                                                    <div style={{ lineHeight: 1.2 }}>
                                                        <Text strong style={{ fontSize: 13, display: "block" }}>{color.name}</Text>
                                                        {color.badge && <Tag color="pink" style={{ fontSize: 10, padding: "0 4px", margin: 0 }}>{color.badge}</Tag>}
                                                    </div>
                                                </Space>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>

                            <Divider style={{ margin: "16px 0 12px" }} />

                            {/* Custom Color Picker */}
                            <Row align="middle" justify="space-between">
                                <Text strong>Màu nhuộm tự chọn (Custom Color):</Text>
                                <ColorPicker value={customHex} onChange={handleCustomColorChange} showText />
                            </Row>
                        </Card>

                        {/* 2. Color Intensity & Gloss Sliders */}
                        <Card
                            title="Tùy chỉnh hiệu ứng nhuộm"
                            style={{ borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}
                        >
                            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                                <div>
                                    <Text strong style={{ fontSize: 13 }}>Đậm nhạt màu nhuộm (Opacity): {Math.round(colorOpacity * 100)}%</Text>
                                    <Slider
                                        min={0.2}
                                        max={1.0}
                                        step={0.05}
                                        value={colorOpacity}
                                        onChange={setColorOpacity}
                                    />
                                </div>
                                <div>
                                    <Text strong style={{ fontSize: 13 }}>Độ bóng mượt (Gloss Shine): {Math.round(colorShine * 100)}%</Text>
                                    <Slider
                                        min={0.0}
                                        max={1.0}
                                        step={0.05}
                                        value={colorShine}
                                        onChange={setColorShine}
                                    />
                                </div>
                            </Space>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
}
