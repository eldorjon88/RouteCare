# 🚑 RouteCare

**RouteCare** is a real-time **ambulance dispatch system** for rural Uzbekistan — connecting patients, ambulance drivers, and dispatch centers so help arrives faster when minutes matter.

> ### ⚠️ Safety notice
> RouteCare is **in active development and is not yet a substitute for official emergency services.**
> In a life-threatening emergency, call **103** (ambulance) or **112** (unified emergency) immediately.
> A production deployment must be coordinated with the relevant health authorities.

---

## 🌍 Problem

In many rural and underserved areas of Uzbekistan, getting an ambulance quickly is difficult: long distances, unclear locations, and limited coordination cost precious time. Delays directly affect patient outcomes.

## 💡 Solution

RouteCare links the three sides of emergency transport in real time:

- **Patients** request an ambulance with one tap and track it live.
- **Drivers** receive dispatches, share their location, and navigate to the patient.
- **Dispatch centers** see every ambulance on a map and assign the nearest one.

## 🎯 Vision

To become the most trusted ambulance-coordination platform for underserved regions — so no one waits too long for emergency care.

---

## 👥 User roles

| Role | Highlights |
| --- | --- |
| **Patient / Caller** | One-tap request, live tracking, driver details & ETA, call history |
| **Ambulance Driver** | Accept/reject dispatches, navigation, status (available / on call / off duty), live location sharing |
| **Dispatch Center** | All ambulances on a map, assign nearest unit, monitor response times & coverage |

---

## 🚀 Features

**MVP (in progress)**
- Phone-based (OTP) sign-in for all roles
- Patient ambulance requests with location
- Location-based nearest-ambulance assignment
- Real-time call & location updates over WebSockets
- Driver status management
- Dispatch dashboard for assigning and monitoring calls

**Planned**
- Live turn-by-turn navigation and map tracking
- Response-time analytics & coverage reports
- Native mobile apps (React Native)
- Offline-tolerant operation for poor rural connectivity

---

## 🛠️ Technology stack

| Layer | Choice |
| --- | --- |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (ES6+), mobile-first |
| Real-time | Native WebSockets (FastAPI WebSocket endpoint) |
| Maps | Google Maps API *(Yandex Maps is worth evaluating for rural coverage)* |
| Backend | Python 3.11+ with FastAPI (Uvicorn ASGI server) |
| Database | PostgreSQL 14+ via SQLAlchemy |
| Auth | Phone OTP + JWT (PyJWT), bcrypt-hashed codes |
| Hosting | Vercel (frontend) · Railway/Render (backend) · managed PostgreSQL |

> Full design system, coding standards, and conventions live in **[CLAUDE.md](CLAUDE.md)**.

---

## 🗂️ Project structure

```
RouteCare/
├── frontend/
│   ├── shared/             # Design tokens + reusable JS (api, auth, socket, ui, theme, login)
│   ├── patient-app/        # Call an ambulance, track it
│   ├── driver-app/         # Accept calls, set status
│   └── dispatch-dashboard/ # Assign & monitor calls
├── app/                        # FastAPI backend (Python)
│   ├── main.py                 # FastAPI app: CORS, routers, /ws, static, errors
│   ├── config.py               # env handling (python-dotenv)
│   ├── database.py             # SQLAlchemy engine, session, Base
│   ├── models.py               # ORM models (users, ambulances, calls, otp_codes)
│   ├── schemas.py              # Pydantic request/response models
│   ├── security.py             # JWT + auth dependencies (role guards)
│   ├── rate_limit.py           # slowapi limiter
│   ├── websocket.py            # WebSocket connection manager
│   ├── crud.py                 # SQLAlchemy data access
│   ├── routers/                # auth, calls, drivers
│   └── services/               # otp_service, dispatch_service
├── scripts/
│   └── init_db.py              # apply database/schema.sql
├── database/
│   └── schema.sql          # PostgreSQL schema
├── README.md
└── CLAUDE.md               # Project context & standards
```

---

## 🚧 Getting started

**Prerequisites:** Python 3.11+ and PostgreSQL 14+. See **[requirements.txt](requirements.txt)** for the full list of dependencies.

```bash
# 1. Create & activate a virtual environment
python -m venv .venv
source .venv/Scripts/activate     # Git Bash on Windows
# .\.venv\Scripts\Activate.ps1    # PowerShell

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env              # then edit DB password, JWT secret, etc.

# 4. Create the database (once) — creates the "routecare" database
psql -U postgres -f database/create-database.sql

# 5. Create the tables
python scripts/init_db.py

# 6. Run the server (also serves the frontend apps)
uvicorn app.main:app --reload --port 8000
```

Then open:

- Landing page → http://localhost:8000/
- Patient app → http://localhost:8000/patient-app/
- Driver app → http://localhost:8000/driver-app/
- Dispatch dashboard → http://localhost:8000/dispatch-dashboard/
- API docs (bonus) → http://localhost:8000/docs

> In development, OTP codes are printed to the **server console** (no SMS provider needed). Add a Maps API key in `frontend/shared/js/config.js` to enable maps.

---

## 📈 Roadmap

**Phase 0 — Foundations** ✅ *(scaffolded)*
- [x] Repo structure, backend, database schema, shared frontend
- [x] Phone-OTP auth with roles

**Phase 1 — MVP**
- [ ] Patient request flow with real map + geolocation
- [ ] Driver call handling + live location sharing
- [ ] Dispatch assignment + live map of ambulances

**Phase 2 — Enhance**
- [ ] Turn-by-turn navigation
- [ ] Response-time analytics & coverage
- [ ] Offline tolerance for weak networks

**Phase 3 — Scale**
- [ ] Native mobile apps (React Native)
- [ ] Integration with official EMS / health facilities

---

## 🔐 Security & privacy

- Phone OTP authentication; one-time codes stored **hashed**, never plaintext.
- JWT-protected APIs with role-based access control.
- Parameterized SQL queries (injection-safe) and request rate limiting.
- HTTPS for all data in transit; patient data treated as confidential.
- Compliance with Uzbekistan's *Law "On Personal Data"* (2019) for any real deployment.

See **[CLAUDE.md](CLAUDE.md)** for the full security standards.

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome. Please open an issue to discuss ideas or report problems.

## 📄 License

Licensed under the **MIT License**.

---

### 🚑 RouteCare

**Delivering access to healthcare, one route at a time.**
