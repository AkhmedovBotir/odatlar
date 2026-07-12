# Odatlar Bot — So'rovnoma javoblarini ko'rish (Admin) API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (JWT)  
**Bog'liq hujjatlar:** [So'rovnomalar Admin API](SURVEYS_API.md) · [Javob berish API](SURVEY_RESPONSES_API.md) · [Admin API](API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Endpointlar](#endpointlar)
4. [Filtrlash va sahifalash](#filtrlash-va-sahifalash)
5. [Barcha javoblar](#barcha-javoblar)
6. [Bitta so'rovnoma javoblari](#bitta-sorovnoma-javoblari)
7. [Javob tafsilotlari](#javob-tafsilotlari)
8. [Statistika](#statistika)
9. [Javobni o'chirish](#javobni-ochirish)
10. [Xatoliklar](#xatoliklar)
11. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Admin panel orqali foydalanuvchilardan kelgan so'rovnoma javoblarini ko'rish, filtrlash, tahlil qilish va kerak bo'lsa o'chirish mumkin.

| Vazifa | Endpoint |
|--------|----------|
| Barcha javoblar (filtr bilan) | `GET /bot/surveys/responses` |
| Bitta so'rovnoma javoblari | `GET /bot/surveys/{id}/responses` |
| Bitta javob tafsiloti | `GET /bot/surveys/responses/{responseId}` |
| So'rovnoma statistikasi | `GET /bot/surveys/{id}/responses/summary` |
| Javobni o'chirish | `DELETE /bot/surveys/responses/{responseId}` |

**So'rovnomani tanlash:** `GET /bot/surveys` dan ro'yxat oling, keyin `slug` yoki `id` bilan filtrlang.

**Ma'lumotlar bazasi:** `survey_responses` (javoblar), `surveys` (so'rovnoma metadata)

---

## Autentifikatsiya

```
Authorization: Bearer <admin_jwt_token>
```

---

## Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/surveys/responses` | Barcha javoblar (umumiy filter) |
| `GET` | `/bot/surveys/responses/{responseId}` | Bitta javob + savollar konteksti |
| `DELETE` | `/bot/surveys/responses/{responseId}` | Javobni o'chirish |
| `GET` | `/bot/surveys/{id}/responses` | Tanlangan so'rovnoma javoblari |
| `GET` | `/bot/surveys/{id}/responses/summary` | Tanlangan so'rovnoma statistikasi |

`{id}` — so'rovnoma **slug** yoki raqamli ID.  
`{responseId}` — `survey_responses.id` (raqam).

---

## Filtrlash va sahifalash

Quyidagi query parametrlar `GET /bot/surveys/responses` va `GET /bot/surveys/{id}/responses` da ishlaydi:

| Parametr | Turi | Tavsif |
|----------|------|--------|
| `survey` | `string` | Faqat `/responses` da — so'rovnoma slug yoki ID |
| `from` | `string` | Boshlanish sanasi (`YYYY-MM-DD`, shu kundan boshlab) |
| `to` | `string` | Tugash sanasi (`YYYY-MM-DD`, shu kun oxirigacha) |
| `search` | `string` | Javoblar JSON ichida matn qidiruv (ILIKE) |
| `question_id` | `string` | Faqat shu savolga javob berganlar (`answers` da mavjud) |
| `page` | `int` | Sahifa (default: `1`) |
| `limit` | `int` | Sahifadagi yozuvlar (default: `20`, max: `100`) |
| `sort` | `string` | `created_at_desc` (default) yoki `created_at_asc` |

**Misol — bitta so'rovnoma, oxirgi 7 kun, qidiruv:**
```
GET /bot/surveys/foydalanuvchi-tajribasi/responses?from=2026-07-05&to=2026-07-12&search=android&page=1&limit=20
```

**Misol — barcha so'rovnomalar, faqat bittasi:**
```
GET /bot/surveys/responses?survey=foydalanuvchi-tajribasi&sort=created_at_desc
```

---

## Barcha javoblar

```
GET /bot/surveys/responses
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "42",
      "surveyId": "foydalanuvchi-tajribasi",
      "surveySlug": "foydalanuvchi-tajribasi",
      "surveyTitle": "Foydalanuvchi tajribasi",
      "answers": {
        "q-name": "Ali",
        "q-platform": "android",
        "q-satisfaction": 5
      },
      "createdAt": "2026-07-12T10:30:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 20
}
```

| Maydon | Tavsif |
|--------|--------|
| `data` | Javoblar ro'yxati |
| `total` | Filter bo'yicha umumiy son |
| `page` | Joriy sahifa |
| `limit` | Sahifa hajmi |

---

## Bitta so'rovnoma javoblari

```
GET /bot/surveys/{id}/responses
```

`{id}` URL da berilgani uchun `survey` query parametri shart emas. Qolgan filterlar ishlaydi.

---

## Javob tafsilotlari

```
GET /bot/surveys/responses/{responseId}
```

Bitta javobni savollar konteksti bilan ko'rish — admin panelda javobni savol matnlari bilan moslashtirish uchun.

**Javob `200`:**
```json
{
  "id": "42",
  "surveyId": "foydalanuvchi-tajribasi",
  "surveySlug": "foydalanuvchi-tajribasi",
  "surveyTitle": "Foydalanuvchi tajribasi",
  "surveyStatus": "published",
  "questions": [
    {
      "id": "q-name",
      "type": "short_text",
      "title": "Ismingiz",
      "required": true
    }
  ],
  "answers": {
    "q-name": "Ali",
    "q-platform": "android"
  },
  "createdAt": "2026-07-12T10:30:00Z"
}
```

---

## Statistika

```
GET /bot/surveys/{id}/responses/summary
```

**Javob `200`:**
```json
{
  "surveyId": "foydalanuvchi-tajribasi",
  "surveySlug": "foydalanuvchi-tajribasi",
  "surveyTitle": "Foydalanuvchi tajribasi",
  "surveyStatus": "published",
  "totalResponses": 156,
  "todayResponses": 12,
  "weekResponses": 48,
  "firstResponseAt": "2026-07-01T08:15:00Z",
  "lastResponseAt": "2026-07-12T10:30:00Z"
}
```

---

## Javobni o'chirish

```
DELETE /bot/surveys/responses/{responseId}
```

**Javob:** `204 No Content`

---

## Xatoliklar

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri filter (`from`/`to` formati), noto'g'ri ID |
| `401` | Autentifikatsiya talab qilinadi |
| `404` | So'rovnoma yoki javob topilmadi |
| `500` | Server xatosi |

---

## cURL misollari

**So'rovnomalarni tanlash:**
```bash
curl http://localhost:8080/api/v1/bot/surveys \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Filtr bilan javoblar:**
```bash
curl "http://localhost:8080/api/v1/bot/surveys/responses?survey=foydalanuvchi-tajribasi&from=2026-07-01&page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Statistika:**
```bash
curl http://localhost:8080/api/v1/bot/surveys/foydalanuvchi-tajribasi/responses/summary \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Bitta javob:**
```bash
curl http://localhost:8080/api/v1/bot/surveys/responses/42 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Admin panel oqimi

```
1. GET /bot/surveys                        → So'rovnoma tanlash
2. GET /bot/surveys/{id}/responses/summary → Statistik kartochka
3. GET /bot/surveys/{id}/responses?...     → Jadval (filter, sahifa)
4. GET /bot/surveys/responses/{id}         → Batafsil ko'rish
5. DELETE /bot/surveys/responses/{id}      → O'chirish (ixtiyoriy)
```
