import Database from "@tauri-apps/plugin-sql";

let database: Database | null = null;

export async function getDatabase() {
  if (!database) {
    database = await Database.load("sqlite:movie_logger.db");
    await database.execute("PRAGMA foreign_keys = ON");
  }

  return database;
}

export async function getHomeStats() {
  const db = await getDatabase();

  const logged = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM title_logs"
  );

  const watchlist = await db.select<{ count: number }[]>(
    `SELECT COUNT(DISTINCT title_id) as count
     FROM watchlist_items`
  );

  const lists = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM lists"
  );

  const average = await db.select<{ average: number | null }[]>(
    `SELECT AVG(rating) as average
     FROM title_logs
     WHERE rating IS NOT NULL`
  );

  return {
    logged: logged[0]?.count ?? 0,
    watchlist: watchlist[0]?.count ?? 0,
    lists: lists[0]?.count ?? 0,
    averageRating:
      average[0]?.average != null
        ? Number(average[0].average.toFixed(1))
        : null,
  };
}

export type LocalTitle = {
  id: number;
  title: string;
  media_type: "movie" | "tv";
  release_date: string | null;
  first_air_date: string | null;
  poster_path: string | null;
};

export type MovieLog = LocalTitle & {
  rating: number | null;
  notes: string | null;
  times_watched: number;
  genres: string | null;
};

export async function searchLocalTitles(query: string): Promise<LocalTitle[]> {
  const db = await getDatabase();

  return await db.select<LocalTitle[]>(
    `SELECT
       id,
       title,
       media_type,
       release_date,
       first_air_date,
       poster_path
     FROM titles
     WHERE title LIKE $1
     ORDER BY title COLLATE NOCASE
     LIMIT 20`,
    [`%${query}%`],
  );
}


export async function getMovieLogs(): Promise<MovieLog[]> {
  const db = await getDatabase();

  return db.select<MovieLog[]>(
    `SELECT
       t.id,
       t.title,
       t.media_type,
       t.release_date,
       t.first_air_date,
       t.poster_path,
       l.rating,
       l.notes,
       l.times_watched,
       GROUP_CONCAT(DISTINCT g.name) AS genres
     FROM titles t
     JOIN title_logs l ON l.title_id = t.id
     LEFT JOIN title_genres tg ON tg.title_id = t.id
     LEFT JOIN genres g ON g.id = tg.genre_id
     GROUP BY t.id, l.id
     ORDER BY l.updated_at DESC, t.title COLLATE NOCASE`,
  );
}
