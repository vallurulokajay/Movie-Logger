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
