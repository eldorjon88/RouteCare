# RouteCare API

Base URL (dev): `http://localhost:8000` · Interactive docs: `GET /docs` (Swagger) / `GET /redoc`.

All errors return `{"error": "<message>"}`. Authenticated routes require a header:
`Authorization: Bearer <jwt>`.

## Auth

### POST `/api/auth/request-otp`
Send a one-time code to a phone. *(Rate limit: 10/min/IP.)*
```json
// body
{ "phone": "+998901234567" }
// 200
{ "ok": true, "message": "OTP sent" }
```
In development the code is printed to the **server console** (`OTP_PROVIDER=console`).

### POST `/api/auth/verify-otp`
Verify the code, creating the user on first login. Returns a JWT. *(Rate limit: 10/min/IP.)*
```json
// body
{ "phone": "+998901234567", "code": "482915", "role": "patient" }
// 200
{ "token": "<jwt>", "user": { "id": 1, "phone": "+998901234567", "role": "patient", "full_name": null, "created_at": "..." } }
```
`role` ∈ `patient | driver | dispatcher` (defaults to `patient`).

## Calls

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/api/calls` | patient | Create an ambulance request |
| GET | `/api/calls?status=` | dispatcher | List calls (optional status filter) |
| POST | `/api/calls/{id}/auto-assign` | dispatcher | Assign nearest available ambulance |
| PATCH | `/api/calls/{id}/status` | driver, dispatcher | Update call status |

**Create call body** (camelCase): `{ "pickupLat": 41.31, "pickupLng": 69.24, "pickupAddress": "...", "notes": "..." }`
**Call object** (response, snake_case): `{ id, patient_id, ambulance_id, pickup_lat, pickup_lng, pickup_address, notes, status, created_at, assigned_at, updated_at }`
**Status** ∈ `requested | assigned | en_route | arrived | transporting | completed | cancelled`.

## Drivers / Ambulances

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| PATCH | `/api/drivers/me/status` | driver | Set own ambulance status + position |
| GET | `/api/drivers` | dispatcher | List all ambulances |

**Driver status body:** `{ "status": "available", "lat": 41.31, "lng": 69.24 }` — `status` ∈ `available | on_call | off_duty`.

## WebSocket — `GET /ws`

Real-time channel. Messages are JSON `{ "event": <string>, "data": <any> }`.

**Client → server**
- `call:subscribe` — `data` = call id; joins that call's update room.
- `location:update` — `data` = `{ ambulanceId, lat, lng, callId? }`.

**Server → client**
- `call:new` — a new call was created (dispatchers).
- `call:assigned` — `{ call, ambulance }` after auto-assign.
- `call:status` — a call's status changed (sent to that call's room).
- `location:update` — relayed ambulance position.

## Health
`GET /health` → `{ "status": "ok", "service": "routecare", "time": "..." }`
