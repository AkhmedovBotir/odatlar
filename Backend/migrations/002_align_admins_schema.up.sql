-- Eski sxemadan yangi sxemaga o'tkazish (password -> password_hash)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'password'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE admins RENAME COLUMN password TO password_hash;
    END IF;
END $$;

ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'password'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admins' AND column_name = 'password_hash'
    ) THEN
        UPDATE admins SET password_hash = password WHERE password_hash = '' AND password <> '';
        ALTER TABLE admins DROP COLUMN password;
    END IF;
END $$;

ALTER TABLE admins ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE admins DROP COLUMN IF EXISTS is_active;
ALTER TABLE admins DROP COLUMN IF EXISTS role;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_phone ON admins(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);
