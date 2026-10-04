
import { useEffect, useState } from "react";
import {
  getHomeAnalytics,
  type HomeAnalytics,
} from "../lib/db";

export default function AnalyticsPanel() {
  const [analytics, setAnalytics] =
    useState<HomeAnalytics | null>(null);

  useEffect(() => {
    void getHomeAnalytics()
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, []);

  if (!analytics) {
    return null;
  }

  return (
    <section className="home-analytics">
      <div className="section-head">
        <div>
          <p className="eyebrow">
            YOUR CINEMA
          </p>

          <h2>Analytics</h2>
        </div>
      </div>

      <div className="analytics-stat-grid">
        <div className="analytics-stat">
          <span>Movies</span>
          <strong>{analytics.movies}</strong>
        </div>

        <div className="analytics-stat">
          <span>TV Shows</span>
          <strong>{analytics.tvShows}</strong>
        </div>

        <div className="analytics-stat">
          <span>Total Times Watched</span>
          <strong>
            {analytics.totalTimesWatched}
          </strong>
        </div>

        <div className="analytics-stat">
          <span>Watched Multiple Times</span>
          <strong>
            {analytics.repeatedTitles}
          </strong>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <p className="eyebrow">
            HIGHEST RATED
          </p>

          {analytics.highestRated ? (
            <>
              <h3>
                {analytics.highestRated.title}
              </h3>

              <strong className="analytics-rating">
                {analytics.highestRated.rating} / 10
              </strong>
            </>
          ) : (
            <p className="muted">
              No ratings yet.
            </p>
          )}
        </div>

        <div className="analytics-card">
          <p className="eyebrow">
            LOWEST RATED
          </p>

          {analytics.lowestRated ? (
            <>
              <h3>
                {analytics.lowestRated.title}
              </h3>

              <strong className="analytics-rating">
                {analytics.lowestRated.rating} / 10
              </strong>
            </>
          ) : (
            <p className="muted">
              No ratings yet.
            </p>
          )}
        </div>

        <div className="analytics-card">
          <p className="eyebrow">
            RATING DISTRIBUTION
          </p>

          <div className="rating-distribution">
            {analytics.ratingDistribution.map(
              (item) => (
                <div
                  className="rating-row"
                  key={item.rating}
                >
                  <span>
                    {item.rating}
                  </span>

                  <div className="rating-bar">
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          item.count * 12,
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>{item.count}</strong>
                </div>
              ),
            )}

            {analytics.ratingDistribution
              .length === 0 && (
              <p className="muted">
                Rate your first title to see
                the distribution.
              </p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <p className="eyebrow">
            MOST-USED GENRES
          </p>

          {analytics.genres.length === 0 ? (
            <p className="muted">
              Genres will appear as you log
              titles.
            </p>
          ) : (
            <div className="genre-analytics">
              {analytics.genres.map(
                (genre) => (
                  <div
                    className="genre-analytic-row"
                    key={genre.genre}
                  >
                    <span>{genre.genre}</span>

                    <small>
                      {genre.titles}{" "}
                      {genre.titles === 1
                        ? "title"
                        : "titles"}
                    </small>

                    <strong>
                      {genre.averageRating !==
                      null
                        ? `${genre.averageRating} / 10`
                        : "—"}
                    </strong>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
