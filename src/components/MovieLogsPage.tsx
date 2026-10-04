import { useMemo, useState } from "react";
import type { MovieLog } from "../lib/db";

type Props = {
  logs: MovieLog[];
  onAddTitle: () => void;
  onOpenTitle: (titleId: number) => void;
};

type TypeFilter = "all" | "movie" | "tv";

function yearOf(movie: MovieLog) {
  return (movie.release_date || movie.first_air_date || "—").slice(0, 4);
}

function genresOf(movie: MovieLog) {
  return movie.genres
    ? movie.genres.split(",").map((g) => g.trim()).filter(Boolean)
    : [];
}

export default function MovieLogsPage({
  logs,
  onAddTitle,
  onOpenTitle,
}: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("all");
  const [genreFilter, setGenreFilter] =
    useState("All Genres");
  const [viewMode, setViewMode] =
    useState<"grid" | "list">("grid");

  const genres = useMemo(() => {
    const values = new Set<string>();

    for (const movie of logs) {
      for (const genre of genresOf(movie)) {
        values.add(genre);
      }
    }

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return logs.filter((movie) => {
      if (
        typeFilter !== "all" &&
        movie.media_type !== typeFilter
      ) {
        return false;
      }

      if (
        genreFilter !== "All Genres" &&
        !genresOf(movie).some(
          (genre) => genre === genreFilter,
        )
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [
        movie.title,
        movie.genres ?? "",
        movie.media_type === "movie"
          ? "movie"
          : "tv show",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [logs, query, typeFilter, genreFilter]);

  return (
    <section className="page-section">
      <div className="page-head">
        <div>
          <p className="eyebrow">YOUR HISTORY</p>
          <h1>Movie Logs</h1>
        </div>

        <button
          className="primary"
          onClick={onAddTitle}
        >
          + Add Title
        </button>
      </div>

      <div className="movie-logs-toolbar">
        <div className="movie-logs-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your movie logs..."
          />
        </div>

        <div className="movie-logs-filters">
          <button
            className={
              typeFilter === "all" ? "selected" : ""
            }
            onClick={() => setTypeFilter("all")}
          >
            All
          </button>

          <button
            className={
              typeFilter === "movie" ? "selected" : ""
            }
            onClick={() => setTypeFilter("movie")}
          >
            Movies
          </button>

          <button
            className={
              typeFilter === "tv" ? "selected" : ""
            }
            onClick={() => setTypeFilter("tv")}
          >
            TV Shows
          </button>

          <select
            value={genreFilter}
            onChange={(e) =>
              setGenreFilter(e.target.value)
            }
          >
            <option>All Genres</option>
            {genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>

          <span className="toolbar-spacer" />

          <button
            className={
              viewMode === "grid"
                ? "view-toggle selected"
                : "view-toggle"
            }
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            ▦
          </button>

          <button
            className={
              viewMode === "list"
                ? "view-toggle selected"
                : "view-toggle"
            }
            onClick={() => setViewMode("list")}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="movie-logs-empty">
          <h2>
            {logs.length === 0
              ? "Nothing logged yet"
              : "No matching titles"}
          </h2>

          <p className="muted">
            {logs.length === 0
              ? "Movies and TV shows you log will appear here."
              : "Try another search or filter."}
          </p>

          {logs.length === 0 ? (
            <button
              className="primary"
              onClick={onAddTitle}
            >
              + Add Title
            </button>
          ) : (
            <button
              onClick={() => {
                setQuery("");
                setTypeFilter("all");
                setGenreFilter("All Genres");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="movie-log-grid">
          {filtered.map((movie) => (
            <article
              className="movie-log-card"
              key={movie.id}
            >
              <div className="movie-log-poster">
                {movie.poster_path ? (
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                  />
                ) : (
                  <div className="movie-log-poster-empty">
                    {movie.media_type === "movie"
                      ? "MOVIE"
                      : "TV SHOW"}
                  </div>
                )}

                <span>
                  {movie.media_type === "movie"
                    ? "MOVIE"
                    : "TV SHOW"}
                </span>
              </div>

              <div className="movie-log-info">
                <strong>{movie.title}</strong>

                <div className="movie-log-subline">
                  <span>{yearOf(movie)}</span>

                  {movie.rating !== null && (
                    <span className="movie-log-rating">
                      {movie.rating} / 10
                    </span>
                  )}
                </div>

                {movie.genres && (
                  <small>{movie.genres}</small>
                )}

                {movie.times_watched > 1 && (
                  <div className="times-watched">
                    Watched {movie.times_watched} times
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="movie-log-list">
          <div className="movie-log-list-header">
            <span>Poster</span>
            <span>Title</span>
            <span>Type</span>
            <span>Year</span>
            <span>Genre</span>
            <span>Rating</span>
          </div>

          {filtered.map((movie) => (
            <article
              className="movie-log-list-row clickable"
              key={movie.id}
              onClick={() =>
                onOpenTitle(movie.id)
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onOpenTitle(movie.id);
                }
              }}
            >
              <div className="movie-log-list-poster">
                {movie.poster_path ? (
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                  />
                ) : (
                  <span>
                    {movie.media_type === "movie"
                      ? "M"
                      : "TV"}
                  </span>
                )}
              </div>

              <strong>{movie.title}</strong>

              <span>
                {movie.media_type === "movie"
                  ? "Movie"
                  : "TV Show"}
              </span>

              <span>{yearOf(movie)}</span>

              <span>
                {movie.genres || "—"}
              </span>

              <span>
                {movie.rating !== null
                  ? `${movie.rating} / 10`
                  : "—"}
              </span>
            </article>
          ))}
        </div>
      )}

      <p className="movie-log-count">
        {filtered.length}{" "}
        {filtered.length === 1 ? "title" : "titles"}
      </p>
    </section>
  );
}
