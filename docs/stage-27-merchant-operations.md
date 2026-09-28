# Giai đoạn 27 — Merchant Operations và Go Edge

## Phạm vi đã triển khai

- `GET /v1/dashboard/overview?days=7|30|90` tổng hợp doanh số, tỷ lệ thành công, số dư, trạng thái bank inbox và chuỗi dữ liệu theo ngày ở server.
- `GET /v1/dashboard/events` dùng SSE để đẩy snapshot mới cho portal mỗi 5 giây.
- Notification center có danh sách, unread count, đọc từng thông báo và đọc tất cả.
- Bank Hub hỗ trợ 15 mã ngân hàng sandbox, thêm/ngắt kết nối, đặt mặc định và mô phỏng đồng bộ.
- Billing quản lý gói, quota, hóa đơn CSV và lịch sử thay đổi subscription.
- Audit UI lọc theo hành động/tài nguyên, xem payload và xuất CSV.
- JavaScript SDK có thêm dashboard, notification, billing, audit và bank sync.

## Go infra-gateway

`services/infra-gateway` là edge service nhỏ, không giữ ledger hay quyết định trạng thái thanh toán.

- `POST /v1/ingest/banks/{bank}` xác minh `X-Infra-Timestamp` và `X-Infra-Signature` (`HMAC-SHA256(timestamp + "." + body)`), giới hạn body 1 MiB và chặn replay quá 5 phút.
- Bounded queue trả `503` + `Retry-After` khi đầy; worker pool forward callback sang Gateway Core và retry tối đa ba lần.
- `GET /v1/realtime/events` fan-out SSE; `POST /v1/realtime/publish` phát sự kiện đã ký.
- `/healthz`, `/readyz`, `/metrics` phục vụ container health và Prometheus.
- Dashboard Grafana `NovaGate Infra Gateway` theo dõi availability, queue depth, callback throughput và số kết nối SSE; Alertmanager cảnh báo edge down hoặc forward thất bại.

Go chỉ gánh phần I/O đồng thời cao. Java Core/PostgreSQL vẫn là nguồn sự thật duy nhất cho idempotency, matching, ledger và settlement.

## Chạy local

```powershell
docker compose --env-file infra/environments/.env.dev -f infra/compose/compose.dev.yml up -d --build
```

Hoặc chạy riêng Go:

```powershell
cd services/infra-gateway
go test ./...
go run ./cmd/server
```

## Ranh giới project

Các kết nối ngân hàng/acquirer hiện là sandbox/simulator. Khi chuyển sang production cần thay adapter thật, secret manager/KMS thật, hợp đồng ngân hàng, PCI assessment và UAT được đối tác xác nhận; Go edge không loại bỏ các yêu cầu này.
