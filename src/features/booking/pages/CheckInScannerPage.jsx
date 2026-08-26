import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import {
    Alert,
    Button,
    Card,
    Input,
    Space,
    Typography
} from "antd";
import {
    CameraOutlined,
    LinkOutlined,
    QrcodeOutlined,
    ReloadOutlined
} from "@ant-design/icons";

const { Text, Title } = Typography;

const parseCheckInUrl = (rawValue) => {
    const value = rawValue.trim();
    if (!value) {
        throw new Error("Vui lòng nhập hoặc quét URL QR.");
    }

    const url = new URL(value, window.location.origin);
    const bookingId = url.searchParams.get("bookingId");
    const signature = url.searchParams.get("signature");

    if (!bookingId || !signature) {
        throw new Error("QR thiếu bookingId hoặc signature.");
    }

    return `/check-in?bookingId=${encodeURIComponent(bookingId)}&signature=${encodeURIComponent(signature)}`;
};

export default function CheckInScannerPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const frameRef = useRef(null);
    const detectedRef = useRef(false);

    const [manualUrl, setManualUrl] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [scanError, setScanError] = useState("");

    const stopCamera = useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setCameraReady(false);
    }, []);

    const handleQrValue = useCallback((value) => {
        try {
            const targetUrl = parseCheckInUrl(value);
            detectedRef.current = true;
            stopCamera();
            navigate(targetUrl);
        } catch (err) {
            setScanError(err.message);
        }
    }, [navigate, stopCamera]);

    const startCamera = useCallback(async () => {
        setCameraError("");
        setScanError("");
        detectedRef.current = false;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("Trình duyệt không hỗ trợ truy cập camera hoặc đang chạy ở môi trường không an toàn (cần HTTPS hoặc localhost). Vui lòng dán URL QR vào ô bên dưới.");
            return;
        }

        try {
            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" }
                },
                audio: false
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true");
                await videoRef.current.play();
                setCameraReady(true);
            }

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            const scan = () => {
                if (!videoRef.current || detectedRef.current) return;

                const video = videoRef.current;
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code && code.data) {
                        handleQrValue(code.data);
                        return;
                    }
                }

                frameRef.current = requestAnimationFrame(scan);
            };

            frameRef.current = requestAnimationFrame(scan);
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("Không mở được camera. Vui lòng cấp quyền truy cập camera trong trình duyệt hoặc sử dụng HTTPS.");
        }
    }, [handleQrValue, stopCamera]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            startCamera();
        }, 0);

        return () => {
            window.clearTimeout(timer);
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    const submitManualUrl = () => {
        handleQrValue(manualUrl);
    };

    return (
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
            <Space direction="vertical" size={18} style={{ width: "100%" }}>
                <div>
                    <Title level={3} style={{ marginBottom: 4 }}>
                        <QrcodeOutlined /> Quét QR check-in
                    </Title>
                    <Text type="secondary">
                        Đưa QR trong email booking vào khung camera để check-in khách hàng.
                    </Text>
                </div>

                {cameraError && (
                    <Alert type="warning" showIcon message={cameraError} />
                )}

                {scanError && (
                    <Alert type="error" showIcon message={scanError} />
                )}

                <Card style={{ borderRadius: 8 }}>
                    <div
                        style={{
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: 8,
                            background: "#111827",
                            aspectRatio: "16 / 9",
                            display: "grid",
                            placeItems: "center"
                        }}
                    >
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: cameraReady ? "block" : "none"
                            }}
                        />
                        {!cameraReady && (
                            <Space direction="vertical" align="center">
                                <CameraOutlined style={{ color: "#fff", fontSize: 44 }} />
                                <Text style={{ color: "#fff" }}>Đang chuẩn bị camera...</Text>
                            </Space>
                        )}
                    </div>

                    <Space wrap style={{ marginTop: 16 }}>
                        <Button type="primary" icon={<ReloadOutlined />} onClick={startCamera}>
                            Mở lại camera
                        </Button>
                        <Button icon={<CameraOutlined />} onClick={stopCamera}>
                            Tắt camera
                        </Button>
                    </Space>
                </Card>

                <Card style={{ borderRadius: 8 }}>
                    <Space.Compact style={{ width: "100%" }}>
                        <Input
                            prefix={<LinkOutlined />}
                            placeholder="Dán URL QR: http://localhost:5173/check-in?bookingId=123&signature=abcxyz"
                            value={manualUrl}
                            onChange={(event) => setManualUrl(event.target.value)}
                            onPressEnter={submitManualUrl}
                        />
                        <Button type="primary" onClick={submitManualUrl}>
                            Check-in
                        </Button>
                    </Space.Compact>
                </Card>
            </Space>
        </div>
    );
}
