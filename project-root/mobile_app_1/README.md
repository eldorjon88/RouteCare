# Mobile App 1 — QuickNotes

A mobile-web **notes** app that consumes the shared backend API.

## Features
- Register / log in (JWT, stored in `localStorage`)
- Create, list, and delete notes (title + content)
- Data is private to your account and isolated to **app1** by the backend

## Run
Static app — serve the folder with any static server, then open it:
```bash
python -m http.server 8081      # then open http://localhost:8081
```
The **backend must be running** first (see `../backend`).

## Configure
The backend URL is in [`js/config.js`](js/config.js) (`API_BASE_URL`); see `.env.example`.
This app registers users with `app: "app1"` so they belong to App 1.
