# 💈 SalonFlow Frontend — Ứng Dụng Quản Lý & Đặt Lịch Salon Tích Hợp AI (Client-Side AI & Real-Time)

> **Dự án Khóa luận Tốt nghiệp (ĐATN)**  
> Ứng dụng Web Single Page Application (SPA) & Progressive Web App (PWA) hiện đại dành cho nền tảng quản trị chuỗi salon tóc, spa và trải nghiệm khách hàng tương tác trực quan tích hợp AI xử lý trực tiếp tại trình duyệt.

---

## 📑 Mục Lục
1. [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [Cấu Trúc Hệ Thống (System Architecture)](#-cấu-trúc-hệ-thống-system-architecture)
   - [Sơ Đồ Kiến Trúc Thành Phần](#sơ-đồ-kiến-trúc-thành-phần)
   - [Cấu Trúc Thư Mục Dự Án (Feature-Driven Structure)](#cấu-trúc-thư-mục-dự-án-feature-driven-structure)
   - [Hệ Thống Phân Quyền & Bố Cục Đa Giao Diện (Multi-Role Layouts)](#hệ-thống-phân-quyền--bố-cục-đa-giao-diện-multi-role-layouts)
3. [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
4. [Thuật Toán Nổi Bật & Kỹ Thuật Chuyên Sâu (Prominent Algorithms & Techniques)](#-thuật-toán-nổi-bật--kỹ-thuật-chuyên-sâu-prominent-algorithms--techniques)
   - [1. Động Cơ Phân Tách & Nhuộm Tóc Ảo Trực Tiếp Trình Duyệt (Client-Side Hair Segmentation & 3D Recolor Engine)](#1-động-cơ-phân-tách--nhuộm-tóc-ảo-trực-tiếp-trình-duyệt-client-side-hair-segmentation--3d-recolor-engine)
   - [2. Phân Tích Hình Dáng Khuôn Mặt 468 Điểm (MediaPipe 468-point Face Mesh Geometric Analysis)](#2-phân-tích-hình-dáng-khuôn-mặt-468-điểm-mediapipe-468-point-face-mesh-geometric-analysis)
   - [3. Ma Trận Đặt Lịch & Giữ Chỗ Đồng Bộ Thời Gian Thực (Real-Time Slot Locking Matrix & Countdown Timer)](#3-ma-trận-đặt-lịch--giữ-chỗ-đồng-bộ-thời-gian-thực-real-time-slot-locking-matrix--countdown-timer)
   - [4. Biểu Diễn Dải Tin Cậy Dự Báo Doanh Thu (Prophet Forecast Fan-Chart Rendering with Area Spline)](#4-biểu-diễn-dải-tin-cậy-dự-báo-doanh-thu-prophet-forecast-fan-chart-rendering-with-area-spline)
   - [5. Thuật Toán Sắp Ca & Kiểm Soát Xung Đột Kéo Thả (Interactive Drag-and-Drop Shift Scheduler with Conflict Matrix)](#5-thuật-toán-sắp-ca--kiểm-soát-xung-đột-kéo-thả-interactive-drag-and-drop-shift-scheduler-with-conflict-matrix)
   - [6. Xử Lý Luồng Nhận Diện Mã QR Check-in Thời Gian Thực (Webcam RequestAnimationFrame Binary Decoder)](#6-xử-lý-luồng-nhận-diện-mã-qr-check-in-thời-gian-thực-webcam-requestanimationframe-binary-decoder)
5. [Hướng Dẫn Cài Đặt & Sử Dụng (Setup & Usage Guide)](#-hướng-dẫn-cài-đặt--sử-dụng-setup--usage-guide)
   - [Yêu Cầu Môi Trường](#yêu-cầu-môi-trường)
   - [Cấu Hình Biến Môi Trường (.env)](#cấu-hình-biến-môi-trường-env)
   - [Cài Đặt Phụ Thuộc & Khởi Chạy Local](#cài-đặt-phụ-thuộc--khởi-chạy-local)
   - [Đóng Gói Ứng Dụng (Production Build)](#đóng-gói-ứng-dụng-production-build)
   - [Triển Khai Container Hóa (Docker & Nginx)](#triển-khai-container-hóa-docker--nginx)
   - [Hướng Dẫn Sử Dụng Theo Từng Vai Trò](#hướng-dẫn-sử-dụng-theo-từng-vai-trò)

---

## 🌟 Giới Thiệu Tổng Quan

**SalonFlow Frontend** được thiết kế với tiêu chuẩn thẩm mỹ cao cấp (Modern Luxury Hair Salon & Spa), tối ưu hóa trải nghiệm tương tác trực quan và tốc độ phản hồi:
- **Client-Side AI (0$ Chi Phí Máy Chủ Đám Mây):** Xử lý thị giác máy tính, tách tóc và thử màu tóc thời gian thực 100% tại máy khách thông qua TensorFlow.js và WebGL, bảo vệ tuyệt đối dữ liệu hình ảnh cá nhân của người dùng.
- **Trải Nghiệm Đặt Lịch Tức Thì (Instant Booking Flow):** Trực quan hóa ma trận thời gian, cảnh báo slot đang được giữ bởi người khác trong 5 phút, gợi ý khung giờ vàng bằng AI.
- **Phân Hệ Quản Trị Chuyên Sâu (Comprehensive Role Dashboards):** Thiết kế riêng biệt cho 5 nhóm đối tượng: Khách vãng lai, Khách hàng thành viên, Stylist làm việc, Quản lý chi nhánh và Chủ chuỗi salon.

---

## 🏗 Cấu Trúc Hệ Thống (System Architecture)

### Sơ Đồ Kiến Trúc Thành Phần

```mermaid
flowchart TB
    subgraph Browser["Trình Duyệt Khách Hàng (Browser Runtime)"]
        direction TB
        subgraph PresentationLayer["Tầng Giao Diện & Bố Cục (Presentation Layer)"]
            ROUTER["React Router v7"]
            LAYOUTS["Role-Based Layouts\n(Public / Customer / Staff / Manager / Owner / Admin)"]
            ANTD["Ant Design System + Custom CSS Theme"]
        end

        subgraph ClientAIEngine["Động Cơ Trí Tuệ Nhân Tạo Cục Bộ (Client-Side AI)"]
            TF_WEBGL["TensorFlow.js WebGL Engine"]
            BODYPIX["BodyPix Person Segmenter"]
            COLOR_ENGINE["SalonFlow Hair Recolor Shader (HSL)"]
            FACEMESH["MediaPipe FaceMesh (468 Landmarks)"]
        end

        subgraph StateAndServices["Quản Lý Trạng Thái & Dịch Vụ Mạng"]
            AUTH_STATE["Auth & RBAC State (JWT/Context)"]
            AXIOS_CLIENT["Axios Client (Interceptors, Auto Refresh Token)"]
            WS_LISTENER["WebSocket Client (Real-time Slot Events)"]
            FCM_CLIENT["Firebase Cloud Messaging (Web Push)"]
        end
    end

    subgraph BackendAPI["Máy Chủ Dịch Vụ (Backend APIs)"]
        API_SERVER["Spring Boot Core API (Port 9090)"]
        WS_SERVER["Spring Boot WebSocket Broker"]
        FASTAPI["FastAPI Prophet ML Service (Port 8001)"]
        MINIO_S3["MinIO Object Storage"]
    end

    ROUTER --> LAYOUTS
    LAYOUTS --> ANTD
    
    ANTD <--> ClientAIEngine
    ANTD <--> StateAndServices

    AXIOS_CLIENT <-->|REST HTTP/JSON| API_SERVER
    WS_LISTENER <-->|Full-Duplex WS| WS_SERVER
    AXIOS_CLIENT <-->|Proxy Analytics| FASTAPI
    ANTD <-->|Tải ảnh gốc & Preset| MINIO_S3
```

---

### Cấu Trúc Thư Mục Dự Án (Feature-Driven Structure)

Dự án áp dụng kiến trúc **Feature-Driven Architecture**, gom cụm code theo từng miền nghiệp vụ giúp dễ dàng bảo trì và mở rộng độc lập:

```text
SalonFlow_FE/
├── public/                                # Tài nguyên tĩnh (Favicon, Logo, Fonts, PWA Manifest)
├── src/
│   ├── app/                               # Khởi tạo ứng dụng & Nhà cung cấp ngữ cảnh toàn cục
│   │   ├── providers/                     # AppProvider, AuthProvider, ThemeProvider, NotificationProvider
│   │   └── routes/                        # Cấu hình danh sách Route & Guard bảo vệ quyền truy cập
│   ├── assets/                            # Hình ảnh tĩnh, SVG icons, banner minh họa
│   ├── core/                              # Nền tảng dùng chung cốt lõi
│   │   ├── api/                           # Axios instance, Interceptors tự động refresh token
│   │   ├── config/                        # Cấu hình biến môi trường, constants
│   │   ├── guards/                        # RoleProtectedRoute, GuestOnlyRoute
│   │   └── utils/                         # Hàm tiện ích (format tiền tệ, ngày giờ, validation)
│   ├── features/                          # 28 Mô-đun Nghiệp Vụ Chuyên Biệt
│   │   ├── ai/                            # Tích hợp AI gợi ý slot hẹn & gợi ý dịch vụ
│   │   ├── auth/                          # Đăng nhập, đăng ký, quên mật khẩu, Google OAuth2
│   │   ├── booking/                       # Quy trình đặt lịch đa bước, giỏ dịch vụ, khóa slot real-time
│   │   │   ├── api/                       # bookingApi.js (lockSlot, unlockSlot, createBooking)
│   │   │   ├── components/                # StepServiceSelection, StepTimeSlots, BookingSummary...
│   │   │   └── pages/                     # BookingPage.jsx, GuestBookingPage.jsx
│   │   ├── branch/                        # Danh sách chi nhánh, giờ mở cửa, quản lý chi nhánh
│   │   ├── category/                      # Danh mục dịch vụ tóc, làm đẹp
│   │   ├── chatbot/                       # Cửa sổ trợ lý ảo tư vấn kiểu tóc & dịch vụ salon
│   │   ├── dashboard/                     # Bảng điều khiển trực quan doanh thu, KPI, tỷ lệ lấp đầy
│   │   ├── geolocation/                   # Bản đồ tra cứu salon gần nhất theo định vị GPS
│   │   ├── hair-ai/                       # Động cơ thử kiểu tóc & đổi màu tóc AI tại trình duyệt
│   │   │   ├── api/                       # Gọi API Vision phân tích khuôn mặt
│   │   │   ├── components/                # CameraCapture, ColorPalettePicker, BeforeAfterSlider
│   │   │   ├── pages/                     # HairAiConsultationPage.jsx, HairColorTryOnPage.jsx
│   │   │   └── utils/                     # hairColorEngine.js, hairSegmentationHelper.js
│   │   ├── notification/                  # Trung tâm thông báo real-time, chuông thông báo
│   │   ├── payment/                       # Xử lý thanh toán cọc, quét VietQR SePay, ZaloPay
│   │   ├── reports/                       # Báo cáo doanh thu & biểu đồ dự báo Prophet
│   │   ├── review/                        # Đánh giá dịch vụ, phân tích sắc thái cảm xúc
│   │   ├── schedule/ & shift/             # Lịch biểu nhân sự, sắp ca kéo thả với FullCalendar & dnd-kit
│   │   ├── service/                       # Quản lý dịch vụ, đơn giá, thời lượng làm tóc
│   │   ├── service-description-ai/        # Công cụ sinh nội dung mô tả dịch vụ SEO bằng AI
│   │   ├── staff/                         # Hồ sơ kỹ thuật viên, xếp hạng sao, kỹ năng chuyên môn
│   │   ├── subscription/                  # Bảng giá gói SaaS Salon, thanh toán Stripe Checkout
│   │   └── voucher/                       # Quản lý mã giảm giá, khuyến mãi, áp mã thanh toán
│   ├── layouts/                           # 6 Bố cục giao diện tương ứng theo vai trò
│   │   ├── AdminLayout/                   # Quản trị viên hệ thống (Super Admin)
│   │   ├── OwnerLayout/                   # Chủ chuỗi Salon (SaaS Salon Owner)
│   │   ├── ManagerLayout/                 # Quản lý chi nhánh (Branch Manager)
│   │   ├── StaffLayout/                   # Kỹ thuật viên / Thợ tóc (Stylist)
│   │   ├── CustomerLayout/                # Khách hàng cá nhân đã đăng nhập
│   │   └── PublicLayout/                  # Khách vãng lai / Trang chủ / Đặt lịch nhanh
│   ├── shared/                            # UI Components tái sử dụng (Button, Modal, Table, Skeleton)
│   ├── styles/                            # File định kiểu chung, biến CSS màu sắc, typography
│   ├── App.jsx                            # Root Component
│   └── main.jsx                           # Điểm nạp React 19 DOM
├── .env.example                           # Biến môi trường mẫu
├── Dockerfile                             # Build container Nginx nhiều tầng
├── nginx.conf                             # Cấu hình Web Server Nginx (Gzip, Cache, Reverse Proxy)
├── package.json                           # Khai báo thư viện & kịch bản chạy
└── vite.config.js                         # Cấu hình Vite, Alias đường dẫn `@`, tối ưu build chunk
```

---

### Hệ Thống Phân Quyền & Bố Cục Đa Giao Diện (Multi-Role Layouts)

Ứng dụng chia rõ ràng không gian làm việc theo 5 phân hệ người dùng:
1. **Public / Customer Portal:** Giao diện đặt lịch nhanh không cần tài khoản, tra cứu salon gần nhất trên bản đồ, trải nghiệm thử màu tóc ảo và nhận tư vấn từ trợ lý AI.
2. **Customer Portal:** Hồ sơ phân tích khuôn mặt & kiểu tóc cá nhân, lịch sử các lần cắt tóc kèm ảnh kết quả, ví voucher và theo dõi trạng thái lịch hẹn.
3. **Stylist Workspace:** Giao diện tối ưu di động cho thợ tóc: xem ca làm việc trong ngày, danh sách khách hàng phụ trách, ghi chú hồ sơ tóc và theo dõi doanh số cá nhân.
4. **Branch Manager Center:** Quản lý hàng chờ check-in tại salon bằng quét QR, phân công thợ, phê duyệt ngày nghỉ, sắp ca làm việc trực quan và theo dõi dự đoán khách bùng hẹn.
5. **Salon Owner & Super Admin Suite:** Phân tích dữ liệu doanh thu đa chi nhánh, biểu đồ dự báo chuỗi thời gian Prophet, quản lý gói thuê bao SaaS và cấu hình tham số AI hệ thống.

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

| Phân Nhóm | Công Nghệ & Thư Viện | Vai Trò & Điểm Nổi Bật |
| :--- | :--- | :--- |
| **Nền Tảng Cốt Lõi** | **React 19.2** | Phiên bản React mới nhất với hiệu năng render vượt trội, React Server Components Ready |
| **Công Cụ Build** | **Vite 8.0** | HMR siêu tốc, tối ưu nén tệp JS/CSS thông qua ES Module và Rollup |
| **Điều Hướng & Router** | **React Router v7** | Định tuyến SPA mượt mà, hỗ trợ Data Loaders và phân quyền tuyến tính |
| **UI Framework** | **Ant Design 6.4 (antd)** | Bộ giao diện doanh nghiệp cao cấp, bảng biểu tương tác, form xác thực mạnh mẽ |
| **Bộ Icon** | **Lucide React & React Icons** | Hệ thống biểu tượng vector hiện đại, tối ưu dung lượng tải |
| **Thị Giác Máy Tính AI** | **TensorFlow.js (Core & WebGL)** | Chạy mạng nơ-ron phân đoạn ảnh tóc trực tiếp trên GPU máy khách |
| **Mô Hình Tách Người** | **BodyPix (MobileNetV1)** | Phân tách phân vùng cơ thể và tóc với độ chính xác cao mà không cần server |
| **Phân Tích Khuôn Mặt** | **MediaPipe Face Mesh** | Trích xuất 468 điểm mốc hình học khuôn mặt 3D theo thời gian thực |
| **Trực Quan Hóa Dữ Liệu** | **Recharts 3.10** | Vẽ biểu đồ doanh thu tương tác, dải tin cậy dự báo (Area Fan-chart) |
| **Quản Lý Lịch Biểu** | **FullCalendar 6.1** | Giao diện lịch biểu ca làm việc chuyên nghiệp (DayGrid, TimeGrid, Interaction) |
| **Tương Tác Kéo Thả** | **@dnd-kit (Core & Sortable)** | Kéo thả lịch trực, đổi ca thợ mượt mà, hỗ trợ accessibility |
| **Giao Tiếp Thời Gian Thực** | **Native WebSocket & Firebase** | Đồng bộ trạng thái khóa slot tức thì & gửi thông báo Web Push Notifications |
| **Quét Mã Check-in** | **jsQR 1.4** | Quét và nhận diện mã QR vé đặt lịch trực tiếp qua Webcam/Camera |
| **Xuất Tài Liệu & Báo Cáo** | **jsPDF, html2canvas, ExcelJS** | Xuất hóa đơn, voucher dạng PDF và trích xuất báo cáo doanh số Excel |
| **Máy Chủ Web Triển Khai** | **Nginx Alpine** | Phục vụ Single Page Application với gzip nén tệp, cache tĩnh và proxy API |

---

## 🧠 Thuật Toán Nổi Bật & Kỹ Thuật Chuyên Sâu (Prominent Algorithms & Techniques)

### 1. Động Cơ Phân Tách & Nhuộm Tóc Ảo Trực Tiếp Trình Duyệt (Client-Side Hair Segmentation & 3D Recolor Engine)
Files triển khai: [`hairColorEngine.js`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/hair-ai/utils/hairColorEngine.js) & [`hairSegmentationHelper.js`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/hair-ai/utils/hairSegmentationHelper.js)

Giải pháp **0$ Cloud Cost** cho phép khách hàng thử hơn 20 gam màu tóc salon ngay trên trình duyệt di động hoặc máy tính mà không tiêu tốn tài nguyên máy chủ:

#### A. Phân Tách Mặt Nạ Tóc (TensorFlow.js BodyPix Segmentation)
- Sử dụng mô hình `MobileNetV1` nén lượng tử (`quantBytes: 2`) tăng tốc qua backend `@tensorflow/tfjs-backend-webgl`.
- Nhận diện ma trận phân đoạn nhị phân xác định pixel nào thuộc vùng đầu và tóc.

#### B. Làm Mịn Biên & Khử Răng Cưa (Alpha Mask Feathering)
- Để tránh viền tóc bị đứt gãy hoặc lem màu ra mặt/nền, thuật toán áp dụng bộ lọc mờ **Gaussian Blur (Bán kính $R = 3 \sim 5\text{px}$)** trực tiếp lên kênh Alpha của Canvas Context 2D:
  $$A_{\text{smooth}}(x, y) = \frac{1}{2\pi\sigma^2} \iint A(u, v) e^{-\frac{(x-u)^2 + (y-v)^2}{2\sigma^2}} du dv$$
- Kết hợp kỹ thuật xói mòn và giãn nở (Morphological Dilation/Erosion) để ôm sát ngọn tóc tự nhiên.

#### C. Chuyển Đổi Không Gian Màu HSL & Bảo Toàn Độ Sáng Thực Tế (Luminance Preservation)
- Chuyển đổi toàn bộ pixel từ không gian $\text{RGB} \rightarrow \text{HSL}$:
  - Giữ nguyên độ sáng tự nhiên của tóc khách hàng ($L_{\text{src}}$) để bảo toàn từng nếp tóc và hướng ánh sáng phòng.
  - Thay thế sắc độ ($H_{\text{target}}$) và độ bão hòa ($S_{\text{target}}$) theo mã màu salon đã chọn.
  - Áp dụng công thức hòa trộn có trọng số:
    $$L_{\text{out}} = L_{\text{src}} \times (1 - \alpha) + L_{\text{target}} \times \alpha$$
    $$S_{\text{out}} = S_{\text{src}} \times 0.2 + S_{\text{target}} \times 0.8$$

#### D. Tái Tạo Vùng Phản Chiếu Ánh Sáng (Specular Hair Shine Highlight)
- Các sợi tóc khỏe luôn có độ bóng khi ánh sáng chiếu vào. Thuật toán phát hiện các pixel có $L_{\text{src}} > 0.72$ và tự động áp lớp phản xạ ánh sáng (Specular Highlighting) giúp màu tóc bóng bẩy, chân thực như vừa được hấp dầu tại salon.

---

### 2. Phân Tích Hình Dáng Khuôn Mặt 468 Điểm (MediaPipe 468-point Face Mesh Geometric Analysis)
Files triển khai: [`features/hair-ai/components/`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/hair-ai/components)

1. **Trích Xuất 468 Tọa Độ Điểm Mốc 3D:** Sử dụng MediaPipe Vision phát hiện cấu trúc gương mặt theo thời gian thực từ Camera Stream.
2. **Tính Toán Tỷ Lệ Hình Học Đặc Trưng (Geometric Ratios):**
   - **Tỷ lệ Chiều dài / Chiều rộng mặt:** Đo khoảng cách đỉnh cằm (Landmark 152) đến chân tóc (Landmark 10) chia cho khoảng cách hai xương gò má (Landmark 234 đến 454).
   - **Tỷ lệ Độ rộng Trán / Xương Hàm:** So sánh độ mở góc hàm dưới (Jawline angle) và bề ngang trán.
3. **Phân Loại Khuôn Mặt Tự Động (Face Shape Classifier):**
   - $\text{FaceRatio} \approx 1.5$ & đường viền thon gọn $\rightarrow$ **Mặt Oval (Trái xoan)**.
   - $\text{FaceRatio} < 1.3$ & đường viền bo tròn $\rightarrow$ **Mặt Tròn (Round)**.
   - Góc xương hàm rộng, vuông vức $\rightarrow$ **Mặt Vuông (Square)**.
   - Trán rộng, cằm nhọn $\rightarrow$ **Mặt Trái Tim (Heart)**.
   - Gò má nhô cao, trán và cằm hẹp $\rightarrow$ **Mặt Kim Cương (Diamond)**.
   *Kết quả được truyền tức thì sang hệ thống để lọc ra các kiểu tóc phù hợp nhất với tỉ lệ mặt.*

---

### 3. Ma Trận Đặt Lịch & Giữ Chỗ Đồng Bộ Thời Gian Thực (Real-Time Slot Locking Matrix & Countdown Timer)
Files triển khai: [`StepTimeSlots.jsx`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/booking/components/StepTimeSlots.jsx) & [`BookingPage.jsx`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/booking/pages/BookingPage.jsx)

1. **Quản Lý Trạng Thái 3 Cấp Độ (Tri-State Slot Management):**
   - 🟢 **Khả dụng (Available):** Khung giờ trống, khách hàng có thể nhấn chọn.
   - 🟠 **Đang giữ chỗ (Holding/Locked by others):** Khách hàng khác đang thao tác đặt khung giờ này (trong thời hạn 5 phút). Nút bị vô hiệu hóa kèm badge màu cam thông báo.
   - ⚪ **Đã đặt (Booked):** Khung giờ đã chốt thanh toán hoặc đã qua thời điểm hiện tại.
2. **Bộ Đếm Ngược Đồng Bộ Cục Bộ (Client Countdown Timer):**
   - Khi người dùng chọn một khung giờ, hệ thống gửi lệnh lock lên Backend và kích hoạt đồng hồ đếm ngược **300 giây**.
   - Nếu quá thời gian mà người dùng chưa hoàn tất thông tin, giao diện tự động giải phóng slot (Optimistic Unlock) và hiển thị modal cảnh báo phiên đặt lịch đã hết hạn.
3. **Lắng Nghe Sự Kiện WebSocket Thời Gian Thực:**
   - Khi có khách hàng khác thực hiện `lockSlot` hoặc `unlockSlot`, WebSocket đẩy thông điệp JSON tới toàn bộ client đang mở màn hình chọn giờ của chi nhánh để làm mới trạng thái slot trong **< 50ms**.

---

### 4. Biểu Diễn Dải Tin Cậy Dự Báo Doanh Thu (Prophet Forecast Fan-Chart Rendering with Area Spline)
Files triển khai: [`features/reports/`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/reports) & [`features/dashboard/`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/dashboard)

1. **Mô Hình Hóa Đa Lớp Với Recharts:**
   - **Đường Nét Liền Màu Xanh (Blue Solid Line):** Doanh thu thực tế trong 6 tháng qua (`history.revenue`).
   - **Đường Nét Đứt Màu Tím (Purple Dashed Line):** Doanh thu dự báo trong tương lai 7–30 ngày (`forecast.yhat`).
   - **Dải Bóng Mờ 80% (Shaded Area Fan Band):** Vùng tin cậy dao động giữa ngưỡng cận dưới (`yhat_lower`) và cận trên (`yhat_upper`).
2. **Kỹ Thuật Chuẩn Hóa Chuỗi Thời Gian:**
   - Nối điểm chuyển tiếp mượt mà giữa điểm lịch sử cuối cùng và điểm dự báo đầu tiên để biểu đồ không bị đứt đoạn.
   - Định dạng tiền tệ VND thông minh theo triệu đồng / tỷ đồng kèm Tooltip chi tiết khi hover.

---

### 5. Thuật Toán Sắp Ca & Kiểm Soát Xung Đột Kéo Thả (Interactive Drag-and-Drop Shift Scheduler with Conflict Matrix)
Files triển khai: [`features/schedule/`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/schedule)

1. **Kéo Thả Hỗ Trợ Snap-to-Grid:** Sử dụng `@dnd-kit` và `@fullcalendar` chia lưới theo bước nhảy 30 phút hoặc theo ca cố định (Ca Sáng, Ca Chiều, Ca Tối).
2. **Kiểm Tra Xung Đột Tức Thì Trên Client (Client-Side Conflict Matrix):**
   - Khi quản lý kéo một ca làm việc thả vào lịch của thợ, client tự động đối chiếu:
     1. Thợ có đang trong danh sách nghỉ phép được duyệt (`offdays`) không?
     2. Tổng thời gian làm việc trong ngày có vượt quá định mức tối đa 10 tiếng không?
     3. Khung giờ mới có bị đè lên một ca trực khác của cùng người đó không?
   - Cảnh báo tức thì bằng Toast đỏ và rollback vị trí ca trực nếu phát hiện vi phạm.

---

### 6. Xử Lý Luồng Nhận Diện Mã QR Check-in Thời Gian Thực (Webcam RequestAnimationFrame Binary Decoder)
Files triển khai: [`features/booking/components/`](file:///e:/%C4%90ATN/FE/SalonFlow_FE/src/features/booking/components)

1. **Truy Cập Camera Độ Phân Giải Cao:** Kết nối qua `navigator.mediaDevices.getUserMedia` với cấu hình lấy nét liên tục và độ phân giải 720p/1080p.
2. **Xử Lý Frame Nhị Phân với jsQR:**
   - Vòng lặp `requestAnimationFrame` chụp liên tục frame ảnh từ thẻ `<video>`, đưa vào `<canvas>` ẩn kích thước $400 \times 400$.
   - Thuật toán nhị phân hóa thích ứng (Adaptive Thresholding) xử lý ánh sáng yếu tại quầy lễ tân.
   - Giải mã Reed-Solomon trích xuất chuỗi JWT chứa mã vé hẹn `bookingCode` và gửi yêu cầu xác thực Check-in về máy chủ chỉ trong **1 frame** duy nhất.

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng (Setup & Usage Guide)

### Yêu Cầu Môi Trường
- **Node.js:** Phiên bản **20.x** hoặc **22.x (LTS)** trở lên.
- **Trình Quản Lý Gói:** `npm` phiên bản 10+ (hoặc `yarn` / `pnpm`).
- **Trình Duyệt Hỗ Trợ WebGL:** Google Chrome, Microsoft Edge, Safari hoặc Mozilla Firefox phiên bản mới nhất (để hỗ trợ tăng tốc GPU cho tính năng thử màu tóc AI).

---

### Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` tại thư mục gốc `SalonFlow_FE/` (sao chép từ `.env.example`):

```ini
# --- ĐỊA CHỈ BACKEND API ---
# Khi chạy cục bộ kết nối Spring Boot Backend:
VITE_API_URL=http://localhost:9090

# --- GIÁM SÁT HỆ THỐNG ---
VITE_MONITORING_ENABLED=false
VITE_GRAFANA_URL=http://localhost:3000

# --- CẤU HÌNH FIREBASE CLOUD MESSAGING (THÔNG BÁO WEB PUSH) ---
VITE_FIREBASE_API_KEY=AIzaSyBInB6Ux1Cxsuavz0mc-gHpc2zKhSQ3zbU
VITE_FIREBASE_AUTH_DOMAIN=salonflow-a669d.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=salonflow-a669d
VITE_FIREBASE_STORAGE_BUCKET=salonflow-a669d.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=674592135028
VITE_FIREBASE_APP_ID=1:674592135028:web:7b3376a582bfe289637e21
VITE_FIREBASE_MEASUREMENT_ID=G-YYTSP4NZXX
VITE_FIREBASE_VAPID_KEY=BLB-qyIf9z5MqHez7HPIObO-xs8ezSWstOvGyvh41Iyoxvg9NxWjSSnLLfpuTIB_XPmYkfucwiPnTaOXr1L1LuE
```

---

### Cài Đặt Phụ Thuộc & Khởi Chạy Local

Mở terminal tại thư mục `SalonFlow_FE/`:

```bash
# 1. Cài đặt toàn bộ các gói thư viện phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển Vite với Hot Module Replacement (HMR)
npm run dev
```

Ứng dụng Frontend sẽ sẵn sàng truy cập tại: **`http://localhost:5173`**.

---

### Đóng Gói Ứng Dụng (Production Build)

```bash
# Kiểm tra lỗi cú pháp và quy tắc code
npm run lint

# Đóng gói tối ưu hóa cho môi trường Production (tạo thư mục dist/)
npm run build

# Chạy thử bản build production trên máy local
npm run preview
```

---

### Triển Khai Container Hóa (Docker & Nginx)

Dự án cung cấp sẵn `Dockerfile` 2 giai đoạn (Build React + Nginx Alpine) và `nginx.conf` tối ưu:

```bash
# 1. Xây dựng Docker Image cho Frontend
docker build -t salonflow-frontend:latest .

# 2. Khởi chạy Container tại cổng 80 (hoặc map sang cổng 8080)
docker run -d --name salonflow-fe -p 8080:80 salonflow-frontend:latest
```
*Truy cập ứng dụng tại:* `http://localhost:8080`

---

### Hướng Dẫn Sử Dụng Theo Từng Vai Trò

#### 1. Khách Hàng (Customer)
- **Đặt lịch nhanh:** Vào trang chủ, bấm **Đặt Lịch Ngay** $\rightarrow$ Chọn Chi nhánh $\rightarrow$ Chọn Dịch vụ/Combo $\rightarrow$ Chọn Ngày & Khung giờ (các khung giờ vàng có nhãn đề xuất AI) $\rightarrow$ Nhập thông tin & chọn phương thức thanh toán/cọc $\rightarrow$ Nhận vé điện tử có mã QR check-in.
- **Trải nghiệm AI Nhuộm tóc & Tư vấn kiểu tóc:**
  - Vào mục **Tư Vấn Tóc AI** trên thanh điều hướng.
  - Tải ảnh chân dung hoặc bật Camera chụp trực tiếp.
  - MediaPipe và BodyPix sẽ tự động phân tích khuôn mặt và cho phép chọn bảng màu nhuộm tóc (Nâu tây, Xám khói, Đỏ cherry...).
  - Kéo thanh trượt **Trước / Sau** (Before/After) để so sánh kết quả trực quan.

#### 2. Kỹ Thuật Viên (Stylist / Staff)
- Đăng nhập bằng tài khoản thợ $\rightarrow$ Truy cập **Bàn Làm Việc Stylist**.
- Xem danh sách khách đặt trong ngày theo dòng thời gian.
- Bấm **Bắt đầu dịch vụ** khi khách đến và **Hoàn thành** khi kết thúc để hệ thống cập nhật tải làm việc theo thời gian thực.
- Xem đánh giá sao và phản hồi từ khách hàng.

#### 3. Quản Lý Chi Nhánh (Branch Manager)
- **Quản lý Hàng chờ & Check-in:** Bật camera máy tính tại quầy để quét mã QR vé đặt lịch của khách; hệ thống tự động đổi trạng thái sang `CHECKED_IN`.
- **Sắp ca làm việc:** Vào mục **Lịch trực** $\rightarrow$ Sử dụng thao tác kéo thả phân bổ thợ vào các ca sáng/chiều/tối $\rightarrow$ Bấm **Lưu lịch**.
- **Cảnh báo Khách bùng hẹn:** Xem danh sách khách có nguy cơ No-Show cao (màu đỏ) được gợi ý bởi mô hình hồi quy để chủ động gọi điện xác nhận.

#### 4. Chủ Chuỗi Salon (Salon Owner) & Quản Trị Viên (Admin)
- **Báo cáo & Dự Báo:** Truy cập **Báo Cáo Doanh Thu** $\rightarrow$ Xem biểu đồ đường doanh thu thực tế kết hợp dải dự báo AI 7 ngày tới với khoảng tin cậy 80%.
- **Quản lý Thuê bao SaaS:** Xem thông tin gói dịch vụ hiện tại, hóa đơn và thực hiện nâng cấp gói qua Stripe Checkout.

---

## 👥 Đóng Góp & Bản Quyền
Dự án được xây dựng phục vụ Đồ Án Tốt Nghiệp (ĐATN). Mọi quyền được bảo lưu bởi nhóm phát triển **SalonFlow**.
