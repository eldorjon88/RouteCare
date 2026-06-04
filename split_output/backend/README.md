# RouteCare Backend

FastAPI server exposing the **REST + WebSocket API** consumed by
`mobile_app_1` (patient) and `mobile_app_2` (driver). The admin
dashboard lives in `admin/`.

## Run
```bash
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## CORS
Allow the two app origins via `CORS_ORIGIN` in `.env` so both
mobile apps can call this API. Docs: `/docs`. Health: `/health`.
