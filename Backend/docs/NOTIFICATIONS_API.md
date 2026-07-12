# Odatlar Bot — Bildirishnomalar (Notifications) API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON + WebSocket  
**Auditoriya:** Admin panel (CRUD + yuborish) va Telegram Mini App (ko'rish, real-time)  
**Bog'liq hujjatlar:** [Admin API](API.md) · [Bot API](BOT_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Bildirishnoma turlari](#bildirishnoma-turlari)
3. [Admin — CRUD va yuborish](#admin--crud-va-yuborish)
4. [Foydalanuvchi — REST API](#foydalanuvchi--rest-api)
5. [WebSocket (real-time)](#websocket-real-time)
6. [Xatoliklar](#xatoliklar)
7. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Admin turli xil bildirishnomalar yaratadi, **draft** holatida saqlaydi va **Send** orqali foydalanuvchilarga yuboradi. Yuborilganda:

1. Har bir foydalanuvchi uchun `notification_deliveries` yozuvi yaratiladi
2. Online foydalanuvchilarga WebSocket orqali darhol yetkaziladi

| Tomon | Autentifikatsiya | Vazifa |
|-------|------------------|--------|
| Admin | JWT Bearer | CRUD, yuborish |
| Foydalanuvchi | `X-Telegram-Init-Data` | Ro'yxat, o'qilgan deb belgilash |
| WebSocket | `?initData=` query | Real-time yangilanishlar |

**Jadvallar:** `notifications`, `notification_deliveries`

---

## Bildirishnoma turlari

Frontend `lib/notifications.ts` bilan mos `type` va `payload`:

| `type` | `payload` maydonlari |
|--------|----------------------|
| `mukofot` | `xp`, `coins`, `reason` |
| `reyting` | `oldRank`, `newRank`, `totalUsers`, `delta` |
| `eslatma` | `habitName`, `scheduledTime`, `message` |
| `tizim` | `version`, `features[]`, `actionLabel?`, `actionHref?` |
| `yutuq` | `streak`, `habitName`, `badgeLabel`, `message` |
| `mashq` | `dominantTitle`, `cue`, `sessionsCompleted`, `tip` |

---

## Admin — CRUD va yuborish

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/notifications` | Barcha bildirishnomalar |
| `POST` | `/bot/notifications` | Yangi draft yaratish |
| `GET` | `/bot/notifications/{id}` | Bitta bildirishnoma |
| `PUT` | `/bot/notifications/{id}` | Draft ni tahrirlash |
| `DELETE` | `/bot/notifications/{id}` | Draft ni o'chirish |
| `POST` | `/bot/notifications/{id}/send` | Foydalanuvchilarga yuborish |

### Yaratish

```
POST /bot/notifications
```

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `type` | `string` | ha | Yuqoridagi turlardan biri |
| `title` | `string` | ha | Sarlavha |
| `preview` | `string` | yo'q | Ro'yxatda qisqa matn |
| `payload` | `object` | yo'q | Turga xos maydonlar |
| `target` | `string` | yo'q | `all` (default) yoki `selected` |
| `target_user_ids` | `int[]` | `selected` da | `bot_users.id` ro'yxati |

**Misol — tizim yangilanishi:**
```json
{
  "type": "tizim",
  "title": "Yangi versiya: 1.2.0",
  "preview": "Qoʻllanma va bildirishnomalar qoʻshildi",
  "target": "all",
  "payload": {
    "version": "1.2.0",
    "features": [
      "Qoʻllanma boʻlimi",
      "Bildirishnomalar tizimi"
    ],
    "actionLabel": "Qoʻllanmani ochish",
    "actionHref": "/qollanma"
  }
}
```

**Misol — mukofot (tanlangan foydalanuvchilar):**
```json
{
  "type": "mukofot",
  "title": "+50 XP va 10 tanga",
  "preview": "Haftalik faollik mukofoti",
  "target": "selected",
  "target_user_ids": [1, 5, 12],
  "payload": {
    "xp": 50,
    "coins": 10,
    "reason": "Haftalik faollik"
  }
}
```

**Javob `201`:**
```json
{
  "id": "3",
  "type": "tizim",
  "title": "Yangi versiya: 1.2.0",
  "preview": "...",
  "payload": { "...": "..." },
  "target": "all",
  "status": "draft",
  "deliveryCount": 0,
  "createdAt": "2026-07-12T10:00:00Z",
  "updatedAt": "2026-07-12T10:00:00Z"
}
```

### Yuborish

```
POST /bot/notifications/{id}/send
```

- Faqat `status: draft` bo'lgan bildirishnoma yuboriladi
- `status` → `sent`, `sent_at` yoziladi
- Online foydalanuvchilarga WebSocket orqali `notification` eventi ketadi

---

## Foydalanuvchi — REST API

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot-runtime/notifications` | Mening bildirishnomalarim |
| `POST` | `/bot-runtime/notifications/{id}/read` | Bittasini o'qilgan deb belgilash |
| `POST` | `/bot-runtime/notifications/read-all` | Hammasini o'qilgan deb belgilash |

> `{id}` — `notification_deliveries.id` (delivery ID)

### Ro'yxat

```
GET /bot-runtime/notifications
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "42",
      "type": "mukofot",
      "title": "+50 XP va 10 tanga",
      "preview": "Haftalik faollik mukofoti",
      "createdAt": "2026-07-12T10:05:00Z",
      "isRead": false,
      "payload": {
        "xp": 50,
        "coins": 10,
        "reason": "Haftalik faollik"
      }
    }
  ],
  "unreadCount": 1
}
```

Frontend `payload` ni asosiy obyektga birlashtirib UI da ko'rsatadi.

---

## WebSocket (real-time)

```
ws://localhost:8080/api/v1/bot-runtime/ws/notifications?initData={URL_ENCODED_INIT_DATA}
```

`wss://` production uchun.

### Eventlar

**Yangi bildirishnoma:**
```json
{
  "event": "notification",
  "data": {
    "id": "42",
    "type": "tizim",
    "title": "Yangi versiya",
    "preview": "...",
    "createdAt": "2026-07-12T10:05:00Z",
    "isRead": false,
    "payload": { "version": "1.2.0", "features": ["..."] }
  }
}
```

**O'qilmaganlar soni yangilandi:**
```json
{
  "event": "unread_count",
  "data": { "unreadCount": 3 }
}
```

Server ping/pong yuboradi (60s timeout). Client faqat tinglaydi.

---

## Xatoliklar

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri tur, target yoki draft emas |
| `401` | Autentifikatsiya talab qilinadi |
| `404` | Bildirishnoma topilmadi |
| `500` | Server xatosi |

---

## cURL misollari

**Draft yaratish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/notifications \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "eslatma",
    "title": "Ertalabki amaliyot",
    "preview": "Meditatsiya — 07:00",
    "target": "all",
    "payload": {
      "habitName": "Meditatsiya",
      "scheduledTime": "07:00",
      "message": "Ertalabki meditatsiya vaqti!"
    }
  }'
```

**Yuborish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/notifications/1/send \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Foydalanuvchi ro'yxati:**
```bash
curl -X GET http://localhost:8080/api/v1/bot-runtime/notifications \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```

**O'qilgan deb belgilash:**
```bash
curl -X POST http://localhost:8080/api/v1/bot-runtime/notifications/42/read \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```
