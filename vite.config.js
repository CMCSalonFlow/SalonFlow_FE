import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },

  build: {
    // Tăng threshold cảnh báo lên 1MB vì dự án lớn
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunking dạng function (Vite 8 / rolldown yêu cầu)
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Firebase tách riêng vì rất nặng
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            // Ant Design icons tách riêng
            if (id.includes("@ant-design/icons")) {
              return "vendor-antd-icons";
            }
            // Ant Design core
            if (id.includes("antd") || id.includes("/rc-")) {
              return "vendor-antd";
            }
            // React core
            if (id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("/react/") || id.includes("/react-")) {
              return "vendor-react";
            }
            // Charts
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) {
              return "vendor-charts";
            }
            // Axios + dayjs
            if (id.includes("axios") || id.includes("dayjs")) {
              return "vendor-utils";
            }
            // ExcelJS (rất nặng, dùng cho export báo cáo)
            if (id.includes("exceljs")) {
              return "vendor-exceljs";
            }
            // PDF / print libs
            if (id.includes("pdfjs") || id.includes("jspdf") || id.includes("html2canvas")) {
              return "vendor-pdf";
            }
            // Quill / rich text editor
            if (id.includes("quill") || id.includes("react-quill")) {
              return "vendor-editor";
            }
            // Elasticsearch / lucene
            if (id.includes("elasticsearch") || id.includes("elastic")) {
              return "vendor-elastic";
            }
            // Sentry monitoring
            if (id.includes("@sentry")) {
              return "vendor-sentry";
            }
            // Lodash / underscore utilities
            if (id.includes("lodash") || id.includes("underscore")) {
              return "vendor-lodash";
            }
            // Các lib vendor còn lại gom vào 1 chunk
            return "vendor-misc";
          }
        },
      },
    },
  },

  // Cải thiện dev server performance
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "antd",
      "@ant-design/icons",
      "axios",
      "dayjs",
    ],
  },

  server: {
    // Bật HMR overlay để debug nhanh hơn
    hmr: {
      overlay: true,
    },
  },
});
