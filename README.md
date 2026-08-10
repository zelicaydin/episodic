# ScoreTrack

Personal TV app: per-episode IMDb ratings as a color-coded grid, with verdicts,
show comparison, and watch tracking. Runs locally.

## Setup
1. `npm install`
2. `npm run ingest` (downloads IMDb datasets, builds data/imdb.db, takes a few minutes)
3. `cp .env.example .env` and add a TMDB API key (optional, enables posters)
4. `npm run dev`

Information courtesy of IMDb (https://www.imdb.com). Used with permission.
This product uses the TMDB API but is not endorsed or certified by TMDB.
