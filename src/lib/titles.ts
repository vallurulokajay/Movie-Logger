import { getDatabase } from "./db";
import type { OmdbDetails } from "./omdb";

function clean(value: string | undefined): string | null {
  if (!value || value === "N/A") {
    return null;
  }

  return value.trim() || null;
}

function parseRuntime(runtime: string | undefined): number | null {
  const match = runtime?.match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : null;
}

function parseReleaseDate(value: string | undefined): string | null {
  const cleaned = clean(value);

  if (!cleaned) {
    return null;
  }

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseGenres(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean)
    .filter((genre) => genre !== "N/A");
}

function parseCast(value: string | undefined): string | null {
  const cast = (value ?? "")
    .split(",")
    .map((person) => person.trim())
    .filter(Boolean)
    .filter((person) => person !== "N/A")
    .slice(0, 5);

  return cast.length ? cast.join(", ") : null;
}

export async function addOmdbTitleToMovieLogs(
  details: OmdbDetails,
): Promise<number> {
  const db = await getDatabase();

  const mediaType = details.Type === "series" ? "tv" : "movie";
  const externalId = details.imdbID;

  const existing = await db.select<{ id: number }[]>(
    `SELECT id
     FROM titles
     WHERE external_source = $1
       AND external_id = $2
       AND media_type = $3
     LIMIT 1`,
    ["omdb", externalId, mediaType],
  );

  let titleId: number;

  if (existing.length > 0) {
    titleId = existing[0].id;
  } else {
    const releaseDate =
      mediaType === "movie"
        ? parseReleaseDate(details.Released)
        : null;

    const firstAirDate =
      mediaType === "tv"
        ? parseReleaseDate(details.Released)
        : null;

    const runtime = parseRuntime(details.Runtime);
    const genres = parseGenres(details.Genre);
    const mainCast = parseCast(details.Actors);

    await db.execute(
      `INSERT INTO titles (
        external_id,
        external_source,
        media_type,
        title,
        original_title,
        poster_path,
        backdrop_path,
        release_date,
        first_air_date,
        last_air_date,
        runtime,
        overview,
        original_language,
        director,
        main_cast
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15
      )`,
      [
        externalId,
        "omdb",
        mediaType,
        details.Title,
        null,
        clean(details.Poster),
        null,
        releaseDate,
        firstAirDate,
        null,
        runtime,
        clean(details.Plot),
        clean(details.Language),
        clean(details.Director),
        mainCast,
      ],
    );

    const inserted = await db.select<{ id: number }[]>(
      `SELECT id
       FROM titles
       WHERE external_source = $1
         AND external_id = $2
         AND media_type = $3
       LIMIT 1`,
      ["omdb", externalId, mediaType],
    );

    if (inserted.length === 0) {
      throw new Error("Could not create the title record.");
    }

    titleId = inserted[0].id;

    for (const genreName of genres) {
      await db.execute(
        `INSERT OR IGNORE INTO genres (
          name,
          is_custom
        )
        VALUES ($1, 0)`,
        [genreName],
      );

      const genre = await db.select<{ id: number }[]>(
        `SELECT id
         FROM genres
         WHERE name = $1
         LIMIT 1`,
        [genreName],
      );

      if (genre.length > 0) {
        await db.execute(
          `INSERT OR IGNORE INTO title_genres (
            title_id,
            genre_id
          )
          VALUES ($1, $2)`,
          [titleId, genre[0].id],
        );
      }
    }
  }

  const existingLog = await db.select<{ id: number }[]>(
    `SELECT id
     FROM title_logs
     WHERE title_id = $1
     LIMIT 1`,
    [titleId],
  );

  if (existingLog.length === 0) {
    await db.execute(
      `INSERT INTO title_logs (
        title_id,
        rating,
        notes,
        times_watched
      )
      VALUES ($1, NULL, NULL, 1)`,
      [titleId],
    );
  }

  return titleId;
}
