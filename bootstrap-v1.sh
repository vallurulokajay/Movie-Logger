#!/usr/bin/env bash
set -euo pipefail

echo "== Movie Logger V1 bootstrap =="

mkdir -p src src-tauri/src src-tauri/migrations src-tauri/capabilities .github/workflows

cat > package.json <<'EOF'
{
  "name": "movie-logger",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.8.0",
    "@tauri-apps/plugin-sql": "^2.5.0",
    "react": "^19.3.0",
    "react-dom": "^19.3.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.12.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "^7.0.2",
    "vite": "^8.3.2"
  }
}
EOF

cat > vite.config.ts <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] }
  },
  build: { target: "es2022" }
});
EOF

cat > tsconfig.json <<'EOF'
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
EOF

cat > tsconfig.app.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
EOF

cat > tsconfig.node.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
EOF

cat > .gitignore <<'EOF'
node_modules/
dist/
src-tauri/target/
.env
*.log
EOF

cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#08080a" />
    <title>Lokajay's Movie Logger</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
EOF

cat > src/App.tsx <<'EOF'
import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";

type Page = "Home" | "Movie Logs" | "Watchlists" | "Lists" | "Profile";

const demoMovies = [
  { title: "Interstellar", year: "2014", type: "MOVIE", rating: "9.5 / 10", poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
  { title: "Oppenheimer", year: "2023", type: "MOVIE", rating: "8.5 / 10", poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { title: "Stranger Things", year: "2016", type: "TV", rating: "—", poster: "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg" },
  { title: "Dune: Part Two", year: "2024", type: "MOVIE", rating: "9.0 / 10", poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg" },
];

function App() {
  const [page, setPage] = useState<Page>("Home");
  const [dbStatus, setDbStatus] = useState("Starting local database...");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Database.load("sqlite:movie_logger.db")
      .then(async (db) => {
        await db.execute("PRAGMA foreign_keys = ON");
        setDbStatus("Local database ready");
      })
      .catch(() => setDbStatus("Database will initialize when the Tauri shell runs"));
  }, []);

  const filtered = demoMovies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setPage("Home")}>
          <span>Lokajay's</span><strong>MOVIE LOGGER</strong>
        </button>
        <nav>
          {(["Home", "Movie Logs", "Watchlists", "Lists"] as Page[]).map((item) => (
            <button key={item} className={page === item ? "nav active" : "nav"} onClick={() => setPage(item)}>
              {item}
            </button>
          ))}
        </nav>
        <button className="profile" onClick={() => setPage("Profile")}>Profile</button>
      </header>

      <main>
        {page === "Home" && (
          <>
            <section className="hero">
              <p className="eyebrow">YOUR CINEMA</p>
              <h1>Keep track of what<br /><em>you</em> watch.</h1>
              <p className="muted hero-copy">A private archive for your movies and TV shows — ratings, notes, watchlists, lists and tags. Nothing social.</p>
            </section>

            <section className="search">
              <span>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your library or find a movie / TV show..." />
              <kbd>ENTER</kbd>
            </section>

            {search && (
              <section className="results">
                <p className="eyebrow">YOUR LIBRARY</p>
                {filtered.length ? filtered.map((movie) => (
                  <button className="result" key={movie.title}><span>{movie.title}</span><small>{movie.type} · {movie.year} · {movie.rating}</small></button>
                )) : <p className="muted">No local matches. Online TMDB search will be added in the next build step.</p>}
              </section>
            )}

            <div className="actions">
              <button className="primary">+ Add to Movie Logs</button>
              <button>+ Add to Watchlist</button>
              <button>+ Add to List</button>
            </div>

            <section className="stats">
              <div><strong>127</strong><span>Logged</span></div>
              <div><strong>43</strong><span>Watchlist</span></div>
              <div><strong>8.4</strong><span>Avg Rating</span></div>
              <div><strong>12</strong><span>Lists</span></div>
            </section>

            <section className="section">
              <div className="section-head">
                <div><p className="eyebrow">WATCHLIST</p><h2>Waiting to be watched</h2></div>
                <button className="link" onClick={() => setPage("Watchlists")}>View all →</button>
              </div>
              <div className="watch-row">
                <div><span>Sci-Fi</span><strong>12</strong><small> titles</small></div>
                <div><span>Weekend</span><strong>8</strong><small> titles</small></div>
                <div><span>Telugu</span><strong>7</strong><small> titles</small></div>
              </div>
            </section>
          </>
        )}

        {page === "Movie Logs" && <Collection title="Movie Logs" subtitle="YOUR HISTORY" filtered={demoMovies.filter((m) => m.rating !== "—")} />}
        {page === "Watchlists" && <Collection title="Watchlists" subtitle="YOUR QUEUE" filtered={demoMovies} />}

        {page === "Lists" && (
          <section className="page-section">
            <div className="page-head"><div><p className="eyebrow">YOUR COLLECTIONS</p><h1>Lists</h1></div><button className="primary">+ New List</button></div>
            <div className="list-cards">
              {["Favorites", "Nolan", "Best Sci-Fi", "Telugu Cinema"].map((name, index) => (
                <button className="list-card" key={name}><small>{[24,12,18,31][index]} titles</small><h2>{name}</h2><span>{index === 0 ? "My personal favourites" : "Personal collection"}</span></button>
              ))}
            </div>
          </section>
        )}

        {page === "Profile" && (
          <section className="page-section">
            <div className="page-head"><div><p className="eyebrow">PERSONAL PROFILE</p><h1>Profile</h1></div><button>Settings</button></div>
            <div className="profile-card"><div className="avatar">L</div><div><h2>Lokajay</h2><p className="muted">Your private Movie Logger profile.</p><button>Edit Profile</button></div></div>
            <p className="db-status">{dbStatus}</p>
          </section>
        )}
      </main>
    </div>
  );
}

