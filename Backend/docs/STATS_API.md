# Odatlar Bot — Admin Statistika va Reyting API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (umumiy ko'rsatkichlar va XP reytingi)  
**Bog'liq hujjatlar:** [Admin API](API.md) · [Bot API](BOT_API.md) · [XP API](XP_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Endpointlar](#endpointlar)
   - [Umumiy statistika](#umumiy-statistika)
   - [XP reytingi](#xp-reytingi)
4. [Xatoliklar](#xatoliklar)
5. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Bu API admin panelga bot bo'yicha **umumiy statistikani** va **XP reytingini** ko'rsatish uchun mo'ljallangan. Ma'lumotlar real vaqtda `bot_users`, `user_practices`, `user_indicators`, `user_dominants` va ularning yozuvlaridan agregatsiya qilinadi.

| Parametr | Qiymat |
|----------|--------|
| Content-Type | `application/json` |
| Accept | `application/json` |
| Vaqt zonasi | `Asia/Tashkent` (UTC+5) — "bugun" va "hafta" shu zona bo'yicha hisoblanadi |
| Vaqt formati | ISO 8601 UTC (`2026-07-07T15:04:05Z`) |

> **Web App reytingi:** Mini App ichidagi foydalanuvchi reytingi (`GET /bot-runtime/leaderboard`) alohida — [BOT_API.md](BOT_API.md) da. Ushbu hujjatdagi endpointlar faqat **admin JWT** bilan ishlaydi.

---

## Autentifikatsiya

Barcha endpointlar **admin JWT Bearer token** talab qiladi (boshqa `/bot/*` endpointlari kabi).

```
Authorization: Bearer <admin_jwt_token>
```

Token [Auth API](API.md#auth-api) login endpointidan olinadi. Token bo'lmasa `401`, admin faol bo'lmasa `403` qaytadi.

---

## Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/stats` | Umumiy statistika (foydalanuvchilar, amaliyotlar, indikatorlar, dominantalar, XP) |
| `GET` | `/bot/leaderboard` | XP bo'yicha eng yuqori foydalanuvchilar |

---

### Umumiy statistika

```
GET /bot/stats
```

**Autentifikatsiya:** Bearer token (admin)

**Muvaffaqiyatli javob `200`:**
```json
{
  "users": {
    "total": 128,
    "new_today": 4,
    "new_this_week": 21,
    "active_this_week": 63,
    "with_phone": 90,
    "premium": 12
  },
  "practices": {
    "total_items": 340,
    "total_entries": 5820,
    "entries_today": 74
  },
  "indicators": {
    "total_items": 210,
    "total_entries": 3110,
    "entries_today": 38
  },
  "dominants": {
    "total_items": 96,
    "total_entries": 512,
    "entries_today": 9
  },
  "xp": {
    "total_xp": 184500,
    "avg_xp": 1441.41,
    "max_xp": 9800,
    "max_level": 10,
    "avg_level": 2.15,
    "level_up_xp": 1000
  },
  "generated_at": "2026-07-07T16:20:00Z"
}
```

**Javob maydonlari:**

| Blok | Maydon | Turi | Tavsif |
|------|--------|------|--------|
| `users` | `total` | `int` | Botga start bosgan jami foydalanuvchilar |
| `users` | `new_today` | `int` | Bugun qo'shilganlar (`started_at`) |
| `users` | `new_this_week` | `int` | Oxirgi 7 kunda qo'shilganlar |
| `users` | `active_this_week` | `int` | Oxirgi 7 kunda faol bo'lganlar (`last_start_at`) |
| `users` | `with_phone` | `int` | Telefon raqami bor foydalanuvchilar |
| `users` | `premium` | `int` | Telegram Premium foydalanuvchilar |
| `practices` | `total_items` | `int` | Jami amaliyotlar soni |
| `practices` | `total_entries` | `int` | Jami bajarilishlar (completions) |
| `practices` | `entries_today` | `int` | Bugun bajarilganlar |
| `indicators` | `total_items` | `int` | Jami indikatorlar soni |
| `indicators` | `total_entries` | `int` | Jami kiritishlar (bo'sh/skip hisobga olinmaydi) |
| `indicators` | `entries_today` | `int` | Bugun kiritilganlar |
| `dominants` | `total_items` | `int` | Jami dominantalar soni |
| `dominants` | `total_entries` | `int` | Jami sessiyalar |
| `dominants` | `entries_today` | `int` | Bugungi sessiyalar |
| `xp` | `total_xp` | `int` | Barcha foydalanuvchilar XP yig'indisi |
| `xp` | `avg_xp` | `float` | O'rtacha XP |
| `xp` | `max_xp` | `int` | Eng yuqori XP |
| `xp` | `max_level` | `int` | Eng yuqori daraja |
| `xp` | `avg_level` | `float` | O'rtacha daraja |
| `xp` | `level_up_xp` | `int` | Joriy daraja chegarasi (XP sozlamasidan) |
| — | `generated_at` | `string` | Javob shakllangan vaqt (UTC) |

---

### XP reytingi

```
GET /bot/leaderboard?limit=20
```

**Autentifikatsiya:** Bearer token (admin)

**So'rov parametrlari:**

| Parametr | Turi | Majburiy | Standart | Tavsif |
|----------|------|----------|----------|--------|
| `limit` | `int` | yo'q | `20` | Qaytariladigan foydalanuvchilar soni (`1`–`100`) |

**Muvaffaqiyatli javob `200`:**
```json
{
  "data": [
    {
      "rank": 1,
      "bot_user_id": 12,
      "telegram_id": 123456789,
      "name": "Ali Valiyev",
      "username": "ali_dev",
      "xp": 9800,
      "level": 10
    },
    {
      "rank": 2,
      "bot_user_id": 7,
      "telegram_id": 987654321,
      "name": "Dilnoza",
      "xp": 7200,
      "level": 8
    }
  ],
  "total": 128,
  "limit": 20
}
```

**Javob maydonlari:**

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `data[].rank` | `int` | Reytingdagi o'rin (XP bo'yicha kamayish tartibi) |
| `data[].bot_user_id` | `int` | Ichki bot foydalanuvchi ID si |
| `data[].telegram_id` | `int` | Telegram ID |
| `data[].name` | `string` | Ko'rsatiladigan ism (ism + familiya yoki `@username`) |
| `data[].username` | `string` | Telegram username (bo'lmasa qaytmaydi) |
| `data[].xp` | `int` | Jami XP |
| `data[].level` | `int` | Daraja |
| `total` | `int` | Jami foydalanuvchilar soni |
| `limit` | `int` | Qo'llanilgan limit |

> Saralash: `xp DESC`, keyin `level DESC`, so'ng `last_start_at DESC`.

---

## Xatoliklar

Standart xato tanasi:
```json
{ "error": "xato tavsifi" }
```

| Kod | Ma'no |
|-----|-------|
| `401` | Autentifikatsiya talab qilinadi (token yo'q/yaroqsiz) |
| `403` | Ruxsat yo'q (admin faol emas) |
| `500` | Ichki server xatosi |

---

## cURL misollari

**Umumiy statistika:**
```bash
curl -X GET http://localhost:8080/api/v1/bot/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**XP reytingi (top 10):**
```bash
curl -X GET "http://localhost:8080/api/v1/bot/leaderboard?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
