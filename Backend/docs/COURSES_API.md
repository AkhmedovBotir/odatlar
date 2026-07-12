# Odatlar Bot — Qo'llanmalar (Kurslar) API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (CRUD) va Telegram Mini App (ko'rish)  
**Bog'liq hujjatlar:** [Videolar API](GUIDES_API.md) · [Admin API](API.md) · [Bot API](BOT_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Kurs tuzilmasi](#kurs-tuzilmasi)
4. [Admin — Kurslar CRUD](#admin--kurslar-crud)
5. [Foydalanuvchi — Kurslar](#foydalanuvchi--kurslar)
6. [Media va fayllar](#media-va-fayllar)
7. [Xatoliklar](#xatoliklar)
8. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Qo'llanmalar bo'limidagi **Kurslar** — bo'limlar (`bolim`) va darslardan (`dars`) iborat daraxt tuzilma. Har bir dars ichida kontent bloklari (matn, video, rasm, havola, fayl) bo'ladi.

| Tomon | Autentifikatsiya | Vazifa |
|-------|------------------|--------|
| Admin | JWT Bearer | Kurslarni yaratish, tahrirlash, o'chirish, nashr holati |
| Foydalanuvchi (Mini App) | `X-Telegram-Init-Data` | Nashr qilingan kurslarni ko'rish |

**Ma'lumotlar bazasi:** `guide_courses` — kurs metadata va `content` (JSONB, darslar daraxti).

Kursning tashqi identifikatori — **`slug`** (masalan `intizom-darsi`). API javoblarida `id` maydoni shu slug qiymatini qaytaradi.

---

## Autentifikatsiya

**Admin endpointlar:**
```
Authorization: Bearer <admin_jwt_token>
```

**Foydalanuvchi endpointlar:**
```
X-Telegram-Init-Data: <Telegram.WebApp.initData>
```

---

## Kurs tuzilmasi

Frontend `lib/guideCourse.ts` bilan mos JSON. Barcha maydonlar **camelCase**.

### Kurs (`children` massivi)

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `kind` | `"dars"` \| `"bolim"` | Tugun turi |
| `id` | `string` | Dars yoki bo'lim identifikatori (URL da ishlatiladi) |
| `title` | `string` | Sarlavha |

### Dars (`kind: "dars"`)

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `subtitle` | `string?` | Qisqa tavsif |
| `durationMin` | `number?` | Davomiylik (daqiqa) |
| `blocks` | `LessonBlock[]` | Kontent bloklari (kamida 1 ta) |

### Bo'lim (`kind: "bolim"`)

| Maydon | Turi | Tavsif |
|--------|------|--------|
| `children` | `LessonNode[]` | Faqat darslar (ichma-ich bo'lim yo'q) |

### Dars bloklari (`blocks`)

| `type` | Maydonlar |
|--------|-----------|
| `title` | `text` |
| `description` | `delta` — Quill-style `{ ops: [{ insert, attributes? }] }` |
| `video` | `src`, `poster?`, `caption?` |
| `image` | `src`, `alt?`, `caption?` |
| `link` | `href`, `label`, `description?` |
| `file` | `url`, `title`, `ext`, `sizeLabel`, `description?` |

Har bir blokda `id` (string) majburiy.

---

## Admin — Kurslar CRUD

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot/guides/courses` | Barcha kurslar |
| `POST` | `/bot/guides/courses` | Yangi kurs |
| `GET` | `/bot/guides/courses/{id}` | Bitta kurs (`slug` yoki raqamli ID) |
| `PUT` | `/bot/guides/courses/{id}` | Kursni yangilash |
| `DELETE` | `/bot/guides/courses/{id}` | Kursni o'chirish |

### Kurs yaratish

```
POST /bot/guides/courses
```

**So'rov tanasi:**

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `slug` | `string` | ha | URL identifikator: `a-z`, `0-9`, `-` (masalan `intizom-darsi`) |
| `title` | `string` | ha | Sarlavha (1–255) |
| `description` | `string` | yo'q | Tavsif (max 5000) |
| `children` | `array` | ha | Darslar/bo'limlar daraxti |
| `sort_order` | `int` | yo'q | Tartib (kichik = yuqorida) |
| `is_published` | `bool` | yo'q | Nashr holati (default: `true`) |

**Misol (qisqartirilgan):**
```json
{
  "slug": "intizom-darsi",
  "title": "Intizom darsi",
  "description": "Odatlar va intizom bo'yicha qo'llanma.",
  "sort_order": 1,
  "is_published": true,
  "children": [
    {
      "kind": "dars",
      "id": "kirish-darsi",
      "title": "Kirish darsi",
      "subtitle": "Kurs haqida umumiy ma'lumot",
      "durationMin": 8,
      "blocks": [
        { "id": "b1", "type": "title", "text": "Intizom nima?" },
        {
          "id": "b2",
          "type": "description",
          "delta": {
            "ops": [
              { "insert": "Intizom", "attributes": { "bold": true } },
              { "insert": " — maqsadga erishish uchun o'z ustingizda ishlash.\n" }
            ]
          }
        },
        {
          "id": "b3",
          "type": "video",
          "src": "https://cdn.example.com/kirish.mp4",
          "poster": "/api/v1/uploads/guides/posters/abc.jpg",
          "caption": "Kirish videosi"
        }
      ]
    },
    {
      "kind": "bolim",
      "id": "bolim-1",
      "title": "1-bo'lim",
      "children": [
        {
          "kind": "dars",
          "id": "dars-1-1",
          "title": "1-dars",
          "durationMin": 12,
          "blocks": [
            { "id": "b1", "type": "title", "text": "Odatlar tsikli" }
          ]
        }
      ]
    }
  ]
}
```

**Javob `201`:**
```json
{
  "id": "intizom-darsi",
  "title": "Intizom darsi",
  "description": "Odatlar va intizom bo'yicha qo'llanma.",
  "children": [ "... daraxt ..." ],
  "lessonCount": 2,
  "sectionCount": 1,
  "sortOrder": 1,
  "isPublished": true,
  "createdAt": "2026-07-11T10:00:00Z",
  "updatedAt": "2026-07-11T10:00:00Z"
}
```

### Kurs yangilash

```
PUT /bot/guides/courses/{id}
```

So'rov tanasi yaratish bilan bir xil, `is_published` majburiy (`bool`). `slug` o'zgartirilishi mumkin.

### Kurs o'chirish

```
DELETE /bot/guides/courses/{id}
```

**Javob:** `204 No Content`

---

## Foydalanuvchi — Kurslar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot-runtime/guides/courses` | Nashr qilingan kurslar ro'yxati |
| `GET` | `/bot-runtime/guides/courses/{id}` | To'liq kurs daraxti |
| `GET` | `/bot-runtime/guides/lessons/{lessonId}` | Bitta dars + breadcrumb |

### Kurslar ro'yxati

```
GET /bot-runtime/guides/courses
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "intizom-darsi",
      "title": "Intizom darsi",
      "description": "Odatlar va intizom bo'yicha qo'llanma.",
      "lessonCount": 5,
      "sectionCount": 2
    }
  ]
}
```

> Faqat `is_published = true` kurslar. `children` ro'yxatda qaytarilmaydi — to'liq daraxt uchun bitta kurs endpointidan foydalaning.

### To'liq kurs

```
GET /bot-runtime/guides/courses/intizom-darsi
```

**Javob `200`:** kurs obyekti + `children` massivi.

### Bitta dars

```
GET /bot-runtime/guides/lessons/kirish-darsi
```

**Javob `200`:**
```json
{
  "lesson": {
    "kind": "dars",
    "id": "kirish-darsi",
    "title": "Kirish darsi",
    "subtitle": "Kurs haqida umumiy ma'lumot",
    "durationMin": 8,
    "blocks": [ "..." ]
  },
  "breadcrumb": [
    { "id": "intizom-darsi", "title": "Intizom darsi", "href": "/qollanma/kurs/intizom-darsi" },
    { "id": "kirish-darsi", "title": "Kirish darsi", "href": "/qollanma/dars/kirish-darsi" }
  ],
  "course": {
    "id": "intizom-darsi",
    "title": "Intizom darsi",
    "description": "..."
  }
}
```

Mini App `VideoPlayer` komponenti dars ichidagi `video` bloklarida `src` va `poster` ni ishlatadi.

---

## Media va fayllar

Videolar API bilan bir xil qoidalar:

| Blok | `src` / `url` | `poster` |
|------|---------------|----------|
| `video` | `http(s)://` URL yoki `/api/v1/uploads/guides/videos/...` | Yuklangan poster `path` |
| `image` | URL yoki `/api/v1/uploads/guides/posters/...` | — |
| `file` | URL, `/files/...` yoki upload path | — |

Yuklash endpointlari: [GUIDES_API.md — Fayl yuklash](GUIDES_API.md#fayl-yuklash)

---

## Xatoliklar

```json
{ "error": "xato tavsifi" }
```

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri slug, `children` tuzilmasi yoki validatsiya |
| `401` | Autentifikatsiya talab qilinadi |
| `404` | Kurs yoki dars topilmadi |
| `500` | Server xatosi |

**Slug qoidalari:** faqat kichik harf, raqam va tire (`intizom-darsi`).

**`children` validatsiyasi:**
- Massiv bo'lishi shart
- Har tugunda `kind`, `id` majburiy
- `dars` — kamida 1 ta `blocks`
- `bolim` — kamida 1 ta `children` (faqat `dars`)
- Ichma-ich `bolim` qo'llab-quvvatlanmaydi

---

## cURL misollari

**Admin — kurs yaratish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/guides/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @course.json
```

**Admin — kurslar ro'yxati:**
```bash
curl -X GET http://localhost:8080/api/v1/bot/guides/courses \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Foydalanuvchi — kurslar ro'yxati:**
```bash
curl -X GET http://localhost:8080/api/v1/bot-runtime/guides/courses \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```

**Foydalanuvchi — bitta dars:**
```bash
curl -X GET http://localhost:8080/api/v1/bot-runtime/guides/lessons/kirish-darsi \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```
