# Odatlar Bot — Qo'llanmalar (Videolar) API

**Versiya:** 1.0  
**Base URL:** `http://localhost:8080/api/v1`  
**Format:** JSON  
**Auditoriya:** Admin panel (CRUD) va Telegram Mini App (ko'rish, like, izoh)  
**Bog'liq hujjatlar:** [Kurslar API](COURSES_API.md) · [Fayllar API](FILES_API.md) · [Admin API](API.md) · [Bot API](BOT_API.md)

---

## Mundarija

1. [Umumiy ma'lumot](#umumiy-malumot)
2. [Autentifikatsiya](#autentifikatsiya)
3. [Admin — Videolar CRUD](#admin--videolar-crud)
4. [Foydalanuvchi — Videolar](#foydalanuvchi--videolar)
5. [Like va izohlar](#like-va-izohlar)
6. [Xatoliklar](#xatoliklar)
7. [cURL misollari](#curl-misollari)

---

## Umumiy ma'lumot

Qo'llanmalar bo'limidagi **Videolar** uchun ikki tomonlama API:

| Tomon | Autentifikatsiya | Vazifa |
|-------|------------------|--------|
| Admin | JWT Bearer | Videolarni qo'shish, tahrirlash, o'chirish, nashr holati |
| Foydalanuvchi (Mini App) | `X-Telegram-Init-Data` | Nashr qilingan videolarni ko'rish, like, izoh |

**Ma'lumotlar bazasi jadvallari:**
- `guide_videos` — video metadata
- `guide_video_likes` — foydalanuvchi like lari (har video uchun bitta)
- `guide_video_comments` — izohlar

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

## Admin — Videolar CRUD

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `POST` | `/bot/guides/upload/poster` | Poster rasm yuklash (faqat fayl) |
| `POST` | `/bot/guides/upload/video` | Video fayl yuklash |
| `GET` | `/bot/guides/videos` | Barcha videolar (nashr qilinmaganlar ham) |
| `POST` | `/bot/guides/videos` | Yangi video qo'shish |
| `GET` | `/bot/guides/videos/{id}` | Bitta video |
| `PUT` | `/bot/guides/videos/{id}` | Videoni yangilash |
| `DELETE` | `/bot/guides/videos/{id}` | Videoni o'chirish |

### Fayl yuklash

Poster va (ixtiyoriy) video faylini alohida yuklang. CRUD so'rovlarida `path` maydoni ishlatiladi.

**Poster yuklash** — `multipart/form-data`, maydon: `file`

```
POST /bot/guides/upload/poster
```

Ruxsat etilgan formatlar: `jpg`, `jpeg`, `png`, `webp`, `gif` (max `MAX_POSTER_UPLOAD_MB`, default 5 MB).

**Video yuklash** — `multipart/form-data`, maydon: `file`

```
POST /bot/guides/upload/video
```

Ruxsat etilgan formatlar: `mp4`, `webm`, `mov`, `m4v` (max `MAX_VIDEO_UPLOAD_MB`, default 200 MB).

**Javob `201`:**
```json
{
  "path": "/api/v1/uploads/guides/posters/a1b2c3.jpg",
  "url": "http://localhost:8080/api/v1/uploads/guides/posters/a1b2c3.jpg"
}
```

> CRUD da `path` saqlanadi. `url` faqat ko'rsatish uchun; brauzer/Mini App `path` ni `PUBLIC_BASE_URL` bilan birlashtirib ochadi.

Yuklangan fayllar `GET /api/v1/uploads/...` orqali ochiq beriladi (autentifikatsiyasiz).

### `src` va `poster` qoidalari

| Maydon | Qabul qilinadi | Rad etiladi |
|--------|----------------|-------------|
| `src` | `https://...` tashqi URL **yoki** `/api/v1/uploads/guides/videos/...` (yuklangan video) | Boshqa yo'llar |
| `poster` | `/api/v1/uploads/guides/posters/...` (faqat yuklangan rasm) | `http(s)://` URL, bo'sh bo'lmagan boshqa yo'llar |

**Odatiy oqim:**
1. `POST /bot/guides/upload/poster` → `path` oling
2. (ixtiyoriy) `POST /bot/guides/upload/video` → `path` oling **yoki** tashqi `src` URL ishlating
3. `POST /bot/guides/videos` da `poster` = poster `path`, `src` = video `path` yoki URL

### Video yaratish

```
POST /bot/guides/videos
```

**So'rov tanasi:**

| Maydon | Turi | Majburiy | Tavsif |
|--------|------|----------|--------|
| `title` | `string` | ha | Sarlavha (1–255) |
| `description` | `string` | yo'q | Tavsif (max 5000) |
| `src` | `string` | ha | Video: `http(s)://` URL yoki yuklangan video `path` |
| `poster` | `string` | yo'q | Faqat yuklangan poster `path` (`/api/v1/uploads/guides/posters/...`) |
| `duration_min` | `int` | yo'q | Davomiyligi (daqiqa) |
| `sort_order` | `int` | yo'q | Tartib (kichik = yuqorida) |
| `is_published` | `bool` | yo'q | Nashr holati (default: `true`) |

**Misol (tashqi video URL + yuklangan poster):**
```json
{
  "title": "Kirish videosi",
  "description": "Ilovadan qanday foydalanishni ko'rsatadi",
  "src": "https://cdn.example.com/videos/kirish.mp4",
  "poster": "/api/v1/uploads/guides/posters/a1b2c3.jpg",
  "duration_min": 8,
  "sort_order": 1,
  "is_published": true
}
```

**Misol (ikkala fayl ham yuklangan):**
```json
{
  "title": "Mahalliy video",
  "src": "/api/v1/uploads/guides/videos/d4e5f6.mp4",
  "poster": "/api/v1/uploads/guides/posters/a1b2c3.jpg",
  "duration_min": 5,
  "is_published": true
}
```

**Javob `201`:**
```json
{
  "id": "1",
  "title": "Kirish videosi",
  "description": "Ilovadan qanday foydalanishni ko'rsatadi",
  "src": "https://cdn.example.com/videos/kirish.mp4",
  "poster": "/api/v1/uploads/guides/posters/a1b2c3.jpg",
  "durationMin": 8,
  "sortOrder": 1,
  "isPublished": true,
  "likesCount": 0,
  "commentsCount": 0,
  "createdAt": "2026-07-11T10:00:00Z",
  "updatedAt": "2026-07-11T10:00:00Z"
}
```

### Video yangilash

```
PUT /bot/guides/videos/{id}
```

So'rov tanasi yaratish bilan bir xil, `is_published` majburiy (`bool`).

### Video o'chirish

```
DELETE /bot/guides/videos/{id}
```

**Javob:** `204 No Content`

> Video o'chirilganda unga bog'liq like va izohlar ham o'chadi (CASCADE).

---

## Foydalanuvchi — Videolar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| `GET` | `/bot-runtime/guides/videos` | Nashr qilingan videolar ro'yxati |
| `GET` | `/bot-runtime/guides/videos/{id}` | Bitta nashr qilingan video |
| `POST` | `/bot-runtime/guides/videos/{id}/like` | Like toggle |
| `GET` | `/bot-runtime/guides/videos/{id}/comments` | Izohlar ro'yxati |
| `POST` | `/bot-runtime/guides/videos/{id}/comments` | Izoh qoldirish |

### Videolar ro'yxati

```
GET /bot-runtime/guides/videos
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "1",
      "title": "Kirish videosi",
      "description": "Ilovadan qanday foydalanishni ko'rsatadi",
      "src": "https://cdn.example.com/videos/kirish.mp4",
      "poster": "https://cdn.example.com/posters/kirish.jpg",
      "durationMin": 8,
      "likesCount": 12,
      "commentsCount": 3,
      "likedByMe": false,
      "createdAt": "2026-07-11T10:00:00Z"
    }
  ]
}
```

> Faqat `is_published = true` bo'lgan videolar qaytadi. `sort_order` bo'yicha tartiblangan.

### Bitta video

```
GET /bot-runtime/guides/videos/{id}
```

Ro'yxat elementi bilan bir xil struktura (bitta obyekt).

---

## Like va izohlar

### Like toggle

```
POST /bot-runtime/guides/videos/{id}/like
```

**Javob `200`:**
```json
{
  "likedByMe": true,
  "likesCount": 13
}
```

> Birinchi marta bosilganda like qo'shiladi, ikkinchi marta bosilganda olib tashlanadi.

### Izohlar ro'yxati

```
GET /bot-runtime/guides/videos/{id}/comments
```

**Javob `200`:**
```json
{
  "data": [
    {
      "id": "5",
      "authorName": "Ali Valiyev",
      "authorAvatarUrl": "https://...",
      "text": "Juda foydali video!",
      "createdAt": "2026-07-11T11:30:00Z",
      "isMine": true
    }
  ]
}
```

### Izoh qoldirish

```
POST /bot-runtime/guides/videos/{id}/comments
```

**So'rov:**
```json
{
  "text": "Juda foydali video!"
}
```

**Javob `201`:** bitta izoh obyekti (yuqoridagi format).

---

## Xatoliklar

```json
{ "error": "xato tavsifi" }
```

| Kod | Ma'no |
|-----|-------|
| `400` | Noto'g'ri so'rov (validatsiya, noto'g'ri `src`/`poster`, fayl hajmi yoki turi) |
| `401` | Autentifikatsiya talab qilinadi |
| `403` | Ruxsat yo'q |
| `404` | Video yoki foydalanuvchi topilmadi |
| `500` | Server xatosi |

---

## cURL misollari

**Poster yuklash:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/guides/upload/poster \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@./poster.jpg"
```

**Video fayl yuklash:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/guides/upload/video \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@./video.mp4"
```

**Admin — video qo'shish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot/guides/videos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Kirish videosi",
    "description": "Ilova tanishuvi",
    "src": "https://cdn.example.com/kirish.mp4",
    "poster": "/api/v1/uploads/guides/posters/POSTER_UUID.jpg",
    "duration_min": 8,
    "sort_order": 1
  }'
```

**Foydalanuvchi — videolar ro'yxati:**
```bash
curl -X GET http://localhost:8080/api/v1/bot-runtime/guides/videos \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```

**Like bosish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot-runtime/guides/videos/1/like \
  -H "X-Telegram-Init-Data: $INIT_DATA"
```

**Izoh qoldirish:**
```bash
curl -X POST http://localhost:8080/api/v1/bot-runtime/guides/videos/1/comments \
  -H "X-Telegram-Init-Data: $INIT_DATA" \
  -H "Content-Type: application/json" \
  -d '{"text": "Zo'\''r video!"}'
```
