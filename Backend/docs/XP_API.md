# Odatlar Bot — Admin XP API Hujjatlari

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (XP mukofot tizimini sozlash)  
**Bog'liq hujjatlar:** [Admin API](API.md) · [Bot API](BOT_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [XP mukofot tizimi qanday ishlaydi](#xp-mukofot-tizimi-qanday-ishlaydi)
4. [Endpointlar](#endpointlar)
   - [XP sozlamalarini olish](#xp-sozlamalarini-olish)
   - [XP sozlamalarini yangilash](#xp-sozlamalarini-yangilash)
5. [Foydalanuvchi XP va daraja](#foydalanuvchi-xp-va-daraja)
6. [Xatoliklar](#xatoliklar)
7. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Bu API admin panelga **XP (tajriba ballari) mukofot tizimini** sozlash imkonini beradi. Admin har bir amal uchun beriladigan XP miqdorini boshqaradi:

- **Odatlar** bo'limi — amaliyot bajarilganda, indikator kiritilganda
- **Dominantalar** bo'limi — dominanta yaratilganda, sessiya yakunlanganda

Sozlamalar bitta qatorli (`id = 1`) `xp_settings` jadvalida saqlanadi. Foydalanuvchi tegishli amalni bajarganda, XP avtomatik ravishda `bot_users.xp` ga qo'shiladi va `bot_users.level` qayta hisoblanadi.

| Parametr | Qiymat |
|----------|--------|
| Content-Type | `application/json` |
| Accept | `application/json` |
| Vaqt formati | ISO 8601 UTC (`2026-07-07T15:04:05Z`) |

---

## Autentifikatsiya

Barcha endpointlar **admin JWT Bearer token** talab qiladi (xuddi boshqa `/bot/*` endpointlari kabi).

```
Authorization: Bearer <admin_jwt_token>
```

Token [Auth API](API.md#auth-api) login endpointidan olinadi. Token bo'lmasa `401`, admin faol bo'lmasa `403` qaytadi.

---

## XP mukofot tizimi qanday ishlaydi

| Amal | Bo'lim | XP sozlamasi | Standart |
|------|--------|--------------|----------|
| Amaliyotni bajarish (toggle → bajarildi) | Odatlar | `practice_complete_xp` | `50` |
| Amaliyotni bekor qilish (toggle → bekor) | Odatlar | `practice_complete_xp` (ayiriladi) | `-50` |
| Indikator qiymatini kiritish | Odatlar | `indicator_log_xp` | `30` |
| Yangi dominanta yaratish | Dominantalar | `dominant_create_xp` | `100` |
| Dominanta sessiyasini yakunlash | Dominantalar | `dominant_session_xp` | `100` |

**Daraja (level)** hisoblanishi:

```
level = (xp / level_up_xp) + 1
```

Masalan `level_up_xp = 1000` bo'lsa: `0–999 XP` → 1-daraja, `1000–1999 XP` → 2-daraja va hokazo.

**Muhim jihatlar:**
- XP hech qachon `0` dan pastga tushmaydi (amaliyotni bekor qilishda ham manfiy bo'lmaydi).
- Indikator "kiritilmagan/skip" (`is_empty = true`) bo'lsa XP berilmaydi.
- XP berish amali fon rejimida (fire-and-forget) — sozlama xatosi foydalanuvchining asosiy amalini to'xtatmaydi.
- Amal bajarilganda beriladigan XP o'sha payt saqlangan sozlamaga qarab hisoblanadi (o'zgartirilsa, keyingi amallarga ta'sir qiladi, o'tgan XP qayta hisoblanmaydi).

---

## Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/xp-settings` | XP sozlamalarini olish |
| `PUT` | `/bot/xp-settings` | XP sozlamalarini yangilash |

---

### XP sozlamalarini olish

```
GET /bot/xp-settings
```

**Autentifikatsiya:** Bearer token (admin)

**Muvaffaqiyatli javob `200`:**
```json
{
  "practice_complete_xp": 50,
  "indicator_log_xp": 30,
  "dominant_create_xp": 100,
  "dominant_session_xp": 100,
  "level_up_xp": 1000,
  "updated_at": "2026-07-07T15:04:05Z"
}
```

---

### XP sozlamalarini yangilash

```
PUT /bot/xp-settings
```

**Autentifikatsiya:** Bearer token (admin)

**So'rov tanasi:**

| Maydon | Turi | Majburiy | Qoidalar / Tavsif |
|--------|------|----------|-------------------|
| `practice_complete_xp` | `int` | ha | `0` – `100000`. Amaliyot bajarilganda beriladigan XP |
| `indicator_log_xp` | `int` | ha | `0` – `100000`. Indikator kiritilganda beriladigan XP |
| `dominant_create_xp` | `int` | ha | `0` – `100000`. Dominanta yaratilganda beriladigan XP |
| `dominant_session_xp` | `int` | ha | `0` – `100000`. Dominanta sessiyasi yakunlanganda beriladigan XP |
| `level_up_xp` | `int` | ha | `1` – `1000000`. Har bir daraja uchun kerakli XP |

**Misol so'rov:**
```json
{
  "practice_complete_xp": 60,
  "indicator_log_xp": 40,
  "dominant_create_xp": 150,
  "dominant_session_xp": 120,
  "level_up_xp": 1200
}
```

**Muvaffaqiyatli javob `200`:**
```json
{
  "practice_complete_xp": 60,
  "indicator_log_xp": 40,
  "dominant_create_xp": 150,
  "dominant_session_xp": 120,
  "level_up_xp": 1200,
  "updated_at": "2026-07-07T15:10:00Z"
}
```

**Xatolar:**

| Kod | Sabab |
|-----|-------|
| `400` | Noto'g'ri qiymat (masalan manfiy XP yoki `level_up_xp < 1`) |
| `401` | Token yo'q yoki yaroqsiz |
| `403` | Admin faol emas |
| `500` | Server xatosi |

---

## Foydalanuvchi XP va daraja

XP tizimi joriy etilgach, `bot_users` jadvaliga `xp` va `level` ustunlari qo'shildi. Ular quyidagi javoblarda ko'rinadi:

- `GET /bot/users` — foydalanuvchilar ro'yxati
- `GET /bot/users/{id}` — bitta foydalanuvchi
- `POST /bot-runtime/me` — Web App'da foydalanuvchining o'z profili

**Foydalanuvchi javobiga qo'shilgan maydonlar:**

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `xp` | `int` | Foydalanuvchining jami XP si |
| `level` | `int` | Joriy daraja (`(xp / level_up_xp) + 1`) |
| `level_up_xp` | `int` | Keyingi daraja uchun XP chegarasi (sozlamadan) |

> **Amal javoblaridagi XP:** `POST /bot-runtime/practices/{id}/toggle`, `/indicators/{id}/log`, `/dominants` va `/dominants/{id}/session` javoblariga `xp_reward` (shu amal uchun berilgan/ayirilgan XP), `xp` va `level` (yangilangan holat) maydonlari qo'shiladi. Batafsil — [BOT_API.md](BOT_API.md).

> **Reyting:** Web App foydalanuvchi reytingi `GET /bot-runtime/leaderboard`, admin reytingi va statistika `GET /bot/leaderboard`, `GET /bot/stats` — [STATS_API.md](STATS_API.md).

**Misol (`GET /bot/users/{id}`):**
```json
{
  "id": 12,
  "telegram_id": 123456789,
  "first_name": "Ali",
  "username": "ali_dev",
  "xp": 1350,
  "level": 2,
  "started_at": "2026-07-01T08:00:00Z",
  "last_start_at": "2026-07-07T15:00:00Z"
}
```

---

## Xatoliklar

Standart xato tanasi:
```json
{ "error": "xato tavsifi" }
```

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri so'rov (validatsiya) |
| `401` | Autentifikatsiya talab qilinadi |
| `403` | Ruxsat yo'q (admin faol emas) |
| `500` | Ichki server xatosi |

---

## cURL misollari

**Sozlamalarni olish:**
```bash
curl -X GET http://localhost:8080/api/v1/bot/xp-settings \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Sozlamalarni yangilash:**
```bash
curl -X PUT http://localhost:8080/api/v1/bot/xp-settings \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "practice_complete_xp": 60,
    "indicator_log_xp": 40,
    "dominant_create_xp": 150,
    "dominant_session_xp": 120,
    "level_up_xp": 1200
  }'
```
