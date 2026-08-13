import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as bodyPix from "@tensorflow-models/body-pix";

let netInstance = null;
let isInitializingSegmenter = false;

/**
 * Initialize TensorFlow.js BodyPix Person & Background Segmenter
 */
export const initHairSegmenter = async () => {
    if (netInstance) return netInstance;

    if (isInitializingSegmenter) {
        while (isInitializingSegmenter) {
            await new Promise((r) => setTimeout(r, 100));
        }
        return netInstance;
    }

    isInitializingSegmenter = true;
    console.log("%c[SalonFlow Hair AI 🧠] Đang nạp mô hình BodyPix Person Segmenter...", "color: #ec4899; font-weight: bold; font-size: 13px;");

    try {
        await tf.ready();
        netInstance = await bodyPix.load({
            architecture: "MobileNetV1",
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
        });
        console.log("%c[SalonFlow Hair AI ✅] Mô hình BodyPix Person Segmenter đã sẵn sàng!", "color: #22c55e; font-weight: bold; font-size: 13px;");
        isInitializingSegmenter = false;
        return netInstance;
    } catch (err) {
        console.error("[SalonFlow Hair AI Error] BodyPix load error:", err);
        isInitializingSegmenter = false;
        return null;
    }
};

/**
 * HSL Color Space Utilities
 */
