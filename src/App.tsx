import { useEffect, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import {
  getHomeStats,
  getMovieLogs,
  searchLocalTitles,
  type LocalTitle,
  type MovieLog,
} from "./lib/db";
import {
  getOmdbDetails,
  searchOmdb,
  type OmdbDetails,
  type OmdbSearchResult,
} from "./lib/omdb";
import { addOmdbTitleToMovieLogs } from "./lib/titles";
import {
  getOmdbApiKey,
  removeOmdbApiKey,
  saveOmdbApiKey,
} from "./lib/settings";
import TitlePreview from "./components/TitlePreview";

type Page =
  | "Home"
  | "Movie Logs"
  | "Watchlists"
  | "Lists"
  | "Profile"
  | "Settings";

function App() {
  const [page, setPage] = useState<Page>("Home");
  const [dbStatus, setDbStatus] = useState("Starting local database...");
  const [search, setSearch] = useState("");

  const [movieLogs, setMovieLogs] = useState<MovieLog[]>([]);

  const [stats, setStats] = useState({
    logged: 0,
    watchlist: 0,
    lists: 0,
    averageRating: null as number | null,
  });

  const [localResults, setLocalResults] = useState<LocalTitle[]>([]);
  const [onlineResults, setOnlineResults] = useState<OmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOnlineTitle, setSelectedOnlineTitle] =
    useState<OmdbDetails | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] =
    useState<string | null>(null);
  const [addingToLogs, setAddingToLogs] = useState(false);
