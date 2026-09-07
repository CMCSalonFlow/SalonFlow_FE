/**
 * SalonFlow Client-Side Hair Color Engine
 * Real-time 3D Salon Hair Recolor with Feathering, HSL Chromaticity, and Specular Hair Shine.
 * 0$ Cloud Cost - 100% Canvas API & Local WebAssembly
 */

export const HAIR_COLOR_PRESETS = [

    // ===== TÔNG TRUNG TÍNH =====
    {
        id: "natural_black",
        name: "Đen Tự Nhiên",
        hex: "#1C1C1C",
        category: "neutral",
        targetL: 0.11, targetS: 0.04,
        defaultOpacity: 0.84, defaultShine: 0.70,
    },
    {
        id: "dark_brown",
        name: "Nâu Đen",
        hex: "#2A1A10",
        category: "neutral",
        targetL: 0.17, targetS: 0.30,
        defaultOpacity: 0.80, defaultShine: 0.65,
    },
    {
        id: "western_brown",
        name: "Nâu Tây",
        hex: "#7A5840",
        category: "neutral",
        targetL: 0.36, targetS: 0.32,
        defaultOpacity: 0.72, defaultShine: 0.60,
    },

    // ===== TÔNG NÓNG =====
    {
        id: "light_brown",
        name: "Nâu Sáng",
        hex: "#A07845",
        category: "warm",
        targetL: 0.45, targetS: 0.38,
        defaultOpacity: 0.68, defaultShine: 0.62,
    },
    {
        id: "chestnut_brown",
        name: "Nâu Hạt Dẻ",
        hex: "#8A5C38",
        category: "warm",
        targetL: 0.38, targetS: 0.42,
        defaultOpacity: 0.72, defaultShine: 0.60,
    },
    {
        id: "golden_brown",
        name: "Vàng Nâu",
        hex: "#C49252",
        category: "warm",
        targetL: 0.55, targetS: 0.50,
        defaultOpacity: 0.65, defaultShine: 0.65,
    },
    {
        id: "auburn_red",
        name: "Đỏ Nâu",
        hex: "#7C322A",
        category: "warm",
        targetL: 0.32, targetS: 0.52,
        defaultOpacity: 0.75, defaultShine: 0.56,
    },
    {
        id: "wine_red",
        name: "Đỏ Rượu",
        hex: "#6C1A28",
        category: "warm",
        targetL: 0.25, targetS: 0.72,
        defaultOpacity: 0.78, defaultShine: 0.54,
    },
    {
        id: "plum_red",
        name: "Đỏ Tía",
        hex: "#72204C",
        category: "warm",
        targetL: 0.28, targetS: 0.62,
        defaultOpacity: 0.76, defaultShine: 0.52,
    },
    {
        id: "copper_orange",
        name: "Cam Đồng",
        hex: "#C26C22",
        category: "warm",
        targetL: 0.44, targetS: 0.78,
        defaultOpacity: 0.68, defaultShine: 0.60,
    },
    {
        id: "golden_amber",
        name: "Vàng Đồng",
        hex: "#C88828",
        category: "warm",
        targetL: 0.46, targetS: 0.72,
        defaultOpacity: 0.65, defaultShine: 0.62,
    },
    {
        id: "lemon_yellow",
        name: "Vàng Chanh",
        hex: "#CECC50",
        category: "warm",
        targetL: 0.56, targetS: 0.68,
        defaultOpacity: 0.60, defaultShine: 0.68,
    },

    // ===== TÔNG LẠNH =====
    {
        id: "smoky_brown",
        name: "Nâu Khói",
        hex: "#4E3E35",
        category: "cool",
        targetL: 0.24, targetS: 0.18,
        defaultOpacity: 0.75, defaultShine: 0.58,
    },
    {
        id: "smoky_grey",
        name: "Xám Khói",
        hex: "#7E8590",
        category: "cool",
        targetL: 0.52, targetS: 0.06,
        defaultOpacity: 0.66, defaultShine: 0.68,
    },
    {
        id: "silver_grey",
        name: "Xám Bạc",
        hex: "#AEB5BC",
        category: "cool",
        targetL: 0.70, targetS: 0.05,
        defaultOpacity: 0.60, defaultShine: 0.76,
    },
    {
        id: "light_silver",
        name: "Bạc Khói",
        hex: "#C5C9CE",
        category: "cool",
        targetL: 0.78, targetS: 0.04,
        defaultOpacity: 0.56, defaultShine: 0.80,
    },
    {
        id: "platinum",
        name: "Bạch Kim",
        hex: "#E2DBCA",
        category: "cool",
        targetL: 0.85, targetS: 0.14,
        defaultOpacity: 0.52, defaultShine: 0.85,
    },
    {
        id: "blue_black",
        name: "Xanh Đen",
        hex: "#1A2234",
        category: "cool",
        targetL: 0.15, targetS: 0.36,
        defaultOpacity: 0.82, defaultShine: 0.70,
    },
    {
        id: "moss_green",
        name: "Xanh Rêu",
        hex: "#4A5C44",
        category: "cool",
        targetL: 0.31, targetS: 0.16,
        defaultOpacity: 0.72, defaultShine: 0.56,
    },
    {
        id: "dusty_blue",
        name: "Xanh Dương Khói",
        hex: "#4C6478",
        category: "cool",
        targetL: 0.38, targetS: 0.22,
        defaultOpacity: 0.68, defaultShine: 0.58,
    },
    {
        id: "navy_blue",
        name: "Xanh Navy",
        hex: "#1E3050",
        category: "cool",
        targetL: 0.21, targetS: 0.44,
        defaultOpacity: 0.80, defaultShine: 0.62,
    },
    {
        id: "smoky_purple",
        name: "Tím Khói",
        hex: "#7C6090",
        category: "cool",
        targetL: 0.47, targetS: 0.22,
        defaultOpacity: 0.70, defaultShine: 0.58,
    },
    {
        id: "lavender",
        name: "Tím Lavender",
        hex: "#A092C4",
        category: "cool",
        targetL: 0.65, targetS: 0.32,
        defaultOpacity: 0.62, defaultShine: 0.68,
    },
    {
        id: "dark_purple",
        name: "Tím Than",
        hex: "#3E2656",
        category: "cool",
        targetL: 0.24, targetS: 0.40,
        defaultOpacity: 0.78, defaultShine: 0.54,
    },
    {
        id: "dusty_rose",
        name: "Hồng Khói",
        hex: "#D09098",
        category: "cool",
        targetL: 0.70, targetS: 0.22,
        defaultOpacity: 0.60, defaultShine: 0.68,
    },
    {
        id: "pastel_pink",
        name: "Hồng Pastel",
        hex: "#F2A0AE",
        category: "cool",
        targetL: 0.78, targetS: 0.80,
        defaultOpacity: 0.56, defaultShine: 0.70,
    },
    {
        id: "blue_silver",
        name: "Bạc Xanh",
        hex: "#8AB0BA",
        category: "cool",
        targetL: 0.64, targetS: 0.22,
        defaultOpacity: 0.62, defaultShine: 0.74,
    },
    {
        id: "teal",
        name: "Xanh Ngọc",
        hex: "#2A8C9A",
        category: "cool",
        targetL: 0.38, targetS: 0.58,
        defaultOpacity: 0.68, defaultShine: 0.60,
    },
    {
        id: "green",
        name: "Xanh Lá",
        hex: "#4A8C52",
        category: "cool",
        targetL: 0.42, targetS: 0.32,
        defaultOpacity: 0.68, defaultShine: 0.56,
    },
    {
        id: "grey_purple",
        name: "Xám Tím",
        hex: "#7A6C90",
        category: "cool",
        targetL: 0.50, targetS: 0.18,
        defaultOpacity: 0.66, defaultShine: 0.62,
    },
];

