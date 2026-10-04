import { useMemo, useState } from "react";
import type { MovieLog } from "../lib/db";

type Props = {
  logs: MovieLog[];
  onAddTitle: () => void;
};

type TypeFilter = "all" | "movie" | "tv";

function getYear(movie: MovieLog) {
  const value = movie.release_date || movie.first_air_date;
  return value ? value.slice(0, 4) : "—";
}

function getGenres(movie: MovieLog) {
  return movie.genres
    ? movie.genres
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean)
    : [];
}

export default function MovieLogsPage({
  logs,
  onAddTitle,
}: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("all");
  const [genreFilter, setGenreFilter] = useState<string | null>(
    null,
  );
  const [genreMenuOpen, setGenreMenuOpen] =
    useState(false);
  const [viewMode, setViewMode] =
    useState<"grid" | "list">("grid");

  const genres = useMemo(() => {
    const values = new Set<string>();

    for (const movie of logs) {
      for (const genre of getGenres(movie)) {
        values.add(genre);
      }
    }

    return Array.from(values).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logs.filter((movie) => {
      if (
        typeFilter !== "all" &&
        movie.media_type !== typeFilter
      ) {
        return false;
      }

      if (
        genreFilter &&
        !getGenres(movie).some(
          (genre) =>
            genre.toLowerCase() ===
            genreFilter.toLowerCase(),
        )
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        movie.title,
        movie.genres ?? "",
        movie.media_type === "movie"
          ? "movie"
          : "tv show",
        String(movie.rating ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
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
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search your movie logs..."
          />
        </div>

        <div className="movie-logs-filters">
          <button
            className={
              typeFilter === "all"
                ? "selected"
                : ""
            }
            onClick={() => setTypeFilter("all")}
          >
            All
          </button>

          <button
            className={
              typeFilter === "movie"
                ? "selected"
                : ""
            }
            onClick={() => setTypeFilter("movie")}
          >
            Movies
          </button>

          <button
            className={
              typeFilter === "tv"
                ? "selected"
                : ""
            }
            onClick={() => setTypeFilter("tv")}
          >
            TV Shows
          </button>

          <div className="genre-filter">
            <button
              className={
                genreFilter
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setGenreMenuOpen(
                  (open) => !open,
                )
              }
            >
              {genreFilter
                ? genreFilter
                : "Genre"}
              <span className="filter-chevron">
                ▾
              </span>
            </button>

            {genreMenuOpen && (
              <div className="genre-menu">
                <button
                  className={
                    genreFilter === null
                      ? "genre-option selected"
                      : "genre-option"
                  }
                  onClick={() => {
                    setGenreFilter(null);
                    setGenreMenuOpen(false);
                  }}
                >
                  All Genres
                </button>

                {genres.map((genre) => (
                  <button
                    className={
                      genreFilter === genre
                        ? "genre-option selected"
                        : "genre-option"
                    }
                    key={genre}
                    onClick={() => {
                      setGenreFilter(genre);
                      setGenreMenuOpen(false);
                    }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="toolbar-spacer" />

          <button
            className={
              viewMode === "grid"
                ? "view-toggle selected"
                : "view-toggle"
            }
            title="Grid view"
            onClick={() =>
              setViewMode("grid")
            }
          >
            ▦
          </button>

          <button
            className={
              viewMode === "list"
                ? "view-toggle selected"
                : "view-toggle"
            }
            title="List view"
            onClick={() =>
              setViewMode("list")
            }
          >
            ☰
          </button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-page movie-logs-empty">
          {logs.length === 0 ? (
            <>
              <h2>Nothing logged yet</h2>
              <p className="muted">
                Movies and TV shows you log will
                appear here.
              </p>
            </>
          ) : (
            <>
              <h2>No matching titles</h2>
              <p className="muted">
                Try another search or filter.
              </p>

              <button
                onClick={() => {
                  setQuery("");
                  setTypeFilter("all");
                  setGenreFilter(null);
                }}
              >
                Clear Filters
              </button>
            </>
          )}

          <button
            className="primary"
            onClick={onAddTitle}
          >
            + Add Title
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="movie-log-grid">
          {filteredLogs.map((movie) => {
            const genresForMovie =
              getGenres(movie);

            return (
              <article
                className="movie-log-card"
                key={movie.id}
              >
                <div className="movie-log-poster">
                  {movie.poster_path ? (
                    <img
                      src={movie.poster_path}
                      alt={movie.title}
                      loading="lazy"
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
                    <span>{getYear(movie)}</span>

                    {movie.rating !== null && (
                      <span className="movie-log-rating">
                        {movie.rating} / 10
                      </span>
                    )}
                  </div>

                  {genresForMovie.length > 0 && (
                    <small>
                      {genresForMovie.join(" · ")}
                    </small>
                  )}

                  {movie.times_watched > 1 && (
                    <div className="times-watched">
                      Watched {movie.times_watched} times
                    </div>
                  )}
                </div>
              </article>
            );
          })}
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

          {filteredLogs.map((movie) => (
            <article
              className="movie-log-list-row"
              key={movie.id}
            >
              <div className="movie-log-list-poster">
                {movie.poster_path ? (
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    loading="lazy"
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

              <span>{getYear(movie)}</span>

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
        {filteredLogs.length}{" "}
        {filteredLogs.length === 1
          ? "title"
          : "titles"}
      </p>
    </section>
  );
}