function Collection({ title, subtitle, filtered }: { title: string; subtitle: string; filtered: typeof demoMovies }) {
  return (
    <section className="page-section">
      <div className="page-head"><div><p className="eyebrow">{subtitle}</p><h1>{title}</h1></div><button className="primary">+ Add Title</button></div>
      <div className="toolbar"><input placeholder="Search..." /><button className="selected">All</button><button>Movies</button><button>TV Shows</button><button>Genre</button><span className="spacer" /><button>▦</button><button>☰</button></div>
      <div className="grid">{filtered.map((movie) => <article className="movie" key={movie.title}><div className="poster"><img src={movie.poster} alt="" /><span>{movie.type}</span></div><strong>{movie.title}</strong><small>{movie.year} · {movie.rating}</small></article>)}</div>
    </section>
  );
}

export default App;
EOF

cat > src/styles.css <<'EOF'
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f4f4f5;background:#08080a;font-synthesis:none;text-rendering:optimizeLegibility}*{box-sizing:border-box}body{margin:0;min-width:1100px;background:radial-gradient(circle at 20% 0,#1a1a1e 0,#08080a 38%)}button,input{font:inherit}button{border:1px solid #2b2b30;background:#151518;color:#e4e4e7;border-radius:10px;padding:10px 14px;cursor:pointer}button:hover{background:#1b1b20}.app{min-height:100vh}.topbar{height:78px;position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:38px;padding:0 42px;background:rgba(8,8,10,.92);backdrop-filter:blur(18px);border-bottom:1px solid #202024}.brand{border:0;background:transparent;padding:0;display:flex;flex-direction:column;align-items:flex-start;min-width:205px}.brand span{font-size:12px;color:#71717a;letter-spacing:.14em;text-transform:uppercase}.brand strong{font-size:18px;letter-spacing:-.03em}.topbar nav{display:flex;gap:4px}.nav{border:0;background:transparent;color:#85858d}.nav.active{background:#19191d;color:#fff}.profile{margin-left:auto}.main-content,main{width:min(1320px,calc(100vw - 84px));margin:auto}.hero{padding:70px 0 32px}.eyebrow{margin:0 0 10px;color:#66666f;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.hero h1,h1{margin:0;line-height:.98;letter-spacing:-.055em;font-size:58px}.hero em{font-family:Georgia,serif;font-weight:400}.muted{color:#92929a}.hero-copy{max-width:690px;font-size:16px;line-height:1.7;margin-top:20px}.search{margin-top:28px;padding:18px 20px;border:1px solid #2a2a2e;border-radius:15px;background:#111114;display:flex;align-items:center;gap:12px}.search span{font-size:23px;color:#71717a}.search input,.toolbar input{flex:1;border:0;outline:0;background:transparent;color:#fff}.search input::placeholder,.toolbar input::placeholder{color:#55555d}kbd{font-size:10px;color:#77777f;border:1px solid #303038;background:#19191c;border-radius:6px;padding:4px 7px}.actions{display:flex;gap:9px;margin-top:14px}.primary{background:#f4f4f5;color:#0b0b0d;border-color:#f4f4f5;font-weight:700}.results{margin-top:20px;padding:18px;border:1px solid #242429;border-radius:13px;background:#0f0f12}.result{display:flex;width:100%;justify-content:space-between;text-align:left;margin-top:7px}.result small{color:#71717a}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:40px}.stats div{background:#111114;border:1px solid #232329;border-radius:13px;padding:20px}.stats strong{display:block;font-size:29px;letter-spacing:-.04em}.stats span{font-size:13px;color:#888891}.section{margin-top:48px}.section-head,.page-head{display:flex;justify-content:space-between;align-items:end;gap:20px}.section-head h2{margin:0;font-size:28px;letter-spacing:-.035em}.link{border:0;background:transparent;color:#a1a1aa}.watch-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.watch-row div{background:#111114;border:1px solid #232329;border-radius:12px;padding:17px}.watch-row span{display:block;color:#d4d4d8;font-size:13px}.watch-row strong{font-size:28px;display:inline-block;margin-top:8px}.watch-row small{color:#71717a}.page-section{padding:54px 0}.page-head{margin-bottom:28px}.page-head h1{font-size:46px}.toolbar{display:flex;gap:7px;align-items:center;margin-bottom:24px;padding:10px;border:1px solid #242429;border-radius:12px;background:#101013}.toolbar input{min-width:200px;padding:8px}.toolbar button{padding:8px 10px}.toolbar .selected{background:#1d1d22;color:#fff}.spacer{flex:1}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.movie{min-width:0}.poster{position:relative;aspect-ratio:2/3;border:1px solid #27272b;border-radius:11px;overflow:hidden;background:#151518}.poster img{display:block;width:100%;height:100%;object-fit:cover}.poster span{position:absolute;top:9px;left:9px;font-size:9px;letter-spacing:.12em;background:rgba(0,0,0,.7);padding:5px 7px;border-radius:6px}.movie strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:10px}.movie small{display:block;color:#71717a;margin-top:3px}.list-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.list-card{min-height:170px;text-align:left;padding:22px}.list-card small{color:#71717a}.list-card h2{margin:28px 0 6px}.list-card span{color:#8d8d95}.profile-card{display:flex;gap:22px;align-items:center;max-width:700px;padding:28px;border:1px solid #242429;border-radius:15px;background:#111114}.avatar{width:96px;height:96px;border-radius:50%;display:grid;place-items:center;background:#1a1a1f;border:1px solid #303036;font-size:30px;font-weight:800}.profile-card h2{margin:0 0 8px}.db-status{margin-top:18px;font-size:12px;color:#66666f}@media(max-width:1180px){.topbar{padding:0 28px;gap:20px}.main-content,main{width:calc(100vw - 56px)}body{min-width:980px}}
EOF

