-- So'rovnoma savol turlari va fayl formatlari uchun ma'lumotnoma jadvali.
-- questions JSONB dagi file_* turlari shu jadval bilan mos keladi.

CREATE TABLE IF NOT EXISTS survey_file_formats (
    question_type       VARCHAR(30)  PRIMARY KEY,
    category            VARCHAR(50)  NOT NULL,
    label_uz            VARCHAR(100) NOT NULL,
    mime_types          TEXT[]       NOT NULL,
    extensions          TEXT[]       NOT NULL,
    default_max_size_mb INT          NOT NULL DEFAULT 10,
    default_max_files   INT          NOT NULL DEFAULT 1,
    sort_order          INT          NOT NULL DEFAULT 0
);

INSERT INTO survey_file_formats (question_type, category, label_uz, mime_types, extensions, default_max_size_mb, default_max_files, sort_order) VALUES
('file_image', 'image', 'Rasm',
 ARRAY['image/jpeg','image/png','image/gif','image/webp','image/bmp','image/svg+xml','image/heic','image/heif','image/tiff'],
 ARRAY['jpg','jpeg','png','gif','webp','bmp','svg','heic','heif','tif','tiff'], 10, 1, 1),
('file_video', 'video', 'Video',
 ARRAY['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/x-matroska','video/x-m4v','video/mpeg','video/ogg'],
 ARRAY['mp4','webm','mov','avi','mkv','m4v','mpeg','mpg','ogv'], 100, 1, 2),
('file_audio', 'audio', 'Audio',
 ARRAY['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/aac','audio/flac','audio/webm','audio/x-m4a'],
 ARRAY['mp3','wav','ogg','m4a','aac','flac','weba'], 25, 1, 3),
('file_pdf', 'pdf', 'PDF',
 ARRAY['application/pdf'],
 ARRAY['pdf'], 20, 1, 4),
('file_document', 'document', 'Matn hujjat',
 ARRAY['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.oasis.opendocument.text','application/rtf','text/plain','text/markdown'],
 ARRAY['doc','docx','odt','rtf','txt','md'], 15, 1, 5),
('file_spreadsheet', 'spreadsheet', 'Jadval / spreadsheet',
 ARRAY['application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.oasis.opendocument.spreadsheet','text/csv','text/tab-separated-values'],
 ARRAY['xls','xlsx','ods','csv','tsv'], 15, 1, 6),
('file_presentation', 'presentation', 'Taqdimot',
 ARRAY['application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.oasis.opendocument.presentation'],
 ARRAY['ppt','pptx','odp'], 30, 1, 7),
('file_archive', 'archive', 'Arxiv',
 ARRAY['application/zip','application/x-rar-compressed','application/x-7z-compressed','application/gzip','application/x-tar'],
 ARRAY['zip','rar','7z','gz','tar','tgz'], 50, 1, 8),
('file_any', 'any', 'Istalgan fayl',
 ARRAY['*/*'],
 ARRAY[]::TEXT[], 25, 1, 9)
ON CONFLICT (question_type) DO NOTHING;

COMMENT ON TABLE surveys IS 'So''rovnomalar — Google Forms uslubidagi savollar questions (JSONB) maydonida saqlanadi';
COMMENT ON COLUMN surveys.questions IS 'Savollar massivi. type: short_text, long_text, multiple_choice, checkbox, dropdown, linear_scale, rating, date, time, datetime, email, phone, url, number, file_image, file_video, file_audio, file_pdf, file_document, file_spreadsheet, file_presentation, file_archive, file_any, section, grid_choice, grid_checkbox';
COMMENT ON TABLE survey_file_formats IS 'Fayl yuklash savol turlari uchun ruxsat etilgan MIME va kengaytmalar';
