# Lokajay's MOVIE LOGGER — V1 Product Specification

## Product
Private personal desktop application for managing movies and TV shows.

## Core
- Movie Logs
- 1–10 rating in 0.5 increments
- One simple private Notes field
- Times Watched counter
- Watchlists with optional sublists
- Custom Lists with name + optional description
- Genres and separate personal Tags
- Unified local-first search with TMDB fallback
- Basic Home analytics
- Simple Profile
- Settings

## Rules
- One title = one database record.
- Movies and TV shows share the same system.
- TV is one title: no seasons or episode tracking.
- Adding a new title to Movie Logs sets Times Watched to 1.
- Rewatching increments the counter and may update the same Notes field.
- Rating and notes are optional when first logging.
- Mark as Watched moves the title to Movie Logs and removes it from every Watchlist.
- Adding a brand-new online title through Add to List adds it to both Watchlist and the chosen List.
- Adding an existing local title to a List affects only that List.
- A title can belong to multiple Lists and multiple Watchlist sublists.
- All Movies in Watchlists is computed automatically.
- Removing a title from Movie Logs removes it from Movie Logs, Watchlists, Watchlist sublists and normal Lists, but keeps its title record.
- Permanent Delete removes the title and all associated data.
- Deleting a List removes only that List and its associations.
- External TMDB metadata is read-only in V1.
- Tags are managed in Settings and selected from title details.
- Backup/export/import is deferred beyond V1.

## Navigation
Home | Movie Logs | Watchlists | Lists | Profile

Fixed top navigation. Dark-only cinematic/minimal design.

## Home
Brand:
Lokajay's
MOVIE LOGGER

Order:
1. Branding
2. Large unified search
3. Search results / quick actions
4. Analytics
5. Watchlist overview

No recommendations, social feed, recently-added logs or continue-watching section.

## Movie Logs
Poster grid by default and list view alternative.

Filters:
- All
- Movies
- TV Shows
- Genre

Cards show poster, title, year and personal rating.

## Watchlists
Automatic All Movies view plus optional user-created sublists.

Card action:
Mark as Watched.

## Lists
Large list cards. Create/Edit/Delete from Lists page only.
Manual drag ordering is deferred.

## Title Details
Cinematic hero with poster, title, metadata, rating, times watched when >1, notes, lists, tags, watchlist status and relevant external metadata.

Edit opens a modal. Rating uses a 0.5-step slider. Notes use a Save/Cancel editor.

## Profile
Name, locally stored profile picture and unrestricted bio.

First launch asks for name, optional picture and optional bio.

## Analytics
Home-only:
- Logged titles
- Movies vs TV
- Watchlist count
- List count
- Average rating
- Rating distribution
- Highest/lowest rated
- Most-used genres
- Average rating by genre
- Total times watched
- Titles watched multiple times

## Technology
- Tauri 2
- React
- TypeScript
- Vite
- SQLite
- Tauri SQL plugin
- TMDB API
- GitHub Codespaces
- GitHub Actions
- GitHub Releases

## Repository workflow
Develop in Codespaces, commit to GitHub, build the Windows installer with GitHub Actions, distribute the packaged desktop application through GitHub Releases.

## V1 non-goals
No social features, accounts for other users, recommendations, public ratings/reviews, comments, season/episode tracking, cloud database, web deployment or browser-only requirement.
