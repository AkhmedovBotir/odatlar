# Odatlar Bot — Foydalanuvchi Monitoring API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (bitta foydalanuvchini to'liq kuzatish)  
**Bog'liq hujjatlar:** [Admin API](API.md) · [Statistika API](STATS_API.md) · [XP API](XP_API.md) · [Bot API](BOT_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Endpointlar](#endpointlar)
   - [Foydalanuvchi monitoring snapshoti](#foydalanuvchi-monitoring-snapshoti)
   - [Foydalanuvchi faoliyat lentasi](#foydalanuvchi-faoliyat-lentasi)
4. [Faoliyat turlari](#faoliyat-turlari)
5. [Xatoliklar](#xatoliklar)
6. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Bu API admin panelga **bitta foydalanuvchini to'liq kuzatish** imkonini beradi:

- **Nima qilyapti** — bugungi va haftalik faollik ko'rsatkichlari
- **Nima qilgan** — har bir amaliyot/indikator/dominanta bo'yicha jami yozuvlar va oxirgi vaqt
- **Nimalar bilan shug'ullanadi** — foydalanuvchining amaliyotlari, indikatorlari va dominantalari ro'yxati
- **Nima olayapti** — XP, daraja, reytingdagi o'rni
- **Faoliyat lentasi** — barcha amallar xronologik tartibda

Ma'lumotlar real vaqtda `bot_users`, `user_practices`, `practice_completions`, `user_indicators`, `indicator_logs`, `user_dominants`, `dominant_sessions` jadvallaridan yig'iladi.

| Parametr | Qiymat |
|----------|--------|
| Content-Type | `application/json` |
| Accept | `application/json` |
| Vaqt zonasi | `Asia/Tashkent` (UTC+5) — "bugun" va "hafta" shu zona bo'yicha |
| Vaqt formati | ISO 8601 UTC (`2026-07-07T15:04:05Z`) |

---

## Autentifikatsiya

Barcha endpointlar **admin JWT Bearer token** talab qiladi.

```
Authorization: Bearer <admin_jwt_token>
```

Token bo'lmasa `401`, admin faol bo'lmasa `403` qaytadi.

---

## Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/users/{id}/monitoring` | Foydalanuvchining to'liq snapshoti |
| `GET` | `/bot/users/{id}/activity` | Foydalanuvchi faoliyat lentasi (sana bo'yicha filtrlash bilan) |

> `{id}` — ichki bot foydalanuvchi ID si (Telegram ID emas). Uni `GET /bot/users` ro'yxatidan olasiz.

---

### Foydalanuvchi monitoring snapshoti

```
GET /bot/users/{id}/monitoring
```

**Autentifikatsiya:** Bearer token (admin)

**Muvaffaqiyatli javob `200`:**
```json
{
  "user": {
    "id": 12,
    "telegram_id": 123456789,
    "first_name": "Ali",
    "last_name": "Valiyev",
    "username": "ali_dev",
    "phone": "+998901112233",
    "avatar_url": "https://api.telegram.org/file/bot<token>/photos/file_10.jpg",
    "is_premium": true,
    "xp": 1350,
    "level": 2,
    "level_up_xp": 1000,
    "started_at": "2026-06-20T08:00:00Z",
    "last_start_at": "2026-07-07T15:00:00Z"
  },
  "summary": {
    "rank": 3,
    "xp": 1350,
    "level": 2,
    "level_up_xp": 1000,
    "days_since_start": 17,
    "practice_count": 5,
    "practice_completions_total": 82,
    "practice_completions_today": 3,
    "practice_completions_week": 19,
    "best_streak": 14,
    "indicator_count": 3,
    "indicator_logs_total": 44,
    "indicator_logs_today": 2,
    "indicator_logs_week": 11,
    "dominant_count": 2,
    "dominant_sessions_total": 9,
    "dominant_sessions_today": 1,
    "dominant_sessions_week": 4
  },
  "practices": [
    {
      "id": "31",
      "name": "Ertalabki mashq",
      "streak": 14,
      "completions_total": 40,
      "last_completed_at": "2026-07-07T05:30:00Z",
      "created_at": "2026-06-20"
    }
  ],
  "indicators": [
    {
      "id": "12",
      "name": "Kayfiyat",
      "logs_total": 22,
      "last_value_label": "Yaxshi",
      "last_logged_at": "2026-07-07T14:10:00Z",
      "created_at": "2026-06-21"
    }
  ],
  "dominants": [
    {
      "id": "8",
      "title": "Telefonni kamroq ishlatish",
      "type": "fikrlash",
      "sessions_completed": 5,
      "last_session_at": "2026-07-06T20:00:00Z",
      "created_at": "2026-06-25"
    }
  ],
  "recent_activity": [
    {
      "kind": "practice_complete",
      "title": "Ertalabki mashq",
      "at": "2026-07-07T05:30:00Z"
    },
    {
      "kind": "indicator_log",
      "title": "Kayfiyat",
      "detail": "Yaxshi",
      "at": "2026-07-07T14:10:00Z"
    },
    {
      "kind": "dominant_session",
      "title": "Telefonni kamroq ishlatish",
      "detail": "fikrlash",
      "at": "2026-07-06T20:00:00Z"
    }
  ],
  "generated_at": "2026-07-07T16:45:00Z"
}
```

**Javob bloklari:**

| Blok | Tavsif |
|------|--------|
| `user` | Foydalanuvchi profili (`BotUserResponse` — XP, daraja bilan) |
| `summary` | Umumiy ko'rsatkichlar (quyidagi jadval) |
| `practices` | Har bir amaliyot bo'yicha statistika |
| `indicators` | Har bir indikator bo'yicha statistika |
| `dominants` | Har bir dominanta bo'yicha statistika |
| `recent_activity` | So'nggi 30 ta faoliyat (~oxirgi oy) |
| `generated_at` | Javob shakllangan vaqt |

**`summary` maydonlari:**

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `rank` | `int` | XP bo'yicha reytingdagi o'rni |
| `xp` | `int` | Jami XP |
| `level` | `int` | Daraja |
| `level_up_xp` | `int` | Daraja chegarasi |
| `days_since_start` | `int` | Start bosgandan beri kunlar |
| `practice_count` | `int` | Amaliyotlar soni |
| `practice_completions_total` | `int` | Jami amaliyot bajarilishlari |
| `practice_completions_today` | `int` | Bugun bajarilganlar |
| `practice_completions_week` | `int` | Oxirgi 7 kunda bajarilganlar |
| `best_streak` | `int` | Eng uzun ketma-ketlik (streak) |
| `indicator_count` | `int` | Indikatorlar soni |
| `indicator_logs_total` | `int` | Jami indikator kiritishlari (bo'sh emas) |
| `indicator_logs_today` | `int` | Bugun kiritilganlar |
| `indicator_logs_week` | `int` | Oxirgi 7 kunda kiritilganlar |
| `dominant_count` | `int` | Dominantalar soni |
| `dominant_sessions_total` | `int` | Jami sessiyalar |
| `dominant_sessions_today` | `int` | Bugungi sessiyalar |
| `dominant_sessions_week` | `int` | Oxirgi 7 kundagi sessiyalar |

**Element ro'yxatlari maydonlari:**

`practices[]`: `id`, `name`, `streak`, `completions_total`, `last_completed_at`, `created_at`  
`indicators[]`: `id`, `name`, `logs_total`, `last_value_label`, `last_logged_at`, `created_at`  
`dominants[]`: `id`, `title`, `type`, `sessions_completed`, `last_session_at`, `created_at`

---

### Foydalanuvchi faoliyat lentasi

```
GET /bot/users/{id}/activity?from=2026-07-01&to=2026-07-07&limit=100
```

**Autentifikatsiya:** Bearer token (admin)

**So'rov parametrlari:**

| Parametr | Turi | Majburiy | Standart | Tavsif |
|----------|------|----------|----------|--------|
| `from` | `string` | yo'q | 30 kun oldin | Boshlanish sanasi `YYYY-MM-DD` |
| `to` | `string` | yo'q | bugun | Tugash sanasi `YYYY-MM-DD` (shu kun oxirigacha) |
| `limit` | `int` | yo'q | `50` | Yozuvlar soni (`1`–`500`) |

**Muvaffaqiyatli javob `200`:**
```json
{
  "data": [
    {
      "kind": "indicator_log",
      "title": "Kayfiyat",
      "detail": "Yaxshi",
      "at": "2026-07-07T14:10:00Z"
    },
    {
      "kind": "practice_complete",
      "title": "Ertalabki mashq",
      "at": "2026-07-07T05:30:00Z"
    }
  ],
  "limit": 100,
  "from": "2026-07-01T00:00:00Z",
  "to": "2026-07-07T18:59:59Z"
}
```

Yozuvlar `at` bo'yicha kamayish tartibida (eng yangisi birinchi) qaytadi.

---

## Faoliyat turlari

`kind` maydoni quyidagi qiymatlarni oladi:

| `kind` | Ma'no | `title` | `detail` |
|--------|-------|---------|----------|
| `practice_complete` | Amaliyot bajarildi | Amaliyot nomi | — |
| `indicator_log` | Indikator kiritildi | Indikator nomi | Kiritilgan qiymat yorlig'i |
| `dominant_session` | Dominanta sessiyasi | Dominanta sarlavhasi | Sessiya turi (`fikrlash` / `ma'lumot`) |

---

## Xatoliklar

Standart xato tanasi:
```json
{ "error": "xato tavsifi" }
```

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri `id` yoki sana formati |
| `401` | Autentifikatsiya talab qilinadi |
| `403` | Ruxsat yo'q (admin faol emas) |
| `404` | Foydalanuvchi topilmadi |
| `500` | Ichki server xatosi |

---

## cURL misollari

**To'liq monitoring:**
```bash
curl -X GET http://localhost:8080/api/v1/bot/users/12/monitoring \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Faoliyat lentasi (belgilangan davr):**
```bash
curl -X GET "http://localhost:8080/api/v1/bot/users/12/activity?from=2026-07-01&to=2026-07-07&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