const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    Database.load("sqlite:movie_logger.db")
      .then(async (db) => {
        await db.execute("PRAGMA foreign_keys = ON");
        setDbStatus("Local database ready");

        const homeStats = await getHomeStats();
        setStats(homeStats);

        const logs = await getMovieLogs();
        setMovieLogs(logs);
      })
      .catch(() => {
        setDbStatus(
          "Database will initialize when the Tauri shell runs",
        );
      });
  }, []);

  async function handleSearch() {
    const query = search.trim();

    if (!query) {
      setLocalResults([]);
      setOnlineResults([]);
      setSearchError("");
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setSearchError("");
    setOnlineResults([]);
    setHasSearched(true);

    try {
      const local = await searchLocalTitles(query);
      setLocalResults(local);

      if (local.length === 0) {
        const online = await searchOmdb(query);
        setOnlineResults(online);
      }
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Search failed. Please try again.",
      );
      setLocalResults([]);
      setOnlineResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleOnlineTitleClick(imdbId: string) {
    setLoadingDetailsId(imdbId);
    setSearchError("");

    try {
      const details = await getOmdbDetails(imdbId);
      setSelectedOnlineTitle(details);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Could not load title details.",
      );
    } finally {
      setLoadingDetailsId(null);
    }
  }

  function clearSearch() {
    setSearch("");
    setLocalResults([]);
    setOnlineResults([]);
    setSearchError("");
    setHasSearched(false);
    setSelectedOnlineTitle(null);
    setLoadingDetailsId(null);
  }

  async function handleAddToMovieLogs() {
    if (!selectedOnlineTitle) {
      return;
    }

    setAddingToLogs(true);
    setActionMessage("");

    try {
      await addOmdbTitleToMovieLogs(selectedOnlineTitle);

      const homeStats = await getHomeStats();
      setStats(homeStats);

      const logs = await getMovieLogs();
      setMovieLogs(logs);

      setActionMessage(
        `${selectedOnlineTitle.Title} was added to Movie Logs.`,
      );

      setSelectedOnlineTitle(null);
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Could not add the title to Movie Logs.",
      );
    } finally {
      setAddingToLogs(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            clearSearch();
            setPage("Home");
          }}
        >
          <span>Lokajay's</span>
          <strong>MOVIE LOGGER</strong>
        </button>

        <nav>
          {(["Home", "Movie Logs", "Watchlists", "Lists"] as Page[]).map(
            (item) => (
              <button
                key={item}
                className={
                  page === item ? "nav active" : "nav"
                }
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ),
          )}
        </nav>

        <button
          className="profile"
          onClick={() => setPage("Profile")}
        >
          Profile
        </button>
      </header>

      <main>
        {page === "Home" && (
          <>
            <section className="hero">
              <p className="hero-brand-small">LOKAJAY'S</p>
              <h1 className="hero-brand-title">
                MOVIE LOGGER
              </h1>
              <p className="hero-tagline">
                Stories on Record
              </p>
            </section>

            <section className="search">
              <span>⌕</span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleSearch();
                  }
                }}
                placeholder="Search your library or find a movie / TV show..."
              />

              <button
                className="search-submit"
                onClick={() => void handleSearch()}
              >
                ENTER
              </button>
            </section>

            {hasSearched && (
              <section className="results">
                <p className="eyebrow">
                  {localResults.length > 0
                    ? "YOUR LIBRARY"
                    : "ONLINE RESULTS"}
                </p>

                {searching && (
                  <p className="muted">
                    Searching...
                  </p>
                )}

                {!searching && searchError && (
                  <p className="muted">
                    {searchError}
                  </p>
                )}

                {!searching &&
                  localResults.length > 0 &&
                  localResults.map((movie) => (
                    <button
                      className="result"
                      key={movie.id}
                    >
                      <span>{movie.title}</span>

                      <small>
                        {movie.media_type === "movie"
                          ? "MOVIE"
                          : "TV SHOW"}{" "}
                        ·{" "}
                        {(
                          movie.release_date ||
                          movie.first_air_date ||
                          "—"
                        ).slice(0, 4)}
                      </small>
                    </button>
                  ))}

                {!searching &&
                  localResults.length === 0 &&
                  onlineResults.length > 0 &&
                  onlineResults.map((movie) => (
                    <button
                      className="result"
                      key={movie.imdbID}
                      onClick={() =>
                        void handleOnlineTitleClick(movie.imdbID)
                      }
                      disabled={loadingDetailsId === movie.imdbID}
                    >
                      <span>
                        {loadingDetailsId === movie.imdbID
                          ? "Loading..."
                          : movie.Title}
                      </span>

                      <small>
                        {movie.Type === "series"
                          ? "TV SHOW"
                          : "MOVIE"}{" "}
                        · {movie.Year}
                      </small>
                    </button>
                  ))}

                {!searching &&
                  !searchError &&
                  localResults.length === 0 &&
                  onlineResults.length === 0 && (
                    <p className="muted">
                      No results found.
                    </p>
                  )}
              </section>
            )}

            <div className="actions">
              <button className="primary">
                + Add to Movie Logs
              </button>

              <button>
                + Add to Watchlist
              </button>

              <button>
                + Add to List
              </button>
            </div>

            <section className="stats">
              <div>
                <strong>{stats.logged}</strong>
                <span>Logged</span>
              </div>

              <div>
                <strong>{stats.watchlist}</strong>
                <span>Watchlist</span>
              </div>

              <div>
                <strong>
                  {stats.averageRating !== null
                    ? stats.averageRating
                    : "—"}
                </strong>
                <span>Avg Rating</span>
              </div>

              <div>
                <strong>{stats.lists}</strong>
                <span>Lists</span>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">
                    WATCHLIST
                  </p>

                  <h2>
                    Waiting to be watched
                  </h2>
                </div>

                <button
                  className="link"
                  onClick={() => setPage("Watchlists")}
                >
                  View all →
                </button>
              </div>

              <div className="empty-watchlist">
                <p className="muted">
                  Nothing here yet. Add a movie or TV show
                  to start your watchlist.
                </p>
              </div>
            </section>
          </>
        )}

        {page === "Movie Logs" && (
          <Collection
            title="Movie Logs"
            subtitle="YOUR HISTORY"
            filtered={movieLogs}
          />
        )}

        {page === "Watchlists" && (
          <Collection
            title="Watchlists"
            subtitle="YOUR QUEUE"
            filtered={[]}
          />
        )}

        {page === "Lists" && (
          <section className="page-section">
            <div className="page-head">
              <div>
                <p className="eyebrow">
                  YOUR COLLECTIONS
                </p>

                <h1>Lists</h1>
              </div>

              <button className="primary">
                + New List
              </button>
            </div>

            <div className="empty-page">
              <h2>No lists yet</h2>

              <p className="muted">
                Create your first personal list when
                you are ready.
              </p>

              <button className="primary">
                + New List
              </button>
            </div>
          </section>
        )}

              {page === "Profile" && (
          <section className="page-section">
            <div className="page-head">
              <div>
                <p className="eyebrow">
                  PERSONAL PROFILE
                </p>

                <h1>Profile</h1>
              </div>

              <button
                onClick={() => setPage("Settings")}
              >
                Settings
              </button>
            </div>

            <div className="profile-card">
              <div className="avatar">L</div>

              <div>
                <h2>Lokajay</h2>

                <p className="muted">
                  Your private Movie Logger profile.
                </p>

                <button>
                  Edit Profile
                </button>
              </div>
            </div>

            <p className="db-status">
              {dbStatus}
            </p>
          </section>
        )}

        {page === "Settings" && (
          <SettingsPage
            onBack={() => setPage("Profile")}
          />
        )}
      </main>

      {selectedOnlineTitle && (
  <TitlePreview
    details={selectedOnlineTitle}
    onClose={() => setSelectedOnlineTitle(null)}
    onAddToMovieLogs={() => void handleAddToMovieLogs()}
    adding={addingToLogs}
  />
)}
{actionMessage && (
  <div className="action-message">
    {actionMessage}
  </div>
)}
    </div>
  );
}

