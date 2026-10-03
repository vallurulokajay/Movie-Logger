ALTER TABLE titles ADD COLUMN external_id TEXT;
ALTER TABLE titles ADD COLUMN external_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_titles_external
ON titles(external_source, external_id, media_type);
