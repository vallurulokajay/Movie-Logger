import { load } from "@tauri-apps/plugin-store";

const SETTINGS_FILE = "settings.json";

export async function getOmdbApiKey(): Promise<string> {
  const store = await load(SETTINGS_FILE);
  return (await store.get<string>("omdb_api_key")) ?? "";
}

export async function saveOmdbApiKey(apiKey: string): Promise<void> {
  const store = await load(SETTINGS_FILE);
  await store.set("omdb_api_key", apiKey.trim());
  await store.save();
}

export async function removeOmdbApiKey(): Promise<void> {
  const store = await load(SETTINGS_FILE);
  await store.delete("omdb_api_key");
  await store.save();
}
