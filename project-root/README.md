# Project Root — One Backend, Two Mobile Apps

```
project-root/
├── backend/        FastAPI REST API under /api/v1  (JWT, SQLite by default)
├── mobile_app_1/   QuickNotes — notes app   (mobile-web)
└── mobile_app_2/   TaskFlow  — tasks app    (mobile-web)
```

Both apps send HTTP requests to the **same** backend and receive JSON. Users and
data are **isolated per app** (`app1` / `app2`) via the JWT, and the backend
supports roles (`user` / `admin`) so the apps can diverge in permissions.

```
 mobile_app_1 ─┐
               ├─►  http://localhost:8000/api/v1  ─►  JSON
 mobile_app_2 ─┘            (shared backend)
```

## Run everything (3 terminals)

**1) Backend** → http://localhost:8000  (interactive docs at `/docs`)
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate   # PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env            # set SECRET_KEY (DATABASE_URL optional — SQLite by default)
uvicorn app.main:app --reload --port 8000
```

**2) Mobile App 1** → http://localhost:8081
```bash
cd mobile_app_1 && python -m http.server 8081
```

**3) Mobile App 2** → http://localhost:8082
```bash
cd mobile_app_2 && python -m http.server 8082
```

Each app's backend URL lives in its `js/config.js` (`API_BASE_URL`). The backend
allows all origins in development (`CORS_ORIGINS=*`); lock this down for production.

## How it fits together
- Both apps register/login at `/api/v1/auth` (App 1 → `app1`, App 2 → `app2`).
- Both use the shared `/api/v1/data` endpoint; the backend filters by the token's `app`.
- Roles + per-app scoping (see `backend/app/security.py` and `routers/`) let the two
  apps have different permissions when needed.

See each subfolder's `README.md` for details.
