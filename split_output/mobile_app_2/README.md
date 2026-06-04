# RouteCare Driver App (mobile_app_2)

Static web app (vanilla HTML/CSS/JS) that consumes the backend
REST + WebSocket API. Shared UI/code is in `shared/`.

## Run (any static server)
```bash
npm start            # serves on http://localhost:8082
# or: python -m http.server 8082
```

## Configure
Set the backend URL in `shared/js/config.js`
(`API_BASE_URL`). See `.env.example` for the expected value.
