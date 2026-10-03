import type { OmdbDetails } from "../lib/omdb";

type Props = {
  details: OmdbDetails;
  onClose: () => void;
  onAddToMovieLogs: () => void;
  adding: boolean;
};

function clean(value: string | undefined) {
  return value && value !== "N/A" ? value : "—";
}

export default function TitlePreview({
  details,
  onClose,
  onAddToMovieLogs,
  adding,
}: Props) {
  const isSeries = details.Type === "series";

  return (
    <div className="preview-backdrop" onClick={onClose}>
      <section
        className="preview-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="preview-close" onClick={onClose}>
          ×
        </button>

        <div className="preview-content">
          <div className="preview-poster">
            {details.Poster !== "N/A" ? (
              <img src={details.Poster} alt={details.Title} />
            ) : (
              <div className="preview-poster-empty">
                No Poster
              </div>
            )}
          </div>

          <div className="preview-info">
            <p className="eyebrow">
              {isSeries ? "TV SHOW" : "MOVIE"}
            </p>

            <h2>{details.Title}</h2>

            <p className="preview-meta">
              {clean(details.Year)}
              {" · "}
              {clean(details.Runtime)}
              {" · "}
              {clean(details.Language)}
            </p>

            <div className="preview-tags">
              {clean(details.Genre)
                .split(",")
                .map((genre) => genre.trim())
                .filter(Boolean)
                .map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
            </div>

            <p className="preview-plot">
              {clean(details.Plot)}
            </p>

            <div className="preview-details">
              <div>
                <span>Director</span>
                <strong>{clean(details.Director)}</strong>
              </div>

              <div>
                <span>Cast</span>
                <strong>{clean(details.Actors)}</strong>
              </div>

              {isSeries && (
                <div>
                  <span>Seasons</span>
                  <strong>
                    {clean(details.totalSeasons)}
                  </strong>
                </div>
              )}
            </div>

            <div className="preview-actions">
              <button
                className="primary"
                onClick={onAddToMovieLogs}
                disabled={adding}
              >
                {adding
                  ? "Adding..."
                  : "+ Add to Movie Logs"}
              </button>

              <button>
                + Add to Watchlist
              </button>

              <button>
                + Add to List
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}