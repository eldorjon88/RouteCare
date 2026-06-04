# Backend — Shared REST API

A single FastAPI server (JWT auth, SQLAlchemy) consumed by **mobile_app_1** and
**mobile_app_2**. All routes are under **`/api/v1`**.

## Run

```bash
python -m venv .venv
source .venv/Scripts/activate        # Windows PowerShell: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env                  # set SECRET_KEY (and DATABASE_URL if not SQLite)
uvicorn app.main:app --reload --port 8000
```

- API base: `http://localhost:8000/api/v1`
- Interactive docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

By default it uses **SQLite** (`app.db`, created automatically). Switch to
PostgreSQL by setting `DATABASE_URL` in `.env`.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | – | Create a user. Body: `{username, password, app, role?}` (`app` = `app1`/`app2`) |
| POST | `/api/v1/auth/login` | – | Returns `{access_token}` (JWT). Body: `{username, password}` |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| GET | `/api/v1/users/me` | Bearer | Current user's profile |
| GET | `/api/v1/users` | Bearer (admin) | List users **of the caller's app** |
| GET | `/api/v1/data` | Bearer | List items for the caller's app |
| POST | `/api/v1/data` | Bearer | Create an item. Body: `{title, content?}` |
| PATCH | `/api/v1/data/{id}` | Bearer | Update an item (`title`/`content`/`done`) |
| DELETE | `/api/v1/data/{id}` | Bearer | Delete an item |

## Per-app users & roles

- Every user belongs to an **app** (`app1` or `app2`) and has a **role** (`user`/`admin`).
- The JWT carries `app` + `role`. `/data` and `/users` are **isolated per app**, so the
  two apps share one backend and codebase but never see each other's users or data.
- `require_role("admin")` (see `app/security.py`) shows how to add role-restricted routes;
  filtering by `user.app` shows how the two apps can diverge in permissions/visibility.

## Auth usage

```bash
# Register + login
curl -X POST localhost:8000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pw","app":"app1"}'
TOKEN=$(curl -s -X POST localhost:8000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pw"}' | python -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Call a protected endpoint
curl localhost:8000/api/v1/data -H "Authorization: Bearer $TOKEN"
```
