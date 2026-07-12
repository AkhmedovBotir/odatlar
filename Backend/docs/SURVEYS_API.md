# Odatlar Bot — So'rovnomalar (Surveys) API

**Versiya:** 1.1  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (CRUD, nashr qilish, yopish)  
**Bog'liq hujjatlar:** [Javob berish API](SURVEY_RESPONSES_API.md) · [Javoblarni ko'rish Admin API](SURVEY_RESPONSES_ADMIN_API.md) · [Admin API](API.md) · [Bildirishnomalar API](NOTIFICATIONS_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [So'rovnoma tuzilmasi](#so-rovnoma-tuzilmasi)
4. [Savol turlari — to'liq ro'yxat](#savol-turlari--to-liq-royxat)
5. [Fayl yuklash turlari](#fayl-yuklash-turlari)
6. [Admin — CRUD](#admin--crud)
7. [Nashr va yopish](#nashr-va-yopish)
8. [To'liq misol](#to-liq-misol)
9. [Xatoliklar](#xatoliklar)
10. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Admin **Google Forms** uslubida so'rovnomalar yaratadi: sarlavha, tavsif, sozlamalar va turli xil input turlaridan iborat savollar ro'yxati.

| Tomon | Autentifikatsiya | Vazifa |
|-------|------------------|--------|
| Admin | JWT Bearer | CRUD, nashr qilish, yopish |
| Javob beruvchi | **Autentifikatsiya yo'q** | [SURVEY_RESPONSES_API.md](SURVEY_RESPONSES_API.md) |

**Ma'lumotlar bazasi:**

| Jadval | Vazifa |
|--------|--------|
| `surveys` | So'rovnoma metadata, `settings` (JSONB), `questions` (JSONB) |
| `survey_file_formats` | Fayl yuklash turlari uchun ruxsat etilgan MIME va kengaytmalar |

So'rovnomaning tashqi identifikatori — **`slug`** (masalan `foydalanuvchi-tajribasi`). API javoblarida `id` maydoni shu slug qiymatini qaytaradi.

### Holatlar (`status`)

| Holat | Tavsif |
|-------|--------|
| `draft` | Loyiha — tahrirlash, o'chirish, nashr qilish mumkin |
| `published` | Nashr qilingan — tahrirlash va yopish mumkin |
| `closed` | Yopilgan — tahrirlash mumkin emas, o'chirish mumkin |

---

## Autentifikatsiya

```
Authorization: Bearer <admin_jwt_token>
```

---

## So'rovnoma tuzilmasi

Barcha maydonlar **camelCase**.

### So'rovnoma obyekti

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `id` | `string` | Slug (tashqi identifikator) |
| `title` | `string` | Sarlavha |
| `description` | `string` | Tavsif (ixtiyoriy) |
| `settings` | `object` | Forma sozlamalari |
| `questions` | `SurveyQuestion[]` | Savollar ro'yxati |
| `status` | `string` | `draft` \| `published` \| `closed` |
| `sortOrder` | `number` | Tartib raqami |
| `questionCount` | `number` | Javob talab qilinadigan savollar soni (`section` hisoblanmaydi) |
| `createdAt` | `string` | RFC3339 |
| `updatedAt` | `string` | RFC3339 |
| `publishedAt` | `string?` | Nashr vaqti |
| `closedAt` | `string?` | Yopilgan vaqt |
| `responseUrl` | `string` | Javob berish uchun frontend havolasi |

### Javob berish havolasi (`responseUrl`)

So'rovnoma yaratilganda (va barcha admin javoblarida) `responseUrl` avtomatik qaytariladi. Bu havola alohida frontend loyihasiga yo'naltiradi — foydalanuvchi shu yerda forma to'ldiradi.

**Format:** `{SURVEY_FRONTEND_URL}/surveys/{slug}`

| Muhit | `.env` | Misol |
|-------|--------|-------|
| Development | `SURVEY_FRONTEND_URL=http://localhost:5174` | `http://localhost:5174/surveys/foydalanuvchi-tajribasi` |
| Production | `SURVEY_FRONTEND_URL=https://forms.example.com` | `https://forms.example.com/surveys/foydalanuvchi-tajribasi` |

> Havola `draft` holatida ham qaytariladi, lekin forma faqat `published` holatda ishlaydi. Nashr qilgandan keyin `responseUrl` ni ulashing.

Frontend loyiha backend API dan ma'lumot oladi: `GET /api/v1/surveys/{slug}` — batafsil: [SURVEY_RESPONSES_API.md](SURVEY_RESPONSES_API.md).

### Sozlamalar (`settings`)

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `collectEmail` | `boolean?` | Email maydonini ko'rsatish (frontend uchun) |
| `shuffleQuestions` | `boolean?` | Savollarni aralashtirish |
| `confirmationMessage` | `string?` | Yuborilgandan keyin ko'rsatiladigan xabar |
| `showProgressBar` | `boolean?` | Progress bar ko'rsatish |

### Savol (`questions[]`)

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `id` | `string` | ha | Noyob savol identifikatori |
| `type` | `string` | ha | Savol turi — [to'liq ro'yxat](#savol-turlari--to-liq-royxat) |
| `title` | `string` | `section` dan boshqa | Savol matni |
| `description` | `string?` | yo'q | Yordamchi matn |
| `required` | `boolean?` | yo'q | Majburiy javob |
| `options` | `Option[]?` | tanlov turlarida | Variantlar |
| `validation` | `object?` | yo'q | Validatsiya qoidalari |
| `config` | `object?` | ba'zi turlarda | Qo'shimcha sozlamalar |

### Variant (`options[]`)

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `id` | `string` | Noyob variant ID |
| `label` | `string` | Ko'rinadigan matn |
| `isOther` | `boolean?` | "Boshqa" varianti |

### Validatsiya (`validation`)

| Maydon | Turi | Qo'llanadi | Tavsif |
|--------|------|------------|--------|
| `min` | `number?` | `number`, `linear_scale` | Minimal qiymat |
| `max` | `number?` | `number`, `linear_scale` | Maksimal qiymat |
| `minLength` | `number?` | matn turlari | Minimal uzunlik |
| `maxLength` | `number?` | matn turlari | Maksimal uzunlik |
| `pattern` | `string?` | matn turlari | Regex pattern |

### Konfiguratsiya (`config`) — umumiy

| Maydon | Turi | Qo'llanadi | Tavsif |
|--------|------|------------|--------|
| `shuffleOptions` | `boolean?` | tanlov turlari | Variantlarni aralashtirish |
| `allowOther` | `boolean?` | tanlov turlari | "Boshqa" variant |
| `minSelections` | `number?` | `checkbox` | Minimal tanlovlar |
| `maxSelections` | `number?` | `checkbox` | Maksimal tanlovlar |
| `scaleMin` | `number` | `linear_scale` | Shkala pastki chegarasi |
| `scaleMax` | `number` | `linear_scale` | Shkala yuqori chegarasi |
| `scaleMinLabel` | `string?` | `linear_scale` | Pastki yorliq |
| `scaleMaxLabel` | `string?` | `linear_scale` | Yuqori yorliq |
| `maxStars` | `number?` | `rating` | Yulduzlar soni (1–10, default 5) |
| `rows` | `GridItem[]` | `grid_*` | Jadval qatorlari |
| `columns` | `GridItem[]` | `grid_*` | Jadval ustunlari |

### Konfiguratsiya (`config`) — fayl yuklash

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `maxFileSizeMb` | `number?` | Maksimal fayl hajmi MB da (1–500). Default — tur bo'yicha |
| `maxFiles` | `number?` | Maksimal fayllar soni (1–20, default 1) |
| `accept` | `string[]?` | Qo'shimcha MIME cheklovi (masalan `["image/jpeg"]`) |
| `allowedExtensions` | `string[]?` | Qo'shimcha kengaytma cheklovi (masalan `["jpg","png"]`) |

> `file_any` turida `accept` yoki `allowedExtensions` orqali istalgan formatni cheklash mumkin. Boshqa `file_*` turlarida default formatlar qo'llaniladi, `accept` ularni toraytirishi mumkin.

---

## Savol turlari — to'liq ro'yxat

Jami **26 ta** savol turi. Barcha `type` qiymatlari kichik harf va pastki chiziq (`snake_case`).

### 1. Matn

| `type` | Nomi | Javob formati | `config` |
|--------|------|---------------|----------|
| `short_text` | Qisqa matn | `string` | — |
| `long_text` | Uzun matn (paragraph) | `string` | — |

### 2. Tanlov

| `type` | Nomi | Javob formati | Majburiy maydonlar |
|--------|------|---------------|-------------------|
| `multiple_choice` | Bitta tanlov (radio) | `string` (option id) | `options[]` |
| `checkbox` | Ko'p tanlov | `string[]` (option id lar) | `options[]` |
| `dropdown` | Ro'yxatdan tanlash | `string` (option id) | `options[]` |

### 3. Shkala va reyting

| `type` | Nomi | Javob formati | Majburiy `config` |
|--------|------|---------------|-------------------|
| `linear_scale` | Chiziqli shkala | `number` | `scaleMin`, `scaleMax` |
| `rating` | Yulduzcha reyting | `number` | — (`maxStars` ixtiyoriy) |

### 4. Sana va vaqt

| `type` | Nomi | Javob formati | Format |
|--------|------|---------------|--------|
| `date` | Sana | `string` | `YYYY-MM-DD` |
| `time` | Vaqt | `string` | `HH:MM` |
| `datetime` | Sana va vaqt | `string` | ISO 8601 |

### 5. Aloqa va raqam

| `type` | Nomi | Javob formati |
|--------|------|---------------|
| `email` | Email manzil | `string` |
| `phone` | Telefon raqam | `string` |
| `url` | Veb-havola | `string` |
| `number` | Raqam | `number` |

### 6. Fayl yuklash

| `type` | Nomi | Kategoriya |
|--------|------|------------|
| `file_image` | Rasm | `image` |
| `file_video` | Video | `video` |
| `file_audio` | Audio | `audio` |
| `file_pdf` | PDF hujjat | `pdf` |
| `file_document` | Matn hujjat (Word, TXT, …) | `document` |
| `file_spreadsheet` | Jadval (Excel, CSV, …) | `spreadsheet` |
| `file_presentation` | Taqdimot (PowerPoint, …) | `presentation` |
| `file_archive` | Arxiv (ZIP, RAR, …) | `archive` |
| `file_any` | Istalgan fayl | `any` |
| `file` | *(eski nom)* | `file_any` bilan bir xil |

Batafsil formatlar: [Fayl yuklash turlari](#fayl-yuklash-turlari).

### 7. Tuzilma va jadval

| `type` | Nomi | Javob | Majburiy maydonlar |
|--------|------|-------|-------------------|
| `section` | Bo'lim sarlavhasi | javobsiz | faqat `title` |
| `grid_choice` | Jadval — bitta tanlov | `object` (rowId → columnId) | `config.rows`, `config.columns` |
| `grid_checkbox` | Jadval — ko'p tanlov | `object` (rowId → columnId[]) | `config.rows`, `config.columns` |

---

## Fayl yuklash turlari

### Ruxsat etilgan formatlar jadvali

| `type` | O'zbekcha nom | Kengaytmalar | MIME turlar (asosiy) | Default hajm |
|--------|---------------|--------------|----------------------|--------------|
| `file_image` | Rasm | `jpg`, `jpeg`, `png`, `gif`, `webp`, `bmp`, `svg`, `heic`, `heif`, `tif`, `tiff` | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/bmp`, `image/svg+xml`, `image/heic`, `image/heif`, `image/tiff` | 10 MB |
| `file_video` | Video | `mp4`, `webm`, `mov`, `avi`, `mkv`, `m4v`, `mpeg`, `mpg`, `ogv` | `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`, `video/x-matroska`, `video/x-m4v`, `video/mpeg`, `video/ogg` | 100 MB |
| `file_audio` | Audio | `mp3`, `wav`, `ogg`, `m4a`, `aac`, `flac`, `weba` | `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp4`, `audio/aac`, `audio/flac`, `audio/webm`, `audio/x-m4a` | 25 MB |
| `file_pdf` | PDF | `pdf` | `application/pdf` | 20 MB |
| `file_document` | Matn hujjat | `doc`, `docx`, `odt`, `rtf`, `txt`, `md` | `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.oasis.opendocument.text`, `application/rtf`, `text/plain`, `text/markdown` | 15 MB |
| `file_spreadsheet` | Jadval | `xls`, `xlsx`, `ods`, `csv`, `tsv` | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.oasis.opendocument.spreadsheet`, `text/csv`, `text/tab-separated-values` | 15 MB |
| `file_presentation` | Taqdimot | `ppt`, `pptx`, `odp` | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `application/vnd.oasis.opendocument.presentation` | 30 MB |
| `file_archive` | Arxiv | `zip`, `rar`, `7z`, `gz`, `tar`, `tgz` | `application/zip`, `application/x-rar-compressed`, `application/x-7z-compressed`, `application/gzip`, `application/x-tar` | 50 MB |
| `file_any` | Istalgan fayl | cheklanmagan* | `*/*` | 25 MB |

\* `file_any` da `config.accept` yoki `config.allowedExtensions` orqali formatlar cheklanadi.

### Fayl savoli misoli

```json
{
  "id": "q-screenshot",
  "type": "file_image",
  "title": "Xatolik skrinshotini yuklang",
  "description": "PNG yoki JPG, maksimal 5 MB",
  "required": true,
  "config": {
    "maxFileSizeMb": 5,
    "maxFiles": 3,
    "accept": ["image/jpeg", "image/png"],
    "allowedExtensions": ["jpg", "jpeg", "png"]
  }
}
```

```json
{
  "id": "q-resume",
  "type": "file_pdf",
  "title": "Rezyumengizni PDF formatda yuklang",
  "required": true,
  "config": { "maxFileSizeMb": 10 }
}
```

```json
{
  "id": "q-demo-video",
  "type": "file_video",
  "title": "Qisqa demo videongizni yuklang",
  "config": { "maxFileSizeMb": 50, "maxFiles": 1 }
}
```

### Fayl formatlari ro'yxati (API)

Admin panel uchun barcha fayl turlarini olish:

```
GET /bot/surveys/file-formats
```

**Javob `200`:**
```json
{
  "data": [
    {
      "questionType": "file_image",
      "category": "image",
      "labelUz": "Rasm",
      "mimeTypes": ["image/jpeg", "image/png", "..."],
      "extensions": ["jpg", "jpeg", "png", "..."],
      "defaultMaxSizeMb": 10,
      "defaultMaxFiles": 1
    }
  ]
}
```

---

## Admin — CRUD

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/surveys` | Barcha so'rovnomalar |
| `GET` | `/bot/surveys/file-formats` | Fayl yuklash turlari va formatlar |
| `POST` | `/bot/surveys` | Yangi draft yaratish |
| `GET` | `/bot/surveys/{id}` | Bitta so'rovnoma (slug yoki raqamli ID) |
| `PUT` | `/bot/surveys/{id}` | Tahrirlash (`closed` emas) |
| `DELETE` | `/bot/surveys/{id}` | O'chirish |

### Yaratish

```
POST /bot/surveys
```

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `slug` | `string` | ha | `a-z`, `0-9`, `-` (max 100) |
| `title` | `string` | ha | Sarlavha |
| `description` | `string` | yo'q | Tavsif |
| `settings` | `object` | yo'q | Forma sozlamalari |
| `questions` | `array` | ha | Kamida 1 ta savol |
| `sortOrder` | `number` | yo'q | Tartib (default 0) |

**Javob `201`:**
```json
{
  "id": "foydalanuvchi-tajribasi",
  "title": "Foydalanuvchi tajribasi so'rovnomasi",
  "description": "Ilovamiz haqida fikringizni bildiring",
  "settings": {
    "collectEmail": false,
    "confirmationMessage": "Javobingiz uchun rahmat!"
  },
  "questions": [ "..." ],
  "questionCount": 7,
  "status": "draft",
  "sortOrder": 0,
  "responseUrl": "http://localhost:5174/surveys/foydalanuvchi-tajribasi",
  "createdAt": "2026-07-12T10:00:00Z",
  "updatedAt": "2026-07-12T10:00:00Z"
}
```

### Yangilash

```
PUT /bot/surveys/{id}
```

Yaratish bilan bir xil maydonlar. `closed` holatdagi so'rovnomani tahrirlab bo'lmaydi.

### O'chirish

```
DELETE /bot/surveys/{id}
```

**Javob:** `204 No Content`

---

## Nashr va yopish

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `POST` | `/bot/surveys/{id}/publish` | `draft` → `published` |
| `POST` | `/bot/surveys/{id}/close` | `published` → `closed` |

**Nashr qilish shartlari:**
- Holat `draft` bo'lishi kerak
- Kamida 1 ta javob talab qilinadigan savol (`section` hisoblanmaydi)

---

## To'liq misol

```json
{
  "slug": "foydalanuvchi-tajribasi",
  "title": "Foydalanuvchi tajribasi so'rovnomasi",
  "description": "Ilovamiz haqida fikringizni bildiring",
  "sortOrder": 0,
  "settings": {
    "collectEmail": true,
    "shuffleQuestions": false,
    "confirmationMessage": "Javobingiz uchun rahmat!",
    "showProgressBar": true
  },
  "questions": [
    {
      "id": "section-1",
      "type": "section",
      "title": "Umumiy ma'lumotlar"
    },
    {
      "id": "q-name",
      "type": "short_text",
      "title": "Ismingiz",
      "required": true,
      "validation": { "minLength": 2, "maxLength": 100 }
    },
    {
      "id": "q-email",
      "type": "email",
      "title": "Email manzilingiz",
      "required": true
    },
    {
      "id": "q-screenshot",
      "type": "file_image",
      "title": "Ilova skrinshoti",
      "description": "JPG yoki PNG, maksimal 5 MB",
      "config": { "maxFileSizeMb": 5, "allowedExtensions": ["jpg", "jpeg", "png"] }
    },
    {
      "id": "q-resume",
      "type": "file_pdf",
      "title": "Qo'shimcha hujjat (PDF)",
      "required": false
    },
    {
      "id": "q-satisfaction",
      "type": "linear_scale",
      "title": "Ilovadan qanchalik mamnunsiz?",
      "required": true,
      "config": {
        "scaleMin": 1,
        "scaleMax": 5,
        "scaleMinLabel": "Umuman yo'q",
        "scaleMaxLabel": "Juda mamnun"
      }
    },
    {
      "id": "q-platform",
      "type": "multiple_choice",
      "title": "Qaysi platformadan foydalanasiz?",
      "required": true,
      "options": [
        { "id": "android", "label": "Android" },
        { "id": "ios", "label": "iOS" },
        { "id": "web", "label": "Web" }
      ]
    },
    {
      "id": "q-feedback",
      "type": "long_text",
      "title": "Qo'shimcha fikrlaringiz",
      "validation": { "maxLength": 2000 }
    }
  ]
}
```

---

## Xatoliklar

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri slug, savol turi, fayl config, holat yoki yopilgan so'rovnomani tahrirlash |
| `401` | Autentifikatsiya talab qilinadi |
| `404` | So'rovnoma topilmadi |
| `500` | Server xatosi |

**Tez-tez uchraydigan 400 xabarlari:**
- `slug must be lowercase letters, numbers and hyphens`
- `survey slug already exists`
- `invalid survey questions: unknown type "..."`
- `invalid survey questions: config.maxFileSizeMb must be between 1 and 500`
- `only draft surveys can be published`
- `only published surveys can be closed`
- `closed surveys cannot be edited`

---

## cURL misollari

**Fayl formatlari ro'yxati:**
```bash
curl -X GET http://localhost:8080/api/v1/bot/surveys/file-formats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Draft yaratish (fayl savollari bilan):**
```bash
curl -X POST http://localhost:8080/api/v1/bot/surveys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "media-so-rovi",
    "title": "Media so'\''rovi",
    "questions": [
      {
        "id": "q-photo",
        "type": "file_image",
        "title": "Rasmingizni yuklang",
        "required": true,
        "config": { "maxFileSizeMb": 10 }
      },
      {
        "id": "q-video",
        "type": "file_video",
        "title": "Qisqa videongiz",
        "config": { "maxFileSizeMb": 50 }
      },
      {
        "id": "q-doc",
        "type": "file_pdf",
        "title": "PDF hujjat",
        "required": true
      }
    ]
  }'
```

**Ro'yxat:**
```bash
curl -X GET http://localhost:8080/api/v1/bot/surveys \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Nashr qilish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/surveys/media-so-rovi/publish \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**O'chirish:**
```bash
curl -X DELETE http://localhost:8080/api/v1/bot/surveys/media-so-rovi \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
