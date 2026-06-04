# RouteCare Patient App (mobile_app_1)

Static web app (vanilla HTML/CSS/JS) that consumes the backend
REST + WebSocket API. Shared UI/code is in `shared/`.

## Run (any static server)
```bash
npm start            # serves on http://localhost:8081
# or: python -m http.server 8081
```

## Configure
Set the backend URL in `shared/js/config.js`
(`API_BASE_URL`). See `.env.example` for the expected value.
