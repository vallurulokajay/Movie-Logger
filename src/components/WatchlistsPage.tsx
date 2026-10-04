
import { useEffect, useMemo, useState } from "react";
import {
  createWatchlist,
  deleteWatchlist,
  ensureAllMoviesWatchlist,
  getWatchlistTitles,
  getWatchlists,
  markTitleWatched,
  removeTitleFromWatchlist,
  type LocalTitle,
  type Watchlist,
} from "../lib/db";

type Props = {
  onAddTitle: () => void;
  onChanged: () => Promise<void>;
  onOpenTitle: (titleId: number) => void;
};

function yearOf(movie: LocalTitle) {
  return (
    movie.release_date ||
    movie.first_air_date ||
    "—"
  ).slice(0, 4);
}

export default function WatchlistsPage({
  onAddTitle,
  onChanged,
  onOpenTitle,
}: Props) {
  const [watchlists, setWatchlists] =
    useState<Watchlist[]>([]);
  const [selectedId, setSelectedId] =
    useState<number | null>(null);
  const [titles, setTitles] =
    useState<LocalTitle[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [creating, setCreating] =
    useState(false);
  const [newName, setNewName] =
    useState("");
  const [message, setMessage] =
    useState("");

  async function load() {
    setLoading(true);

    try {
      const lists = await getWatchlists();
      setWatchlists(lists);

      const allMovies =
        await ensureAllMoviesWatchlist();

      const activeId =
        selectedId &&
        lists.some((list) => list.id === selectedId)
          ? selectedId
          : allMovies;

      setSelectedId(activeId);

      const items =
        await getWatchlistTitles(activeId);

      setTitles(items);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load watchlists.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function selectWatchlist(id: number) {
    setSelectedId(id);
    setMessage("");

    try {
      setTitles(
        await getWatchlistTitles(id),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load watchlist.",
      );
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      return;
    }

    try {
      const id =
        await createWatchlist(newName);

      setNewName("");
      setCreating(false);
      setMessage("Watchlist created.");

      await load();
      await selectWatchlist(id);
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create watchlist.",
      );
    }
  }

  async function handleDelete(
    watchlist: Watchlist,
  ) {
    if (
      !window.confirm(
        `Delete "${watchlist.name}"?`,
      )
    ) {
      return;
    }

    try {
      await deleteWatchlist(watchlist.id);
      setMessage("Watchlist deleted.");
      await load();
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete watchlist.",
      );
    }
  }

  async function handleRemove(
    titleId: number,
  ) {
    if (selectedId === null) {
      return;
    }

    try {
      await removeTitleFromWatchlist(
        titleId,
        selectedId,
      );

      setTitles(
        await getWatchlistTitles(selectedId),
      );

      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove title.",
      );
    }
  }

  async function handleWatched(
    titleId: number,
  ) {
    try {
      await markTitleWatched(titleId);

      setMessage(
        "Marked as watched and removed from watchlists.",
      );

      if (selectedId !== null) {
        setTitles(
          await getWatchlistTitles(selectedId),
        );
      }

      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not mark title as watched.",
      );
    }
  }

  const activeWatchlist = useMemo(
    () =>
      watchlists.find(
        (list) => list.id === selectedId,
      ),
    [watchlists, selectedId],
  );

  return (
    <section className="page-section">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            YOUR QUEUE
          </p>
          <h1>Watchlists</h1>
        </div>

        <button
          className="primary"
          onClick={onAddTitle}
        >
          + Add Title
        </button>
      </div>

      <div className="watchlist-tabs">
        {watchlists.map((watchlist) => (
          <div
            className={
              selectedId === watchlist.id
                ? "watchlist-tab active"
                : "watchlist-tab"
            }
            key={watchlist.id}
          >
            <button
              onClick={() =>
                void selectWatchlist(
                  watchlist.id,
                )
              }
            >
              {watchlist.name}
              <span>{watchlist.count}</span>
            </button>

            {watchlist.name !== "All Movies" && (
              <button
                className="watchlist-tab-delete"
                title={`Delete ${watchlist.name}`}
                onClick={() =>
                  void handleDelete(
                    watchlist,
                  )
                }
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          className="watchlist-new"
          onClick={() => setCreating(true)}
        >
          + New
        </button>
      </div>

      {creating && (
        <div className="watchlist-create">
          <input
            autoFocus
            value={newName}
            onChange={(event) =>
              setNewName(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCreate();
              }

              if (event.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            placeholder="Watchlist name..."
          />

          <button
            className="primary"
            onClick={() =>
              void handleCreate()
            }
          >
            Create
          </button>

          <button
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {message && (
        <div className="watchlist-message">
          {message}
        </div>
      )}

      <div className="watchlist-heading">
        <div>
          <p className="eyebrow">
            {activeWatchlist?.name ||
              "WATCHLIST"}
          </p>

          <h2>
            {titles.length}{" "}
            {titles.length === 1
              ? "title"
              : "titles"}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="movie-logs-empty">
          <p className="muted">
            Loading watchlist...
          </p>
        </div>
      ) : titles.length === 0 ? (
        <div className="movie-logs-empty">
          <h2>Nothing waiting here</h2>
          <p className="muted">
            Add a movie or TV show to this
            watchlist.
          </p>

          <button
            className="primary"
            onClick={onAddTitle}
          >
            + Add Title
          </button>
        </div>
      ) : (
        <div className="watchlist-grid">
          {titles.map((movie) => (
            <article
              className="watchlist-card clickable"
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
              <div className="watchlist-poster">
                {movie.poster_path ? (
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                  />
                ) : (
                  <div>
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

              <strong>{movie.title}</strong>

              <small>
                {yearOf(movie)}
              </small>

              <div className="watchlist-card-actions">
                <button
                  className="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleWatched(
                      movie.id,
                    );
                  }}
                >
                  Mark as Watched
                </button>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemove(
                      movie.id,
                    );
                  }}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
