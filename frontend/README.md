# VideoTube Frontend

React + Vite SPA for the VideoTube backend API.

## Run

From the repo root, start the API:

```bash
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Ensure root `.env` has:

```
CORS_ORIGIN=http://localhost:5173
```

## Features

- Auth: register, login, logout, JWT in localStorage + Bearer header
- Home feed + search
- Watch page: player, like, subscribe, comments, playlists, related
- Upload + Studio (publish/unpublish, delete, stats)
- Channel profile (videos, playlists, tweets)
- Liked videos, playlists, settings

**Note:** New uploads are unpublished by default. Publish them from **Studio** so they appear on Home.