/**
 * HSL Color Space Utilities
 */
export function hexToRgb(hex) {
    const cleanHex = hex.replace("#", "");
    const num = parseInt(cleanHex, 16);
    return [
        (num >> 16) & 255,
        (num >> 8) & 255,
        num & 255
    ];
}

export function rgbToHsl(r, g, b) {
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

export function hslToRgb(h, s, l) {
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

// Offscreen canvases for performance optimization
let maskCanvas = null;
let maskCtx = null;

/**
 * Apply feathering (edge softening) to hair mask using Canvas filter
 */
function createFeatheredMask(hairMaskData, maskW, maskH, targetW, targetH, featherPx = 4) {
    if (!maskCanvas) {
        maskCanvas = document.createElement("canvas");
    }
    if (maskCanvas.width !== targetW || maskCanvas.height !== targetH) {
        maskCanvas.width = targetW;
        maskCanvas.height = targetH;
        maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
    } else {
        maskCtx.clearRect(0, 0, targetW, targetH);
    }

    // Step 1: Render raw mask onto temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = maskW;
    tempCanvas.height = maskH;
    const tempCtx = tempCanvas.getContext("2d");
    const imgData = tempCtx.createImageData(maskW, maskH);

    for (let i = 0; i < hairMaskData.length; i++) {
        const val = Math.min(255, Math.max(0, Math.round(hairMaskData[i] * 255)));
        const idx = i * 4;
        imgData.data[idx] = 255;
        imgData.data[idx + 1] = 255;
        imgData.data[idx + 2] = 255;
        imgData.data[idx + 3] = val;
    }
    tempCtx.putImageData(imgData, 0, 0);

    // Step 2: Scale up and apply blur filter for edge feathering
    maskCtx.save();
    if (featherPx > 0) {
        maskCtx.filter = `blur(${featherPx}px)`;
    }
    maskCtx.drawImage(tempCanvas, 0, 0, maskW, maskH, 0, 0, targetW, targetH);
    maskCtx.restore();

    return maskCtx.getImageData(0, 0, targetW, targetH).data;
}

/**
 * Render Hair Color Try On onto Canvas
 * 
 * @param {HTMLCanvasElement} targetCanvas - Target canvas to render output
 * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement} originalImage - Source image/video
 * @param {Float32Array | Uint8Array} hairMaskData - MediaPipe hair confidence mask
 * @param {number} maskW - Width of raw mask
 * @param {number} maskH - Height of raw mask
 * @param {Object} options - Dye configuration settings
 * @returns {number} Number of dyed pixels
 */
export function applyHairColorToCanvas(targetCanvas, originalImage, hairMaskData, maskW, maskH, options = {}) {
    const {
        hexColor = "#d9ab55",
        opacity = 0.50,
        shine = 0.60,
        feather = "auto",
        hueShift = 0,
        satMultiplier = 1.0,
        brightnessShift = 0
    } = options;

    if (!targetCanvas || !originalImage) return 0;

    const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
    const width = targetCanvas.width;
    const height = targetCanvas.height;

    // Draw original image first
    ctx.drawImage(originalImage, 0, 0, width, height);

    // If no color selected or no mask data, return original image as-is
    if (!hairMaskData || !hexColor) return 0;

    // Auto-calculate optimal feather radius based on image width
    const autoFeatherPx = Math.max(3, Math.min(8, Math.round(width / 220)));
    const effectiveFeather = typeof feather === "number" ? feather : autoFeatherPx;

    // Create edge-feathered mask
    const featheredAlphaData = createFeatheredMask(hairMaskData, maskW, maskH, width, height, effectiveFeather);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Target Dye Color in HSL
    const [dyeR, dyeG, dyeB] = hexToRgb(hexColor);
    const [baseH, baseS, baseL] = rgbToHsl(dyeR, dyeG, dyeB);

    const targetH = (baseH + hueShift + 360) % 360;
    const targetS = Math.min(1.0, Math.max(0.0, baseS * satMultiplier));
    const targetL = Math.min(0.95, Math.max(0.05, baseL + (brightnessShift / 100)));

    let dyedPixelCount = 0;
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
        const maskAlpha = featheredAlphaData[i * 4 + 3] / 255.0;
        if (maskAlpha <= 0.04) continue;

        const pixelIdx = i * 4;
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];

        const [origH, origS, origL] = rgbToHsl(r, g, b);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        // Skip non-hair bright skin pixels if mask confidence is marginal
        const isSkin = (luma > 85) && (r > 75) && (g > 50) && (r > b + 12) && (Math.abs(r - g) < 50);
        let weight = maskAlpha;
        if (isSkin && maskAlpha < 0.7) {
            weight *= 0.2;
        }

        if (weight <= 0.05) continue;

        // 3D Salon Hair Recolor Chromaticity Calculation
        const contrastRatio = Math.min(1.35, Math.pow(Math.max(0.04, origL) / 0.24, 0.72));

        let finalL;
        let finalS = targetS;
        let finalH = targetH;

        if (targetL > 0.45) {
            // Light Dyes (Blonde, Silver, Pastel, Milk Tea)
            const modulatedL = targetL * contrastRatio;
            const specularHighlight = Math.pow(Math.max(0, origL), 1.3) * 0.20 * shine;
            finalL = Math.min(0.96, Math.max(0.20, modulatedL + specularHighlight));
            finalS = Math.min(1.0, targetS * 1.10);
        } else {
            // Dark Dyes (Burgundy, Espresso, Auburn, Emerald)
            const modulatedL = targetL * Math.pow(contrastRatio, 0.85);
            const specularHighlight = Math.pow(Math.max(0, origL), 1.2) * 0.22 * shine;
            finalL = Math.min(0.90, Math.max(0.08, modulatedL + specularHighlight));
            finalS = Math.min(1.0, targetS * 0.95 + origS * 0.05);
        }

        const [newR, newG, newB] = hslToRgb(finalH, finalS, finalL);

        // Alpha Blending
        const blendRatio = Math.min(0.98, weight * opacity);
        data[pixelIdx] = Math.round(r * (1 - blendRatio) + newR * blendRatio);
        data[pixelIdx + 1] = Math.round(g * (1 - blendRatio) + newG * blendRatio);
        data[pixelIdx + 2] = Math.round(b * (1 - blendRatio) + newB * blendRatio);

        dyedPixelCount++;
    }

    ctx.putImageData(imgData, 0, 0);
    return dyedPixelCount;
}
