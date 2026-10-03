PRAGMA foreign_keys = OFF;

CREATE TABLE titles_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  original_title TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  release_date TEXT,
  first_air_date TEXT,
  last_air_date TEXT,
  runtime INTEGER,
  overview TEXT,
  original_language TEXT,
  director TEXT,
  main_cast TEXT,
  external_id TEXT,
  external_source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO titles_new (
  id, tmdb_id, media_type, title, original_title, poster_path,
  backdrop_path, release_date, first_air_date, last_air_date,
  runtime, overview, original_language, director, main_cast,
  external_id, external_source, created_at, updated_at
)
SELECT
  id, tmdb_id, media_type, title, original_title, poster_path,
  backdrop_path, release_date, first_air_date, last_air_date,
  runtime, overview, original_language, director, main_cast,
  external_id, external_source, created_at, updated_at
FROM titles;

DROP TABLE titles;
ALTER TABLE titles_new RENAME TO titles;

CREATE INDEX IF NOT EXISTS idx_titles_title
ON titles(title COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_titles_type
ON titles(media_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_titles_external
ON titles(external_source, external_id, media_type);

PRAGMA foreign_keys = ON;