function hexToRgb(hex) {
    const cleanHex = hex.replace("#", "");
    return [
        parseInt(cleanHex.substring(0, 2), 16),
        parseInt(cleanHex.substring(2, 4), 16),
        parseInt(cleanHex.substring(4, 6), 16)
    ];
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
    h = (h % 360 + 360) % 360 / 360;
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Monotone Chain 2D Convex Hull Algorithm
 * Computes a non-self-intersecting 2D convex polygon around face keypoints.
 * 100% stable at any head turn angle (Yaw left/right profile views).
 */
function computeConvexHull(points) {
    if (!points || points.length < 3) return points || [];

    const sorted = [...points].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower = [];
    for (let p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }

    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        const p = sorted[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    lower.pop();
    upper.pop();

    return [...lower, ...upper];
}

// Ultra-fast Offscreen Mask Canvas for O(1) Face Exclusion Lookup
let offscreenFaceCanvas = null;
let offscreenFaceCtx = null;
let cachedFaceMaskData = null;
let cachedLandmarksRef = null;

function getFacePolygon(landmarks, width, height) {
    if (!landmarks || landmarks.length === 0) return [];

    const getPt = (idx) => {
        const kp = landmarks[idx];
        if (!kp) return { x: width * 0.5, y: height * 0.3 };
        return {
            x: kp.x > 1 ? kp.x : kp.x * width,
            y: kp.y > 1 ? kp.y : kp.y * height
        };
    };

    const foreheadCenter = getPt(10);
    const chin = getPt(152);
    const faceHeight = Math.hypot(chin.y - foreheadCenter.y, chin.x - foreheadCenter.x);

    // Key Facial Feature Indices: Forehead, Eyebrows, Eyes, Nose, Lips, Cheeks, Jawline, Chin
    const faceFeatureIndices = [
        10, 67, 109, 338, 297, 103, 332, 54, 21, 162, 284, 251, 389, // Hairline & Temples
        70, 63, 105, 66, 107, 336, 296, 334, 293, 300, // Eyebrows
        1, 4, 6, 197, 195, 5, // Nose line
        61, 291, 13, 14, 17, 0, 269, 37, 267, // Lips & Mouth
        234, 454, 127, 356, 152, 132, 361, 58, 288, 172, 397 // Cheeks, Jawline, Chin
    ];

    const rawPoints = faceFeatureIndices.map((idx) => {
        const pt = getPt(idx);
        // Slightly offset forehead hairline top points upwards
        if ([10, 67, 109, 338, 297, 103, 332].includes(idx)) {
            return { x: pt.x, y: pt.y - (faceHeight * 0.06) };
        }
        return pt;
    });

    // Compute Dynamic 2D Convex Hull
    return computeConvexHull(rawPoints);
}

function updateFaceMaskCanvas(landmarks, width, height) {
    if (!landmarks || landmarks.length === 0) return null;
    if (landmarks === cachedLandmarksRef && cachedFaceMaskData) return cachedFaceMaskData;

    if (!offscreenFaceCanvas) {
        offscreenFaceCanvas = document.createElement("canvas");
    }
    if (offscreenFaceCanvas.width !== width || offscreenFaceCanvas.height !== height) {
        offscreenFaceCanvas.width = width;
        offscreenFaceCanvas.height = height;
        offscreenFaceCtx = offscreenFaceCanvas.getContext("2d", { willReadFrequently: true });
    }

    const ctx = offscreenFaceCtx;
    ctx.clearRect(0, 0, width, height);

    const facePolygon = getFacePolygon(landmarks, width, height);

    if (facePolygon.length > 0) {
        ctx.beginPath();
        ctx.moveTo(facePolygon[0].x, facePolygon[0].y);
        for (let i = 1; i < facePolygon.length; i++) {
            ctx.lineTo(facePolygon[i].x, facePolygon[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }

    try {
        const imgData = ctx.getImageData(0, 0, width, height);
        cachedFaceMaskData = imgData.data;
        cachedLandmarksRef = landmarks;
        return cachedFaceMaskData;
    } catch (e) {
        return null;
    }
}

let lastDyeLogTime = 0;

/**
 * HIGH-REALISM SALON 3D HAIR DYE PIPELINE (L'Oréal / TikTok AR Standard)
 * 
 * 1. Dynamic Pigment Tonal Lifting: Simulates natural hair bleaching for bright salon dye shades.
 * 2. 3D Specular Hair Highlights: Preserves ambient room light reflections on hair strands.
 * 3. HSL Multi-tone Chromaticity: Preserves natural hair strand texture, highlights & shadows.
 */
export const renderTikTokHairPipeline = (
    ctx,
    landmarks,
    personMaskData,
    width,
    height,
    colorPreset,
    opacity = 0.85,
    shine = 0.6
) => {
    if (!ctx || !colorPreset) return 0;

    let headMinX = 0;
    let headMaxX = width;
    let scanMinY = 0;
    let scanMaxY = Math.min(height, Math.ceil(height * 0.7));

    // Instant O(1) Face Mask Lookup Array
    const faceMaskArray = updateFaceMaskCanvas(landmarks, width, height);

    if (landmarks && landmarks.length >= 300) {
        const getPt = (idx) => {
            const kp = landmarks[idx];
            if (!kp) return { x: width * 0.5, y: height * 0.3 };
            return {
                x: kp.x > 1 ? kp.x : kp.x * width,
                y: kp.y > 1 ? kp.y : kp.y * height
            };
        };

        const foreheadCenter = getPt(10);
        const chin = getPt(152);
        const leftCheek = getPt(234);
        const rightCheek = getPt(454);

        const faceHeight = Math.hypot(chin.y - foreheadCenter.y, chin.x - foreheadCenter.x);
        const faceWidth = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);

        // Scan region covering top scalp dome ALL THE WAY DOWN to tragus/sideburn level!
        headMinX = Math.max(0, Math.floor(Math.min(leftCheek.x, rightCheek.x) - (faceWidth * 0.75)));
        headMaxX = Math.min(width, Math.ceil(Math.max(leftCheek.x, rightCheek.x) + (faceWidth * 0.75)));
        scanMinY = Math.max(0, Math.floor(foreheadCenter.y - (faceHeight * 0.95)));
        scanMaxY = Math.min(height, Math.ceil(Math.max(leftCheek.y, rightCheek.y) + (faceHeight * 0.3)));
    }

    const scanW = headMaxX - headMinX;
    const scanH = scanMaxY - scanMinY;

    if (scanW <= 0 || scanH <= 0) return 0;

    let imgData;
    try {
        imgData = ctx.getImageData(headMinX, scanMinY, scanW, scanH);
    } catch (e) {
        return 0;
    }

    const data = imgData.data;

    // Target Dye Color in HSL
    const [dyeR, dyeG, dyeB] = hexToRgb(colorPreset.hex);
    const [targetH, targetS, targetL] = rgbToHsl(dyeR, dyeG, dyeB);

    let dyedPixelCount = 0;

    // Pixel-Level Hair Strand Salon Recolor Loop
    for (let y = 0; y < scanH; y++) {
        const globalY = scanMinY + y;
        const rowOffset = globalY * width;

        for (let x = 0; x < scanW; x++) {
            const globalX = headMinX + x;
            const globalIdx = rowOffset + globalX;

            // STAGE 1: Face & Forehead Exclusion (0% Bleed on Face Skin)
            if (faceMaskArray && faceMaskArray[globalIdx * 4] > 200) {
                continue;
            }

            // STAGE 2: Mirror-Aligned BodyPix Person Constraint (0% Background Wall Bleed)
            if (personMaskData) {
                const mirrorX = width - 1 - globalX;
                const maskIndex = rowOffset + mirrorX;
                if (personMaskData[maskIndex] === 0) {
                    continue; // Skip room background wall
                }
            }

            const pixelIdx = (y * scanW + x) * 4;
            const r = data[pixelIdx];
            const g = data[pixelIdx + 1];
            const b = data[pixelIdx + 2];

            const [origH, origS, origL] = rgbToHsl(r, g, b);
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            // STAGE 3: Skin Tone Exclusion (Excludes forehead, cheeks, neck)
            const isSkin = (luma > 75) && (r > 65) && (g > 45) && (r > b + 6) && (Math.abs(r - g) < 55);
            if (isSkin) continue;

            // STAGE 4: Background Wall & Non-Hair Filter (Eliminates white aura halo around head)
            const isWall = (luma > 135 && origS < 0.22) || (luma > 155) || (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && luma > 125);
            if (isWall) continue;

            // STAGE 5: Professional TikTok AR 3D Hair Recolor Engine
            if (luma < 155) {
                // Soft Alpha Mask Edge Feathering
                const strandWeight = Math.min(1.0, Math.max(0.4, (155 - luma) / 80.0)) * opacity;
                if (strandWeight <= 0) continue;

                let finalL;
                let finalS = targetS;
                let finalH = targetH;

                // Capped contrast ratio prevents lightness blow-up on bright non-hair pixels
                const contrastRatio = Math.min(1.25, Math.pow(Math.max(0.04, origL) / 0.22, 0.70));

                if (targetL > 0.45) {
                    // LIGHT DYES (Platinum Silver, Rose Gold, Honey Blonde)
                    const modulatedL = targetL * contrastRatio;
                    const specularHighlight = Math.pow(Math.max(0, origL), 1.3) * 0.18 * shine;

                    finalL = Math.min(0.96, Math.max(0.22, modulatedL + specularHighlight));
                    finalS = Math.min(1.0, targetS * 1.10);
                } else {
                    // DARK / MEDIUM DYES (Cam Đồng Amber, Nâu Espresso, Đỏ Burgundy, Emerald)
                    const modulatedL = targetL * Math.pow(contrastRatio, 0.85);
                    const specularHighlight = Math.pow(Math.max(0, origL), 1.2) * 0.22 * shine;

                    finalL = Math.min(0.90, Math.max(0.08, modulatedL + specularHighlight));
                    finalS = Math.min(1.0, targetS * 0.95 + origS * 0.05);
                }

                const [newR, newG, newB] = hslToRgb(finalH, finalS, finalL);

                // Smooth Natural Blend into Canvas Frame
                const blendRatio = Math.min(0.95, strandWeight);
                data[pixelIdx] = Math.round(r * (1 - blendRatio) + newR * blendRatio);
                data[pixelIdx + 1] = Math.round(g * (1 - blendRatio) + newG * blendRatio);
                data[pixelIdx + 2] = Math.round(b * (1 - blendRatio) + newB * blendRatio);

                dyedPixelCount++;
            }
        }
    }

    // Write pixel-level hair mask recolor back to canvas
    ctx.putImageData(imgData, headMinX, scanMinY);

    // Console Logging for user visibility
    const now = Date.now();
    if (now - lastDyeLogTime > 2500) {
        console.log(
            `%c[SalonFlow TikTok Hair Dye 💈] SALON 3D REALISM ACTIVE: Nhuộm ${colorPreset.name} (${colorPreset.hex}) lên ${dyedPixelCount.toLocaleString()} pixels tóc!`,
            "color: #ec4899; font-weight: bold; font-size: 13px;"
        );
        lastDyeLogTime = now;
    }

    return dyedPixelCount;
};
