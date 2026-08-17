import { FilesetResolver, ImageSegmenter } from "@mediapipe/tasks-vision";

let imageSegmenterInstance = null;
let isInitializing = false;

// MediaPipe Hair Segmenter Model (Float32 precision bundle)
const HAIR_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/1/hair_segmenter.tflite";
const WASM_LOADER_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

/**
 * Initialize MediaPipe ImageSegmenter configured with Hair Segmenter model.
 */
export async function initHairSegmenter() {
    if (imageSegmenterInstance) {
        return imageSegmenterInstance;
    }

    if (isInitializing) {
        while (isInitializing) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return imageSegmenterInstance;
    }

    isInitializing = true;
    console.log("%c[SalonFlow AI 💈] Đang nạp mô hình MediaPipe Hair Segmenter...", "color: #3b82f6; font-weight: bold; font-size: 13px;");

    try {
        const vision = await FilesetResolver.forVisionTasks(WASM_LOADER_URL);
        imageSegmenterInstance = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: HAIR_MODEL_URL,
                delegate: "GPU" // Attempts WebGL GPU acceleration, falls back to CPU seamlessly
            },
            runningMode: "IMAGE",
            outputCategoryMask: true,
            outputConfidenceMasks: true
        });

        console.log("%c[SalonFlow AI ✅] Mô hình MediaPipe Hair Segmenter đã sẵn sàng!", "color: #10b981; font-weight: bold; font-size: 13px;");
        isInitializing = false;
        return imageSegmenterInstance;
    } catch (gpuError) {
        console.warn("[SalonFlow AI ⚠️] Khởi tạo WebGL GPU thất bại, chuyển sang nạp trên CPU...", gpuError);
        try {
            const vision = await FilesetResolver.forVisionTasks(WASM_LOADER_URL);
            imageSegmenterInstance = await ImageSegmenter.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: HAIR_MODEL_URL,
                    delegate: "CPU"
                },
                runningMode: "IMAGE",
                outputCategoryMask: true,
                outputConfidenceMasks: true
            });
            console.log("%c[SalonFlow AI ✅] Mô hình MediaPipe Hair Segmenter (CPU) đã nạp thành công!", "color: #10b981; font-weight: bold; font-size: 13px;");
            isInitializing = false;
            return imageSegmenterInstance;
        } catch (err) {
            console.error("[SalonFlow AI ❌] Không thể nạp MediaPipe Hair Segmenter:", err);
            isInitializing = false;
            return null;
        }
    }
}

/**
 * Segment hair from an Image, HTMLCanvasElement, or Video Frame.
 * Returns Uint8Array mask or Float32Array confidence mask.
 * 
 * @param {HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} imageSource 
 * @returns {Promise<{ mask: Float32Array | Uint8Array, width: number, height: number } | null>}
 */
export async function segmentHair(imageSource) {
    try {
        const segmenter = await initHairSegmenter();
        if (!segmenter) return null;

        const result = segmenter.segment(imageSource);
        if (!result) return null;

        let confidenceMask = null;
        let width = 0;
        let height = 0;

        if (result.confidenceMasks && result.confidenceMasks.length > 0) {
            // MediaPipe Hair Segmenter index 1 usually corresponds to hair category confidence
            const hairConfidence = result.confidenceMasks[1] || result.confidenceMasks[0];
            confidenceMask = hairConfidence.getAsFloat32Array();
            width = hairConfidence.width;
            height = hairConfidence.height;
        } else if (result.categoryMask) {
            const categoryMaskData = result.categoryMask.getAsUint8Array();
            width = result.categoryMask.width;
            height = result.categoryMask.height;
            // Convert binary category mask to float representation
            confidenceMask = new Float32Array(categoryMaskData.length);
            for (let i = 0; i < categoryMaskData.length; i++) {
                confidenceMask[i] = categoryMaskData[i] > 0 ? 1.0 : 0.0;
            }
        }

        return {
            mask: confidenceMask,
            width,
            height
        };
    } catch (error) {
        console.error("[SalonFlow Hair Segmenter Error]:", error);
        return null;
    }
}
