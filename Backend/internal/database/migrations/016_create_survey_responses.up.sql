CREATE TABLE IF NOT EXISTS survey_responses (
    id         BIGSERIAL   PRIMARY KEY,
    survey_id  BIGINT      NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    answers    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id, created_at DESC);

COMMENT ON TABLE survey_responses IS 'So''rovnoma javoblari — autentifikatsiyasiz, cheksiz yuborish mumkin';
COMMENT ON COLUMN survey_responses.answers IS 'Savol id → javob qiymati (JSON)';
