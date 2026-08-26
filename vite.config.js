import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2,ico}"],
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/oauth2\//,
          /^\/login\/oauth2\//,
        ],

        runtimeCaching: [
          // ================================
          // MinIO images: NEVER cache in SW
          // ================================
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/salon-images/"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/bookings"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "salonflow-bookings-v1",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/branches") || url.pathname.includes("/services") || url.pathname.includes("/categories"),
            handler: "NetworkFirst",
            options: {
              cacheName: "salonflow-api-v1",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url, request }) => {
              const path = url.pathname;
              const isGet = request.method === "GET";
              const isSpecial = path.includes("/bookings") || path.includes("/branches") || path.includes("/services") || path.includes("/categories");
              const isSensitive = path.includes("/auth") || path.includes("/payment") || path.includes("/oauth") || path.includes("/refresh-token");
              return isGet && !isSpecial && !isSensitive;
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "salonflow-api-v1",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => /\.(?:png|jpg|jpeg|svg|gif|webp)$/.test(url.pathname) || url.pathname.includes("/media/"),
            handler: "CacheFirst",
            options: {
              cacheName: "salonflow-images-v2",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => /\.(?:js|css|woff2|woff|ttf|eot)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "salonflow-static-v1",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => {
              const path = url.pathname;
              return path.includes("/auth") || path.includes("/payment") || path.includes("/oauth") || path.includes("/refresh-token");
            },
            handler: "NetworkOnly",
          }
        ],
      },
      manifest: {
        name: "SalonFlow",
        short_name: "SalonFlow",
        description: "Hệ thống Quản lý và Đặt lịch Hẹn Salon chuyên nghiệp",
        theme_color: "#d4af37",
        background_color: "#141416",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("@ant-design/icons")) {
              return "vendor-antd-icons";
            }
            if (id.includes("antd") || id.includes("/rc-")) {
              return "vendor-antd";
            }
            if (id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("/react/") || id.includes("/react-")) {
              return "vendor-react";
            }
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory")) {
              return "vendor-charts";
            }
            if (id.includes("axios") || id.includes("dayjs")) {
              return "vendor-utils";
            }
            if (id.includes("exceljs")) {
              return "vendor-exceljs";
            }
            if (id.includes("pdfjs") || id.includes("jspdf") || id.includes("html2canvas")) {
              return "vendor-pdf";
            }
            if (id.includes("quill") || id.includes("react-quill")) {
              return "vendor-editor";
            }
            if (id.includes("elasticsearch") || id.includes("elastic")) {
              return "vendor-elastic";
            }
            if (id.includes("lodash") || id.includes("underscore")) {
              return "vendor-lodash";
            }
            return "vendor-misc";
          }
        },
      },
    },
  },

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
    hmr: {
      overlay: true,
    },
  },
});
