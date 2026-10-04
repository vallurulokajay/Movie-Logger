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


export type Watchlist = {
  id: number;
  name: string;
  count: number;
};

export async function ensureAllMoviesWatchlist(): Promise<number> {
  const db = await getDatabase();

  await db.execute(
    `INSERT OR IGNORE INTO watchlists (name)
     VALUES ('All Movies')`,
  );

  const rows = await db.select<{ id: number }[]>(
    `SELECT id
     FROM watchlists
     WHERE name = 'All Movies'
     LIMIT 1`,
  );

  if (rows.length === 0) {
    throw new Error("Could not initialize All Movies.");
  }

  return rows[0].id;
}

export async function getWatchlists(): Promise<Watchlist[]> {
  const db = await getDatabase();

  await ensureAllMoviesWatchlist();

  return db.select<Watchlist[]>(
    `SELECT
       w.id,
       w.name,
       COUNT(wi.title_id) AS count
     FROM watchlists w
     LEFT JOIN watchlist_items wi
       ON wi.watchlist_id = w.id
     GROUP BY w.id
     ORDER BY
       CASE
         WHEN w.name = 'All Movies' THEN 0
         ELSE 1
       END,
       w.name COLLATE NOCASE`,
  );
}

export async function getWatchlistTitles(
  watchlistId: number,
): Promise<LocalTitle[]> {
  const db = await getDatabase();

  return db.select<LocalTitle[]>(
    `SELECT
       t.id,
       t.title,
       t.media_type,
       t.release_date,
       t.first_air_date,
       t.poster_path
     FROM titles t
     JOIN watchlist_items wi
       ON wi.title_id = t.id
     WHERE wi.watchlist_id = $1
     ORDER BY t.title COLLATE NOCASE`,
    [watchlistId],
  );
}

export async function createWatchlist(
  name: string,
): Promise<number> {
  const db = await getDatabase();
  const cleaned = name.trim();

  if (!cleaned) {
    throw new Error("Watchlist name is required.");
  }

  if (cleaned.toLowerCase() === "all movies") {
    throw new Error("All Movies is reserved.");
  }

  await db.execute(
    `INSERT INTO watchlists (name)
     VALUES ($1)`,
    [cleaned],
  );

  const rows = await db.select<{ id: number }[]>(
    `SELECT id
     FROM watchlists
     WHERE name = $1
     LIMIT 1`,
    [cleaned],
  );

  if (rows.length === 0) {
    throw new Error("Could not create the watchlist.");
  }

  return rows[0].id;
}

export async function deleteWatchlist(
  watchlistId: number,
): Promise<void> {
  const db = await getDatabase();

  const rows = await db.select<{ name: string }[]>(
    `SELECT name
     FROM watchlists
     WHERE id = $1
     LIMIT 1`,
    [watchlistId],
  );

  if (rows[0]?.name === "All Movies") {
    throw new Error("All Movies cannot be deleted.");
  }

  await db.execute(
    `DELETE FROM watchlists
     WHERE id = $1`,
    [watchlistId],
  );
}

export async function addTitleToWatchlist(
  titleId: number,
  watchlistId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `INSERT OR IGNORE INTO watchlist_items (
       watchlist_id,
       title_id
     )
     VALUES ($1, $2)`,
    [watchlistId, titleId],
  );
}

export async function removeTitleFromWatchlist(
  titleId: number,
  watchlistId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `DELETE FROM watchlist_items
     WHERE watchlist_id = $1
       AND title_id = $2`,
    [watchlistId, titleId],
  );
}

export async function markTitleWatched(
  titleId: number,
): Promise<void> {
  const db = await getDatabase();

  const existing = await db.select<{ id: number }[]>(
    `SELECT id
     FROM title_logs
     WHERE title_id = $1
     LIMIT 1`,
    [titleId],
  );

  if (existing.length === 0) {
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
  } else {
    await db.execute(
      `UPDATE title_logs
       SET times_watched = times_watched + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE title_id = $1`,
      [titleId],
    );
  }

  await db.execute(
    `DELETE FROM watchlist_items
     WHERE title_id = $1`,
    [titleId],
  );
}


export async function addTitleToList(
  titleId: number,
  listId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `INSERT OR IGNORE INTO list_items (
      list_id,
      title_id
    )
    VALUES ($1, $2)`,
    [listId, titleId],
  );
}

export async function removeTitleFromList(
  titleId: number,
  listId: number,
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `DELETE FROM list_items
     WHERE list_id = $1
       AND title_id = $2`,
    [listId, titleId],
  );
}


export type UserList = {
  id: number;
  name: string;
  description: string | null;
  count: number;
};

export async function getLists(): Promise<UserList[]> {
  const db = await getDatabase();

  return db.select<UserList[]>(
    `SELECT
       l.id,
       l.name,
       l.description,
       COUNT(li.title_id) AS count
     FROM lists l
     LEFT JOIN list_items li
       ON li.list_id = l.id
     GROUP BY l.id
     ORDER BY l.name COLLATE NOCASE`,
  );
}

export async function getListTitles(
  listId: number,
): Promise<LocalTitle[]> {
  const db = await getDatabase();

  return db.select<LocalTitle[]>(
    `SELECT
       t.id,
       t.title,
       t.media_type,
       t.release_date,
       t.first_air_date,
       t.poster_path
     FROM titles t
     JOIN list_items li
       ON li.title_id = t.id
     WHERE li.list_id = $1
     ORDER BY t.title COLLATE NOCASE`,
    [listId],
  );
}

export async function createList(
  name: string,
  description: string,
): Promise<number> {
  const db = await getDatabase();
  const cleaned = name.trim();

  if (!cleaned) {
    throw new Error("List name is required.");
  }

  await db.execute(
    `INSERT INTO lists (
      name,
      description
    )
    VALUES ($1, $2)`,
    [cleaned, description.trim() || null],
  );

  const rows = await db.select<{ id: number }[]>(
    `SELECT id
     FROM lists
     WHERE name = $1
     LIMIT 1`,
    [cleaned],
  );

  if (rows.length === 0) {
    throw new Error("Could not create the list.");
  }

  return rows[0].id;
}

export async function updateList(
  id: number,
  name: string,
  description: string,
): Promise<void> {
  const db = await getDatabase();
  const cleaned = name.trim();

  if (!cleaned) {
    throw new Error("List name is required.");
  }

  await db.execute(
    `UPDATE lists
     SET name = $1,
         description = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [cleaned, description.trim() || null, id],
  );
}

export async function deleteList(
  id: number,
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `DELETE FROM lists
     WHERE id = $1`,
    [id],
  );
}
