# 🗓️ Timeline cá nhân — React + NestJS + Prisma + MongoDB

Phần mềm quản lý các mốc timeline cá nhân: thêm/sửa/xoá/xem chi tiết, hiển thị dạng **vertical timeline** trực quan, lọc & tìm kiếm. Toàn bộ chạy bằng Docker.

> Backend xây theo **convention của `NestApiTemplate`** (cấu trúc `modules/*`, `PrismaService`, response envelope `{ StatusCode, Message, TotalRecord, Data }`, `ValidationPipe`, Swagger) — nhưng đổi datasource sang **MongoDB + Prisma** và tinh gọn còn module Timeline để chạy được ngay.

---

## 1. Kiến trúc tổng thể

```
┌─────────────────────────────┐         ┌──────────────────────────────┐        ┌─────────────────────┐
│  Browser  (localhost:8080)  │         │  NestJS API (localhost:3000) │        │  MongoDB            │
│  ───────────────────────    │  /api   │  ──────────────────────────  │ Prisma │  (replica set rs0)  │
│  React SPA (Vite) + nginx   │ ───────►│  TimelineController          │ ─────► │  db: timelinedb     │
│  TanStack Query · RHF+Zod   │  proxy  │  → TimelineService           │        │  collection:        │
│                             │ ◄────── │  → PrismaService             │ ◄───── │     timelines       │
└─────────────────────────────┘  JSON   │  + ValidationPipe / Filter   │        └─────────────────────┘
                                         │  + ResponseInterceptor       │
                                         └──────────────────────────────┘
```

- **Frontend** gọi đường dẫn tương đối `/api/...`. nginx trong container frontend **proxy** sang `backend:3000` → không dính CORS.
- **Backend** nhận request → validate (class-validator) → service → Prisma → MongoDB. Mọi response được bọc envelope; lỗi trả đúng HTTP status.
- **MongoDB** chạy **single-node replica set** (Prisma bắt buộc) với volume để dữ liệu không mất khi reload/restart.

---

## 2. Cấu trúc thư mục

```
TimelineApp-Nest/
├── backend/                         # NestJS + Prisma
│   ├── prisma/
│   │   └── schema.prisma            # model Timeline (MongoDB, ObjectId)
│   ├── src/
│   │   ├── common/                  # response envelope, interceptor, filter (theo template)
│   │   │   ├── base-response.ts
│   │   │   ├── response.util.ts
│   │   │   ├── interceptors/response.interceptor.ts
│   │   │   └── filters/http-exception.filter.ts
│   │   ├── config/configuration.ts
│   │   ├── infrastructure/prisma/   # PrismaService + PrismaModule (global)
│   │   ├── modules/timeline/        # module nghiệp vụ
│   │   │   ├── controllers/timeline.controller.ts
│   │   │   ├── services/timeline.service.ts
│   │   │   ├── services/timeline-seeder.service.ts
│   │   │   ├── dto/                 # create / update / query DTO + validation
│   │   │   └── timeline.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts                  # bootstrap, ValidationPipe, Swagger, CORS
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/                        # React + TypeScript (Vite)
│   ├── src/
│   │   ├── api/                     # client (axios) + timelineApi (API client layer)
│   │   ├── components/              # Filters, TimelineView, TimelineItem, TimelineForm, DetailModal, Modal, StatusBadge
│   │   ├── hooks/useTimelines.ts    # TanStack Query hooks
│   │   ├── lib/constants.ts         # màu theo status/category
│   │   ├── types/timeline.ts
│   │   ├── App.tsx · main.tsx · index.css
│   ├── Dockerfile · nginx.conf
│   └── package.json
│
├── docker-compose.yml               # frontend + backend + mongodb (+ volume)
└── README.md
```

---

## 3. Chạy bằng Docker (khuyến nghị)

**Yêu cầu:** Docker Desktop đang chạy.

```bash
cd D:\TimelineApp-Nest
docker-compose up --build
```

Lần đầu sẽ mất vài phút (tải image, cài deps, build). Khi thấy log `API: http://localhost:3000/...` là xong.

| Dịch vụ | URL |
|---|---|
| 🖥️ **Giao diện (Frontend)** | http://localhost:8080 |
| 🔌 API | http://localhost:3000/api/timelines |
| 📘 Swagger (thử API) | http://localhost:3000/swagger |
| 🍃 MongoDB | mongodb://localhost:27017 |

Mở **http://localhost:8080** — app đã có sẵn ~15 mốc timeline (seed từ lộ trình học của bạn).

