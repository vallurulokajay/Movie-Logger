import { getOmdbApiKey } from "./settings";

const OMDB_BASE_URL = "https://www.omdbapi.com/";

export type OmdbSearchResult = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: "movie" | "series" | "episode";
  Poster: string;
};

export type OmdbSearchResponse = {
  Search?: OmdbSearchResult[];
  totalResults?: string;
  Response: "True" | "False";
  Error?: string;
};

export type OmdbDetails = {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: "movie" | "series" | "episode";
  totalSeasons?: string;
  Response: "True" | "False";
  Error?: string;
};

async function getApiKey() {
  const key = await getOmdbApiKey();

  if (!key) {
    throw new Error("OMDb API key is not configured.");
  }

  return key;
}

export async function searchOmdb(
  query: string,
  type?: "movie" | "series",
): Promise<OmdbSearchResult[]> {
  const key = await getApiKey();

  const params = new URLSearchParams({
    apikey: key,
    s: query,
    r: "json",
  });

  if (type) {
    params.set("type", type);
  }

  const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`OMDb request failed: ${response.status}`);
  }

  const data = (await response.json()) as OmdbSearchResponse;

  if (data.Response === "False") {
    return [];
  }

  return data.Search ?? [];
}

export async function getOmdbDetails(
  imdbId: string,
): Promise<OmdbDetails> {
  const key = await getApiKey();

  const params = new URLSearchParams({
    apikey: key,
    i: imdbId,
    plot: "full",
    r: "json",
  });

  const response = await fetch(`${OMDB_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`OMDb request failed: ${response.status}`);
  }

  const data = (await response.json()) as OmdbDetails;

  if (data.Response === "False") {
    throw new Error(data.Error ?? "OMDb could not find this title.");
  }

  return data;
}