cat > src-tauri/Cargo.toml <<'EOF'
[package]
name = "movie-logger"
version = "0.1.0"
description = "Lokajay's personal movie and TV logger"
authors = ["Lokajay"]
edition = "2021"

[lib]
name = "movie_logger_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2.5.0", features = ["sqlite"] }

[build-dependencies]
tauri-build = { version = "2", features = [] }
EOF

cat > src-tauri/build.rs <<'EOF'
fn main() {
    tauri_build::build()
}
EOF

cat > src-tauri/src/main.rs <<'EOF'
fn main() {
    movie_logger_lib::run()
}
EOF

cat > src-tauri/src/lib.rs <<'EOF'
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/001_initial_schema.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:movie_logger.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Movie Logger");
}
EOF

cat > src-tauri/tauri.conf.json <<'EOF'
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "productName": "Movie Logger",
  "version": "0.1.0",
  "identifier": "com.lokajay.movielogger",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Lokajay's Movie Logger",
        "width": 1440,
        "height": 900,
        "minWidth": 1100,
        "minHeight": 700
      }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "category": "Utility",
    "shortDescription": "Private personal movie and TV logger",
    "longDescription": "Lokajay's personal movie and TV logger.",
    "resources": []
  },
  "plugins": {
    "sql": { "preload": ["sqlite:movie_logger.db"] }
  }
}
EOF

cat > src-tauri/capabilities/default.json <<'EOF'
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for Movie Logger",
  "windows": ["main"],
  "permissions": ["core:default", "sql:default", "sql:allow-execute"]
}
EOF

cat > src-tauri/migrations/001_initial_schema.sql <<'EOF'
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
EOF

cat > README.md <<'EOF'
# Lokajay's Movie Logger

A private personal native desktop application for logging movies and TV shows, rating them, writing notes, tracking rewatches, managing watchlists, lists, genres and personal tags.

## V1 stack

- Tauri 2
- React
- TypeScript
- Vite
- SQLite
- TMDB API
- GitHub Codespaces
- GitHub Actions
- GitHub Releases

## Bootstrap

Run this from the repository root in your Codespace:

`bash bootstrap-v1.sh`

Then:

`npm install`

`npm run tauri:dev`

## Build

`npm run tauri:build`

The Windows installer will be produced by the Tauri build workflow/release process.
EOF

cat > .github/workflows/release.yml <<'EOF'
name: Build Windows App

on:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: "Movie Logger ${{ github.ref_name }}"
          releaseBody: "Windows installer for Lokajay's Movie Logger."
          releaseDraft: true
          prerelease: false
EOF

echo "== Foundation created =="
echo "Run: npm install"
echo "Then: npm run tauri:dev"