**Dừng:** `Ctrl+C` rồi `docker-compose down`. Muốn xoá luôn dữ liệu: `docker-compose down -v`.

---

## 4. Chạy local (không Docker — để dev)

Cần Node 20 + một MongoDB replica set đang chạy.

```bash
# Backend
cd backend
npm install
cp .env.example .env        # sửa DATABASE_URL nếu cần
npm run prisma:generate
npm run start:dev            # http://localhost:3000

# Frontend (terminal khác)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxy /api -> :3000)
```

---

## 5. API endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/timelines` | Danh sách (lọc: `?search=&status=&category=&from=&to=`) |
| GET | `/api/timelines/categories` | Danh sách danh mục (cho filter) |
| GET | `/api/timelines/:id` | Chi tiết |
| POST | `/api/timelines` | Tạo mới |
| PUT | `/api/timelines/:id` | Cập nhật |
| DELETE | `/api/timelines/:id` | Xoá |

**Khuôn response** (envelope theo template):
```json
{ "StatusCode": 200, "Message": "Success", "TotalRecord": 15, "Data": [ ... ] }
```

**Model Timeline:** `id, title, description, startDate, endDate, status, category, createdAt, updatedAt`
**status:** `Planned | InProgress | Completed | OnHold | Cancelled`

---

## 6. Cách hệ thống hoạt động (ngắn gọn)

1. **Khởi động:** MongoDB lên ở chế độ replica set (healthcheck tự chạy `rs.initiate`). Backend chờ DB `healthy` rồi kết nối (có retry). `TimelineSeederService` seed dữ liệu mẫu nếu collection rỗng.
2. **Đọc dữ liệu:** Frontend dùng **TanStack Query** gọi `GET /api/timelines` (kèm filter). nginx proxy sang backend. Service build `where` Prisma (search OR title/description, lọc status/category/khoảng ngày) → MongoDB. Kết quả về được render thành vertical timeline.
3. **Ghi dữ liệu:** Form (**React Hook Form + Zod**) validate phía client → `POST/PUT` → `ValidationPipe` validate phía server (class-validator) → service → Prisma ghi MongoDB. Mutation thành công → TanStack Query **invalidate** cache → danh sách tự cập nhật (không cần reload).
4. **Lỗi & loading:** TanStack Query cung cấp `isLoading/isError`; axios interceptor bóc `Data` (thành công) hoặc `Message` (lỗi). UI có loading / error / empty state.
5. **Bền dữ liệu:** MongoDB ghi vào volume `mongo_data` → reload trang hay restart container vẫn còn dữ liệu.

---

## 7. Ghi chú quyết định kỹ thuật

- **Dựa trên `NestApiTemplate`:** giữ cấu trúc `modules/<name>/{controllers,services,dto}`, `PrismaService` (extends PrismaClient, lấy URL từ ConfigService), response envelope + interceptor + filter, `ValidationPipe`, Swagger.
- **Đổi SQL Server → MongoDB:** template dùng Prisma 7 + adapter mssql. Bản này dùng **Prisma 5 + provider `mongodb`** (ổn định, không cần adapter) để `docker-compose up --build` chạy chắc chắn.
- **Bỏ auth/permission** của template → đúng phạm vi (Timeline CRUD cá nhân), gọn và chạy được.
- **Cải tiến nhỏ:** exception filter trả **đúng HTTP status** (404/400/500) thay vì luôn 200 như template → frontend xử lý lỗi sạch.
- **MongoDB replica set:** Prisma yêu cầu replica set. Dùng single-node `rs0`, khởi tạo idempotent qua healthcheck; chuỗi kết nối có `directConnection=true`.

---

## 8. Đổi sang SQL Server / PostgreSQL (tuỳ chọn)

Đổi `provider` trong `backend/prisma/schema.prisma` và `DATABASE_URL` trong docker-compose; bỏ `@db.ObjectId`/`@map("_id")` ở field `id` (dùng `@default(uuid())` hoặc autoincrement). Khi đó không cần replica set nữa.

---

## 9. Khắc phục sự cố

- **Backend khởi động lại vài lần lúc đầu:** bình thường — đang chờ replica set bầu primary (có retry). Sau ~20–40s sẽ ổn định.
- **Port bận (3000/8080/27017):** đổi cổng map trong `docker-compose.yml`.
- **Muốn seed lại từ đầu:** `docker-compose down -v` rồi `up --build` lại (xoá volume).
- **Xem log:** `docker-compose logs -f backend` (hoặc `mongodb`, `frontend`).
```
