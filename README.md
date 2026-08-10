# ScoreTrack

Personal TV app: per-episode IMDb ratings as a color-coded grid, with verdicts,
show comparison, and watch tracking. Runs locally.

## Features

- **Episode ratings grid**: every season laid out as a grid of episode cells,
  colored by rating tier (from disaster-red through violet, amber, and up to
  glowing green for the best episodes) so you can spot a show's peaks and
  slumps at a glance.
- **Insights and verdicts**: season averages, a weighted show rating, the
  peak and worst episodes, the most consistent season, and a one-line verdict
  that calls out things like a steady climb, a golden era, or a season where
  a show fell off.
- **Show comparison**: two shows side by side, stat strips and grids stacked
  so you can compare seasons and ratings directly.
- **Personal tracking**: save shows, mark episodes watched, rate shows
  yourself, and see your watch progress on a "My Shows" page, including
  new-episode badges for saved shows.

## The two databases

ScoreTrack keeps ratings data and personal data in separate SQLite files
under `data/`:

- `data/imdb.db` holds show and episode data built from the public IMDb
  datasets. It's rebuilt from scratch every time you run `npm run ingest`.
- `data/user.db` holds your saved shows, watched episodes, and ratings. The
  ingest script never touches it, so re-running ingest (to pick up new
  episodes, for example) never wipes your personal data.

Both files are gitignored; nobody's data or the multi-hundred-megabyte IMDb
dataset gets committed.

## Setup

1. `npm install`
2. `npm run ingest` (downloads the IMDb datasets and builds `data/imdb.db`,
   takes a few minutes depending on your connection)
3. `cp .env.example .env` and add a TMDB API key if you want posters (see
   below; optional, everything else works without it)
4. `npm run dev` starts the API server and the web app together

### Re-running ingest

`npm run ingest` re-downloads the IMDb datasets and rebuilds `data/imdb.db`
every time. If you already have the raw files under `data/downloads` and
just want to rebuild the database (say, after a code change to the parser),
skip the re-download with:

```
npm run ingest -- -- --cached
```

The double `--` is needed because `ingest` at the root is itself an `npm
run` that forwards into `scripts/ingest`; the first `--` gets consumed by
the outer npm and the second one carries `--cached` through to the actual
script.

### TMDB API key (optional, for posters)

Show posters come from TMDB. To enable them:

1. Create a free account at [themoviedb.org](https://www.themoviedb.org).
2. Go to Settings, then API, and request a key (the "API Read Access Token"
   or v3 API key both work).
3. Put it in `.env` as `TMDB_API_KEY=your-key-here`.

Without a key, ScoreTrack works the same way, just without poster images.

## Running in production

```
npm run build
npm start
```

`npm run build` builds the web app into `apps/web/dist`. `npm start` runs
the API server in production mode, which also serves the built web app, so
the whole thing runs as a single process on `http://localhost:3001`.

## Tests and typechecking

```
npm run typecheck
npm test
```

Both run across every workspace (`packages/shared`, `scripts/ingest`,
`apps/server`, `apps/web`).

## Data & attribution

Information courtesy of IMDb (https://www.imdb.com). Used with permission.
This product uses the TMDB API but is not endorsed or certified by TMDB.
