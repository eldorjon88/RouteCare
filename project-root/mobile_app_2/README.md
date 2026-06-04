# Mobile App 2 — TaskFlow

A mobile-web **task** app that consumes the **same** shared backend as App 1.

## Features
- Register / log in (JWT, stored in `localStorage`)
- Create, list, and delete tasks
- **Toggle done** (checkbox) — uses the `done` field on `/data` (App 1 ignores it)
- Data is private to your account and isolated to **app2** by the backend

## Run
Static app — serve the folder with any static server, then open it:
```bash
python -m http.server 8082      # then open http://localhost:8082
```
The **backend must be running** first (see `../backend`).

## Configure
The backend URL is in [`js/config.js`](js/config.js) (`API_BASE_URL`); see `.env.example`.
This app registers users with `app: "app2"` so they belong to App 2 (separate from App 1).
