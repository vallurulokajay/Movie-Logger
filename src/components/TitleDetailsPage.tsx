
import { useEffect, useState } from "react";
import {
  addTitleToMovieLogs,
  getTitleDetails,
  incrementTitleWatched,
  updateTitleLog,
  type TitleDetails,
} from "../lib/db";

type Props = {
  titleId: number;
  onBack: () => void;
  onChanged: () => Promise<void>;
};

function yearOf(title: TitleDetails) {
  return (
    title.release_date ||
    title.first_air_date ||
    "—"
  ).slice(0, 4);
}

function dateOf(title: TitleDetails) {
  return (
    title.release_date ||
    title.first_air_date ||
    "—"
  );
}

function runtimeOf(minutes: number | null) {
  if (!minutes) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (hours === 0) {
    return `${remaining}m`;
  }

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
}

export default function TitleDetailsPage({
  titleId,
  onBack,
  onChanged,
}: Props) {
  const [title, setTitle] =
    useState<TitleDetails | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const [editingRating, setEditingRating] =
    useState(false);
  const [rating, setRating] =
    useState<number | null>(null);

  const [editingNotes, setEditingNotes] =
    useState(false);
  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const details =
        await getTitleDetails(titleId);

      if (!details) {
        setError("Title could not be found.");
        setTitle(null);
        return;
      }

      setTitle(details);
      setRating(details.rating);
      setNotes(details.notes ?? "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load title details.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [titleId]);

  async function ensureLogged() {
    if (!title) {
      return false;
    }

    if (title.times_watched > 0) {
      return true;
    }

    await addTitleToMovieLogs(title.id);
    return true;
  }

  async function saveRating() {
    if (!title) {
      return;
    }

    setSaving(true);

    try {
      await updateTitleLog(
        title.id,
        rating,
        title.notes,
      );

      await load();
      await onChanged();
      setEditingRating(false);
      setMessage("Rating saved.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not save rating.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!title) {
      return;
    }

    setSaving(true);

    try {
      await updateTitleLog(
        title.id,
        title.rating,
        notes,
      );

      await load();
      await onChanged();
      setEditingNotes(false);
      setMessage("Notes saved.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not save notes.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function rewatch() {
    if (!title) {
      return;
    }

    try {
      await ensureLogged();
      await incrementTitleWatched(title.id);
      await load();
      await onChanged();
      setMessage("Rewatch recorded.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not record rewatch.",
      );
    }
  }

  async function addToLogs() {
    if (!title) {
      return;
    }

    try {
      await addTitleToMovieLogs(title.id);
      await load();
      await onChanged();
      setMessage("Added to Movie Logs.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not add title to Movie Logs.",
      );
    }
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="title-details-empty">
          <p className="muted">
            Loading title...
          </p>
        </div>
      </section>
    );
  }

  if (!title) {
    return (
      <section className="page-section">
        <div className="title-details-empty">
          <h2>{error || "Title not found"}</h2>

          <button onClick={onBack}>
            Back
          </button>
        </div>
      </section>
    );
  }

  const genres =
    title.genres
      ?.split(",")
      .map((g) => g.trim())
      .filter(Boolean) ?? [];

  const cast =
    title.main_cast
      ?.split(",")
      .map((person) => person.trim())
      .filter(Boolean) ?? [];

  return (
    <section className="title-details-page">
      <div
        className="title-details-backdrop"
        style={
          title.backdrop_path
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(8,8,10,.98) 5%, rgba(8,8,10,.88) 48%, rgba(8,8,10,.5)), url("${title.backdrop_path}")`,
              }
            : undefined
        }
      />

      <div className="title-details-inner">
        <div className="title-details-toolbar">
          <button onClick={onBack}>
            ← Back
          </button>

          <span className="title-details-type">
            {title.media_type === "movie"
              ? "MOVIE"
              : "TV SHOW"}
          </span>
        </div>

        <div className="title-details-hero">
          <div className="title-details-poster">
            {title.poster_path ? (
              <img
                src={title.poster_path}
                alt={title.title}
              />
            ) : (
              <div>No Poster</div>
            )}
          </div>

          <div className="title-details-main">
            <p className="eyebrow">
              {title.media_type === "movie"
                ? "MOVIE"
                : "TV SHOW"}
            </p>

            <h1>{title.title}</h1>

            <div className="title-details-meta">
              <span>{yearOf(title)}</span>
              <span>{dateOf(title)}</span>

              {title.runtime !== null && (
                <span>
                  {runtimeOf(title.runtime)}
                </span>
              )}

              {title.original_language && (
                <span>
                  {title.original_language}
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="title-details-genres">
                {genres.map((genre) => (
                  <span key={genre}>
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {title.overview && (
              <p className="title-details-overview">
                {title.overview}
              </p>
            )}

            <div className="title-details-credits">
              {title.director && (
                <div>
                  <span>Director</span>
                  <strong>
                    {title.director}
                  </strong>
                </div>
              )}

              {cast.length > 0 && (
                <div>
                  <span>Cast</span>
                  <strong>
                    {cast.join(", ")}
                  </strong>
                </div>
              )}
            </div>

            <div className="title-details-actions">
              {title.times_watched === 0 ? (
                <button
                  className="primary"
                  onClick={() =>
                    void addToLogs()
                  }
                >
                  + Add to Movie Logs
                </button>
              ) : (
                <button
                  className="primary"
                  onClick={() =>
                    void rewatch()
                  }
                >
                  + Log a Rewatch
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="title-details-personal">
          <div className="personal-panel">
            <div className="personal-panel-head">
              <div>
                <p className="eyebrow">
                  YOUR RATING
                </p>

                <h2>
                  {title.rating !== null
                    ? `${title.rating} / 10`
                    : "Not rated"}
                </h2>
              </div>

              <button
                onClick={() =>
                  setEditingRating(
                    true,
                  )
                }
              >
                Edit
              </button>
            </div>

            {editingRating && (
              <div className="rating-editor">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={
                    rating ?? 1
                  }
                  onChange={(e) =>
                    setRating(
                      Number(
                        e.target.value,
                      ),
                    )
                  }
                />

                <strong>
                  {rating !== null
                    ? `${rating} / 10`
                    : "Not rated"}
                </strong>

                <div>
                  <button
                    className="primary"
                    disabled={saving}
                    onClick={() =>
                      void saveRating()
                    }
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setRating(
                        title.rating,
                      );
                      setEditingRating(
                        false,
                      );
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="personal-panel">
            <div className="personal-panel-head">
              <div>
                <p className="eyebrow">
                  TIMES WATCHED
                </p>

                <h2>
                  {title.times_watched}
                </h2>
              </div>
            </div>

            {title.times_watched > 1 && (
              <p className="muted">
                Watched{" "}
                {title.times_watched} times.
              </p>
            )}
          </div>

          <div className="personal-panel">
            <div className="personal-panel-head">
              <div>
                <p className="eyebrow">
                  NOTES
                </p>

                {!editingNotes && (
                  <h2>
                    {title.notes
                      ? "Your notes"
                      : "No notes yet"}
                  </h2>
                )}
              </div>

              <button
                onClick={() =>
                  setEditingNotes(
                    true,
                  )
                }
              >
                {title.notes
                  ? "Edit"
                  : "Add Notes"}
              </button>
            </div>

            {!editingNotes &&
              title.notes && (
                <p className="personal-notes">
                  {title.notes}
                </p>
              )}

            {editingNotes && (
              <div className="notes-editor">
                <textarea
                  autoFocus
                  rows={6}
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value,
                    )
                  }
                  placeholder="Write your notes..."
                />

                <div>
                  <button
                    className="primary"
                    disabled={saving}
                    onClick={() =>
                      void saveNotes()
                    }
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setNotes(
                        title.notes ??
                          "",
                      );
                      setEditingNotes(
                        false,
                      );
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="personal-panel">
            <div className="personal-panel-head">
              <div>
                <p className="eyebrow">
                  ORGANIZATION
                </p>

                <h2>
                  {title.lists ||
                    "No lists"}
                </h2>
              </div>
            </div>

            <p className="muted">
              {title.watchlisted
                ? "This title is in your watchlist."
                : "Not currently in a watchlist."}
            </p>
          </div>
        </div>

        {message && (
          <div className="action-message title-message">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
