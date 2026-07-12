# Odatlar Bot — So'rovnomaga javob berish API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON + multipart (fayl yuklash)  
**Auditoriya:** Ochiq (autentifikatsiyasiz) — istalgan foydalanuvchi  
**Bog'liq hujjatlar:** [So'rovnomalar Admin API](SURVEYS_API.md) · [Admin API](API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Endpointlar](#endpointlar)
4. [So'rovnomani ko'rish](#so-rovnomani-ko-rish)
5. [Javob yuborish](#javob-yuborish)
6. [Fayl yuklash](#fayl-yuklash)
7. [Javob formatlari](#javob-formatlari)
8. [Xatoliklar](#xatoliklar)
9. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Nashr qilingan so'rovnomalarga **hech qanday autentifikatsiyasiz** javob berish mumkin. Telegram, JWT yoki boshqa token talab qilinmaydi.

**Frontend loyiha** (forma UI) alohida joylashgan. Admin so'rovnoma yaratganda `responseUrl` qaytariladi:

```
http://localhost:5174/surveys/{slug}
```

Bu havolani boshqa loyihalarda (sayt, bot, email) ulashish mumkin. Frontend `slug` bo'yicha backend API dan so'rovnoma ma'lumotlarini oladi.

| Xususiyat | Qiymat |
|-----------|--------|
| Autentifikatsiya | **Yo'q** |
| Javoblar soni | **Cheksiz** (bir foydalanuvchi ko'p marta yuborishi mumkin) |
| Ko'rinadigan holatlar | `published` (javob qabul qilinadi), `closed` (faqat ko'rish) |
| Javoblar jadvali | `survey_responses` |

**Admin tomondan yaratish va nashr qilish:** [SURVEYS_API.md](SURVEYS_API.md)

### Frontend sozlama

Backend `.env` faylida:

```
SURVEY_FRONTEND_URL=http://localhost:5174
```

Production uchun o'z domeningizni qo'ying. Admin API `responseUrl` maydonida to'liq havolani qaytaradi.

---

## Autentifikatsiya

Autentifikatsiya **talab qilinmaydi**. So'rovlar ochiq endpointlarga yuboriladi:

```
GET  /api/v1/surveys
GET  /api/v1/surveys/{id}
POST /api/v1/surveys/{id}/responses
POST /api/v1/surveys/{id}/upload
```

---

## Endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/surveys` | Nashr qilingan so'rovnomalar ro'yxati |
| `GET` | `/surveys/{id}` | So'rovnoma tafsilotlari (savollar bilan) |
| `POST` | `/surveys/{id}/responses` | Javoblarni yuborish |
| `POST` | `/surveys/{id}/upload` | Fayl savoli uchun fayl yuklash |

`{id}` — so'rovnoma **slug** yoki raqamli ID.

---

## So'rovnomani ko'rish

### Ro'yxat

```
GET /surveys
```

Faqat `status: published` bo'lgan so'rovnomalar qaytariladi.

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "foydalanuvchi-tajribasi",
      "title": "Foydalanuvchi tajribasi",
      "description": "Fikringizni bildiring",
      "questionCount": 5
    }
  ]
}
```

### Bitta so'rovnoma

```
GET /surveys/{id}
```

`published` yoki `closed` holatdagi so'rovnomalar qaytariladi.

**Javob `200`:**
```json
{
  "id": "foydalanuvchi-tajribasi",
  "title": "Foydalanuvchi tajribasi so'rovnomasi",
  "description": "Ilovamiz haqida fikringizni bildiring",
  "status": "published",
  "settings": {
    "showProgressBar": true,
    "shuffleQuestions": false
  },
  "questions": [ "..." ]
}
```

| Maydon | Tavsif |
|--------|--------|
| `status` | `published` — javob yuborish mumkin; `closed` — faqat ko'rish |
| `settings` | Faqat foydalanuvchiga ko'rinadigan sozlamalar |
| `questions` | Admin yaratgan savollar (o'zgartirilmagan) |

> `closed` holatda forma ko'rsatiladi, lekin javob qabul qilinmaydi.

---

## Javob yuborish

```
POST /surveys/{id}/responses
Content-Type: application/json
```

Faqat `status: published` bo'lgan so'rovnomaga javob qabul qilinadi.

### So'rov tanasi

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `answers` | `object` | ha | Savol `id` → javob qiymati |

**Misol:**
```json
{
  "answers": {
    "q-name": "Ali Valiyev",
    "q-email": "ali@example.com",
    "q-platform": "android",
    "q-features": ["practices", "guides"],
    "q-satisfaction": 4,
    "q-rating": 5,
    "q-feedback": "Juda yaxshi ilova!",
    "q-date": "2026-01-15",
    "q-grid": {
      "ui": "good",
      "speed": "ok",
      "content": "good"
    },
    "q-photo": "/api/v1/uploads/surveys/responses/uuid.jpg",
    "q-docs": [
      "/api/v1/uploads/surveys/responses/uuid1.pdf",
      "/api/v1/uploads/surveys/responses/uuid2.pdf"
    ]
  }
}
```

**Javob `201`:**
```json
{
  "id": "42",
  "confirmationMessage": "Javobingiz uchun rahmat!",
  "createdAt": "2026-07-12T10:30:00Z"
}
```

### Validatsiya qoidalari

- `required: true` bo'lgan savollar uchun javob majburiy
- Noma'lum savol `id` yuborilsa — `400`
- Savol turiga mos bo'lmagan javob formati — `400`
- Fayl javoblari faqat `/api/v1/uploads/surveys/responses/...` path yoki `https://` URL bo'lishi kerak

---

## Fayl yuklash

Fayl savollaridan (`file_image`, `file_video`, `file_pdf`, …) oldin faylni yuklash kerak.

```
POST /surveys/{id}/upload
Content-Type: multipart/form-data
```

| Form maydoni | Turi | Majburiy | Tavsif |
|--------------|------|----------|--------|
| `questionId` | `string` | ha | Fayl savolining `id` maydoni |
| `file` | `file` | ha | Yuklanadigan fayl |

**Javob `201`:**
```json
{
  "path": "/api/v1/uploads/surveys/responses/a1b2c3d4-....jpg",
  "url": "http://localhost:8080/api/v1/uploads/surveys/responses/a1b2c3d4-....jpg",
  "ext": "jpg",
  "sizeLabel": "1.2 MB",
  "sizeBytes": 1258291
}
```

Keyin `answers` obyektida `path` yoki `url` qiymatini yuboring:

```json
{
  "answers": {
    "q-photo": "/api/v1/uploads/surveys/responses/a1b2c3d4-....jpg"
  }
}
```

Fayl turlari va ruxsat etilgan formatlar: [SURVEYS_API.md — Fayl yuklash turlari](SURVEYS_API.md#fayl-yuklash-turlari)

---

## Javob formatlari

Har bir savol `type` uchun kutiladigan `answers` qiymati:

| `type` | Javob formati | Misol |
|--------|---------------|-------|
| `short_text` | `string` | `"Ali"` |
| `long_text` | `string` | `"Uzun matn..."` |
| `multiple_choice` | `string` | `"android"` (option id) |
| `checkbox` | `string[]` | `["practices", "guides"]` |
| `dropdown` | `string` | `"friend"` |
| `linear_scale` | `number` | `4` |
| `rating` | `number` | `5` |
| `date` | `string` | `"2026-07-12"` |
| `time` | `string` | `"14:30"` |
| `datetime` | `string` | `"2026-07-12T14:30:00Z"` |
| `email` | `string` | `"user@mail.com"` |
| `phone` | `string` | `"+998901234567"` |
| `url` | `string` | `"https://example.com"` |
| `number` | `number` | `25` |
| `file_image` | `string` | `"/api/v1/uploads/surveys/responses/....jpg"` |
| `file_video` | `string` | `"/api/v1/uploads/surveys/responses/....mp4"` |
| `file_audio` | `string` | `"/api/v1/uploads/surveys/responses/....mp3"` |
| `file_pdf` | `string` | `"/api/v1/uploads/surveys/responses/....pdf"` |
| `file_document` | `string` | `"/api/v1/uploads/surveys/responses/....docx"` |
| `file_spreadsheet` | `string` | `"/api/v1/uploads/surveys/responses/....xlsx"` |
| `file_presentation` | `string` | `"/api/v1/uploads/surveys/responses/....pptx"` |
| `file_archive` | `string` | `"/api/v1/uploads/surveys/responses/....zip"` |
| `file_any` | `string` | `"/api/v1/uploads/surveys/responses/...."` |
| `file_*` (ko'p fayl) | `string[]` | `["/api/v1/uploads/...", "..."]` — `config.maxFiles > 1` bo'lsa |
| `grid_choice` | `object` | `{ "rowId": "columnId" }` |
| `grid_checkbox` | `object` | `{ "rowId": ["colId1", "colId2"] }` |
| `section` | — | javob talab qilinmaydi |

---

## Xatoliklar

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri javob, yopilgan so'rovnoma, noto'g'ri fayl |
| `404` | So'rovnoma yoki savol topilmadi |
| `500` | Server xatosi |

**Tez-tez uchraydigan 400 xabarlari:**
- `survey is not accepting responses` — so'rovnoma `closed` yoki `draft`
- `invalid survey answers: answer required for question "..."`
- `invalid survey answers: unknown question id "..."`
- `file too large` / `invalid file type`

---

## cURL misollari

**Ro'yxat:**
```bash
curl http://localhost:8080/api/v1/surveys
```

**So'rovnomani olish:**
```bash
curl http://localhost:8080/api/v1/surveys/foydalanuvchi-tajribasi
```

**Javob yuborish:**
```bash
curl -X POST http://localhost:8080/api/v1/surveys/foydalanuvchi-tajribasi/responses \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "q-name": "Ali",
      "q-platform": "android",
      "q-satisfaction": 5
    }
  }'
```

**Fayl yuklash:**
```bash
curl -X POST http://localhost:8080/api/v1/surveys/foydalanuvchi-tajribasi/upload \
  -F "questionId=q-photo" \
  -F "file=@screenshot.png"
```

**Fayl bilan javob:**
```bash
curl -X POST http://localhost:8080/api/v1/surveys/foydalanuvchi-tajribasi/responses \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "q-name": "Ali",
      "q-photo": "/api/v1/uploads/surveys/responses/UUID.png"
    }
  }'
```

---

## Oqim diagrammasi

```
1. GET /surveys/{id}           → Formani ko'rsatish
2. POST /surveys/{id}/upload   → (ixtiyoriy) Fayl savollari uchun
3. POST /surveys/{id}/responses → Javoblarni yuborish
4. confirmationMessage         → Foydalanuvchiga rahmat xabari
```