function Collection({
  title,
  subtitle,
  filtered,
}: {
  title: string;
  subtitle: string;
  filtered: LocalTitle[];
}) {
  return (
    <section className="page-section">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            {subtitle}
          </p>

          <h1>{title}</h1>
        </div>

        <button className="primary">
          + Add Title
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="Search..." />

        <button className="selected">
          All
        </button>

        <button>
          Movies
        </button>

        <button>
          TV Shows
        </button>

        <button>
          Genre
        </button>

        <span className="spacer" />

        <button>▦</button>
        <button>☰</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-page">
          <h2>
            {title === "Movie Logs"
              ? "Nothing logged yet"
              : "Your watchlist is empty"}
          </h2>

          <p className="muted">
            {title === "Movie Logs"
              ? "Movies and TV shows you log will appear here."
              : "Movies and TV shows you add to your watchlist will appear here."}
          </p>

          <button className="primary">
            + Add Title
          </button>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((movie) => (
            <article
              className="movie"
              key={movie.id}
            >
              <div className="poster">
                <span>
                  {movie.media_type === "movie"
                    ? "MOVIE"
                    : "TV SHOW"}
                </span>
              </div>

              <strong>
                {movie.title}
              </strong>

              <small>
                {(
                  movie.release_date ||
                  movie.first_air_date ||
                  "—"
                ).slice(0, 4)}
              </small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getOmdbApiKey()
      .then((key) => {
        setApiKey(key);
        setSavedKey(Boolean(key));
      })
      .catch(() => {
        setStatus("Could not load settings.");
      });
  }, []);

  async function handleSave() {
    try {
      await saveOmdbApiKey(apiKey);

      setSavedKey(Boolean(apiKey.trim()));

      setStatus(
        apiKey.trim()
          ? "OMDb API key saved locally."
          : "OMDb API key removed.",
      );
    } catch {
      setStatus(
        "Could not save the OMDb API key.",
      );
    }
  }

  async function handleRemove() {
    try {
      await removeOmdbApiKey();

      setApiKey("");
      setSavedKey(false);
      setStatus(
        "OMDb API key removed.",
      );
    } catch {
      setStatus(
        "Could not remove the OMDb API key.",
      );
    }
  }

  return (
    <section className="page-section">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            APPLICATION
          </p>

          <h1>Settings</h1>
        </div>

        <button onClick={onBack}>
          Back
        </button>
      </div>

      <div className="settings-card">
        <div>
          <p className="eyebrow">
            METADATA PROVIDER
          </p>

          <h2>OMDb API</h2>

          <p className="muted">
            Used to search for movies and TV shows
            and retrieve their metadata.
          </p>
        </div>

        <label className="settings-label">
          OMDb API Key

          <input
            type="password"
            value={apiKey}
            onChange={(e) =>
              setApiKey(e.target.value)
            }
            placeholder="Enter your OMDb API key"
          />
        </label>

        <div className="settings-actions">
          <button
            className="primary"
            onClick={() => void handleSave()}
          >
            Save Key
          </button>

          {savedKey && (
            <button
              onClick={() => void handleRemove()}
            >
              Remove Key
            </button>
          )}
        </div>

        {status && (
          <p className="settings-status">
            {status}
          </p>
        )}
      </div>
    </section>
  );
}

export default App;
