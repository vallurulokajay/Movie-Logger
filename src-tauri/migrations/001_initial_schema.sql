PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id INTEGER NOT NULL,
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tmdb_id, media_type)
);

CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_genre_id INTEGER,
  name TEXT NOT NULL UNIQUE,
  is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0,1))
);

CREATE TABLE IF NOT EXISTS title_genres (
  title_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  PRIMARY KEY (title_id, genre_id),
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS title_tags (
  title_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (title_id, tag_id),
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS title_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_id INTEGER NOT NULL UNIQUE,
  rating REAL CHECK (
    rating IS NULL OR
    (rating >= 1.0 AND rating <= 10.0 AND CAST(rating * 2 AS INTEGER) = rating * 2)
  ),
  notes TEXT,
  times_watched INTEGER NOT NULL DEFAULT 1 CHECK (times_watched >= 1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  watchlist_id INTEGER NOT NULL,
  title_id INTEGER NOT NULL,
  PRIMARY KEY (watchlist_id, title_id),
  FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS list_items (
  list_id INTEGER NOT NULL,
  title_id INTEGER NOT NULL,
  PRIMARY KEY (list_id, title_id),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  bio TEXT,
  profile_picture_path TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_titles_title ON titles(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_titles_type ON titles(media_type);
CREATE INDEX IF NOT EXISTS idx_title_logs_rating ON title_logs(rating);
CREATE INDEX IF NOT EXISTS idx_genres_name ON genres(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);

INSERT OR IGNORE INTO profile (id, name) VALUES (1, 'Lokajay');
