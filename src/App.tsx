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
              <p className="hero-brand-small">LOKAJAY'S</p>
              <h1 className="hero-brand-title">MOVIE LOGGER</h1>
              <p className="hero-tagline">Stories on Record</p>
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
              <div><strong>0</strong><span>Logged</span></div>
              <div><strong>0</strong><span>Watchlist</span></div>
              <div><strong>—</strong><span>Avg Rating</span></div>
              <div><strong>0</strong><span>Lists</span></div>
            </section>

            <section className="section">
              <div className="section-head">
                <div><p className="eyebrow">WATCHLIST</p><h2>Waiting to be watched</h2></div>
                <button className="link" onClick={() => setPage("Watchlists")}>View all →</button>
              </div>
              <div className="empty-watchlist">
                <p className="muted">Nothing here yet. Add a movie or TV show to start your watchlist.</p>
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
