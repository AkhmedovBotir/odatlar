# Odatlar Bot — Admin API Hujjatlari

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Swagger UI:** `http://localhost:8080/swagger/index.html`

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Xatoliklar](#xatoliklar)
4. [Auth API](#auth-api)
5. [Admin CRUD API](#admin-crud-api)
6. [Ma'lumot modellari](#malumot-modellari)
7. [Validatsiya qoidalari](#validatsiya-qoidalari)

---

## Umumiy ma'lumot

| Parametr        | Qiymat                          |
|-----------------|---------------------------------|
| Content-Type    | `application/json`              |
| Accept          | `application/json`              |
| Vaqt formati    | ISO 8601 UTC (`2026-07-06T17:00:00Z`) |
| Admin status    | `active` \| `inactive`          |

### Health check

```
GET /health
```

**Javob `200`:**
```json
{
  "status": "ok"
}
```

---

## Autentifikatsiya

Login endpoint orqali JWT token olinadi. Himoyalangan endpointlarga so'rov yuborishda header qo'shiladi:

```
Authorization: Bearer <token>
```

| Xususiyat      | Tavsif                                      |
|----------------|---------------------------------------------|
| Token turi     | JWT (HS256)                                 |
| Amal qilish    | `.env` dagi `JWT_EXPIRY_HOURS` (default 24 soat) |
| Faol admin     | Faqat `status: active` bo'lgan adminlar login qila oladi |

---

## Xatoliklar

Barcha xatoliklar quyidagi formatda qaytariladi:

```json
{
  "error": "xato xabari"
}
```

| HTTP kod | Ma'nosi                                      |
|----------|----------------------------------------------|
| `400`    | Noto'g'ri so'rov (validatsiya xatosi)        |
| `401`    | Autentifikatsiya talab qilinadi yoki noto'g'ri |
| `403`    | Ruxsat yo'q (masalan, inactive admin login)  |
| `404`    | Ma'lumot topilmadi                           |
| `409`    | Konflikt (username yoki telefon band)        |
| `500`    | Server ichki xatosi                          |

---

## Auth API

### Login

Tizimga kirish va JWT token olish.

```
POST /auth/login
```

**Autentifikatsiya:** Kerak emas

**So'rov tanasi:**

| Maydon     | Turi   | Majburiy | Tavsif        |
|------------|--------|----------|---------------|
| username   | string | Ha       | Foydalanuvchi nomi |
| password   | string | Ha       | Parol         |

**Misol so'rov:**
```json
{
  "username": "admin",
  "password": "admin12345"
}
```

**Muvaffaqiyatli javob `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "first_name": "Admin",
    "last_name": "User",
    "phone": "998901234567",
    "username": "admin",
    "status": "active",
    "created_at": "2026-07-06T17:00:00Z",
    "updated_at": "2026-07-06T17:00:00Z"
  }
}
```

**Xatolar:**

| Kod | Sabab |
|-----|-------|
| `401` | Noto'g'ri username yoki password |
| `403` | Admin hisobi `inactive` holatda |

---

### Profil olish

Joriy autentifikatsiya qilingan admin ma'lumotlarini qaytaradi.

```
GET /auth/profile
```

**Autentifikatsiya:** Bearer token kerak

**Muvaffaqiyatli javob `200`:**
```json
{
  "admin": {
    "id": 1,
    "first_name": "Admin",
    "last_name": "User",
    "phone": "998901234567",
    "username": "admin",
    "status": "active",
    "created_at": "2026-07-06T17:00:00Z",
    "updated_at": "2026-07-06T17:00:00Z"
  }
}
```

---

## Admin CRUD API

Barcha admin endpointlari **Bearer token** talab qiladi.

---

### Admin yaratish

```
POST /admins
```

**So'rov tanasi:**

| Maydon      | Turi   | Majburiy | Qoidalar              |
|-------------|--------|----------|-----------------------|
| first_name  | string | Ha       | 2–100 belgi (ism)     |
| last_name   | string | Ha       | 2–100 belgi (familiya)|
| phone       | string | Ha       | 9–20 belgi, noyob     |
| username    | string | Ha       | 3–50 belgi, alfanumerik, noyob |
| password    | string | Ha       | 8–72 belgi            |

**Misol so'rov:**
```json
{
  "first_name": "Ali",
  "last_name": "Valiyev",
  "phone": "998901112233",
  "username": "alivali",
  "password": "securepass1"
}
```

**Muvaffaqiyatli javob `201`:**
```json
{
  "id": 2,
  "first_name": "Ali",
  "last_name": "Valiyev",
  "phone": "998901112233",
  "username": "alivali",
  "status": "active",
  "created_at": "2026-07-06T17:05:00Z",
  "updated_at": "2026-07-06T17:05:00Z"
}
```

> Yangi admin avtomatik `active` status bilan yaratiladi. Parol javobda qaytarilmaydi.

---

### Adminlar ro'yxati

```
GET /admins?page=1&limit=10
```

**Query parametrlar:**

| Parametr | Turi    | Default | Tavsif                    |
|----------|---------|---------|---------------------------|
| page     | integer | `1`     | Sahifa raqami             |
| limit    | integer | `10`    | Sahifadagi elementlar (max 100) |

**Muvaffaqiyatli javob `200`:**
```json
{
  "data": [
    {
      "id": 2,
      "first_name": "Ali",
      "last_name": "Valiyev",
      "phone": "998901112233",
      "username": "alivali",
      "status": "active",
      "created_at": "2026-07-06T17:05:00Z",
      "updated_at": "2026-07-06T17:05:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### Adminni ID bo'yicha olish

```
GET /admins/{id}
```

**Path parametrlar:**

| Parametr | Turi    | Tavsif   |
|----------|---------|----------|
| id       | integer | Admin ID |

**Muvaffaqiyatli javob `200`:** `AdminResponse` obyekti (yuqoridagi kabi)

**Xato `404`:** Admin topilmadi

---

### Adminni yangilash

```
PUT /admins/{id}
```

Barcha maydonlar ixtiyoriy — faqat yuborilgan maydonlar yangilanadi.

**So'rov tanasi:**

| Maydon      | Turi   | Qoidalar              |
|-------------|--------|-----------------------|
| first_name  | string | 2–100 belgi           |
| last_name   | string | 2–100 belgi           |
| phone       | string | 9–20 belgi, noyob     |
| username    | string | 3–50 belgi, alfanumerik, noyob |
| password    | string | 8–72 belgi (yangi parol hashlanadi) |

**Misol so'rov:**
```json
{
  "first_name": "Alijon",
  "phone": "998909998877"
}
```

**Muvaffaqiyatli javob `200`:** Yangilangan `AdminResponse`

---

### Admin statusini o'zgartirish

```
PATCH /admins/{id}/status
```

**So'rov tanasi:**

| Maydon | Turi   | Majburiy | Qiymatlar              |
|--------|--------|----------|------------------------|
| status | string | Ha       | `active` \| `inactive` |

**Misol — faolsizlantirish:**
```json
{
  "status": "inactive"
}
```

**Misol — faollashtirish:**
```json
{
  "status": "active"
}
```

**Muvaffaqiyatli javob `200`:** Yangilangan `AdminResponse`

> `inactive` admin tizimga kira olmaydi (login `403` qaytaradi).

---

### Adminni o'chirish

```
DELETE /admins/{id}
```

**Muvaffaqiyatli javob `204`:** Javob tanasi yo'q

**Xato `404`:** Admin topilmadi

---

## Ma'lumot modellari

### AdminResponse

```json
{
  "id": 1,
  "first_name": "string",
  "last_name": "string",
  "phone": "string",
  "username": "string",
  "status": "active",
  "created_at": "2026-07-06T17:00:00Z",
  "updated_at": "2026-07-06T17:00:00Z"
}
```

### AdminStatus

| Qiymat     | Tavsif                              |
|------------|-------------------------------------|
| `active`   | Faol — login va barcha API ishlaydi |
| `inactive` | Nofaol — login bloklangan           |

---

## Validatsiya qoidalari

| Maydon      | Qoida                                      |
|-------------|--------------------------------------------|
| first_name  | Majburiy (create), min 2, max 100          |
| last_name   | Majburiy (create), min 2, max 100          |
| phone       | Majburiy (create), min 9, max 20, unique   |
| username    | Majburiy (create), min 3, max 50, alfanumerik, unique |
| password    | Majburiy (create), min 8, max 72           |
| status      | Faqat `active` yoki `inactive`             |

---

## cURL misollari

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin12345"}'
```

### Profil
```bash
curl http://localhost:8080/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin yaratish
```bash
curl -X POST http://localhost:8080/api/v1/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "first_name": "Ali",
    "last_name": "Valiyev",
    "phone": "998901112233",
    "username": "alivali",
    "password": "securepass1"
  }'
```

### Status o'zgartirish
```bash
curl -X PATCH http://localhost:8080/api/v1/admins/2/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status":"inactive"}'
```

### Admin o'chirish
```bash
curl -X DELETE http://localhost:8080/api/v1/admins/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Bot Settings API

Barcha endpointlar **Bearer token** talab qiladi. Admin bu API orqali bot sozlamalarini saqlaydi. Keyinchalik alohida bot servisi shu sozlamalar asosida ishlaydi.

> **XP mukofot tizimi:** Odatlar va Dominantalar bo'limlaridagi amallar uchun XP sozlamalari alohida hujjatda — [XP_API.md](XP_API.md) (`GET`/`PUT /bot/xp-settings`). Foydalanuvchi javoblariga `xp` va `level` maydonlari qo'shilgan.

> **Statistika va reyting:** Admin panel uchun umumiy ko'rsatkichlar va XP reytingi alohida hujjatda — [STATS_API.md](STATS_API.md) (`GET /bot/stats`, `GET /bot/leaderboard`).

> **Foydalanuvchi monitoringi:** Bitta foydalanuvchini to'liq kuzatish (faoliyat, statistika, XP, faoliyat lentasi) alohida hujjatda — [MONITORING_API.md](MONITORING_API.md) (`GET /bot/users/{id}/monitoring`, `GET /bot/users/{id}/activity`).

### Bot sozlamalarini olish

```
GET /bot/settings
```

**Javob `200`:**
```json
{
  "token": {
    "has_token": true,
    "masked_token": "712345...AbCd",
    "bot_username": "my_bot",
    "is_active": true
  },
  "start": {
    "message": "Assalomu alaykum! Botga xush kelibsiz.",
    "button": {
      "enabled": true,
      "text": "Do'konni ochish",
      "web_app_url": "https://app.example.com"
    }
  },
  "updated_at": "2026-07-07T06:00:00Z"
}
```

---

### /start sozlamalarini yangilash

```
PUT /bot/settings
```

**So'rov:**
```json
{
  "start": {
    "message": "Xush kelibsiz! Pastdagi tugma orqali do'konni oching.",
    "button": {
      "enabled": true,
      "text": "🛒 Do'konni ochish",
      "web_app_url": "https://app.example.com"
    }
  }
}
```

> Tugma yoqilganda `text` va `web_app_url` majburiy.

---

### Bot token qo'shish / yangilash

```
PUT /bot/token
```

```json
{ "bot_token": "1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" }
```

Token Telegram `getMe` API orqali tekshiriladi.

---

### Bot token holati

```
GET /bot/token
```

---

### Bot token o'chirish

```
DELETE /bot/token
```

---

### /start bosgan foydalanuvchilar

```
GET /bot/users?page=1&limit=10&search=ali
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": 1,
      "telegram_id": 123456789,
      "first_name": "Ali",
      "last_name": "Valiyev",
      "username": "alivali",
      "phone": "",
      "language_code": "uz",
      "avatar_url": "https://api.telegram.org/file/bot<token>/photos/file_10.jpg",
      "is_bot": false,
      "is_premium": true,
      "started_at": "2026-07-07T06:00:00Z",
      "last_start_at": "2026-07-07T06:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Bitta bot foydalanuvchi (modal uchun)

```
GET /bot/users/{id}
```

**Javob `200`:**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "first_name": "Ali",
  "last_name": "Valiyev",
  "username": "alivali",
  "phone": "+998901112233",
  "language_code": "uz",
  "avatar_url": "https://api.telegram.org/file/bot<token>/photos/file_10.jpg",
  "is_bot": false,
  "is_premium": true,
  "started_at": "2026-07-07T06:00:00Z",
  "last_start_at": "2026-07-07T06:30:00Z"
}
```

**Xatolar:**

| Kod | Sabab |
|-----|-------|
| `400` | Noto'g'ri `id` |
| `404` | Foydalanuvchi topilmadi |

> Foydalanuvchilar bot servisi `POST /bot-runtime/start` orqali yoziladi.

> **Bot servisi API:** alohida hujjat — [BOT_API.md](BOT_API.md)
