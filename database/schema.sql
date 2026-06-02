-- RouteCare database schema (PostgreSQL 14+) — tables for the "routecare" database.
-- 1. Create the database (once):  psql -U postgres -f database/create-database.sql
-- 2. Apply this schema:           npm run db:init   (or: psql -d routecare -f database/schema.sql)

-- Users: a person is one of patient | driver | dispatcher.
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  phone       TEXT NOT NULL UNIQUE,                  -- E.164, e.g. +998901234567
  role        TEXT NOT NULL DEFAULT 'patient'
              CHECK (role IN ('patient', 'driver', 'dispatcher')),
  full_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ambulances: each linked to a driver, with a live position and availability.
CREATE TABLE IF NOT EXISTS ambulances (
  id            SERIAL PRIMARY KEY,
  driver_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  plate_number  TEXT,
  status        TEXT NOT NULL DEFAULT 'off_duty'
                CHECK (status IN ('available', 'on_call', 'off_duty')),
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calls: a patient's ambulance request and its dispatch lifecycle.
CREATE TABLE IF NOT EXISTS calls (
  id              SERIAL PRIMARY KEY,
  patient_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ambulance_id    INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
  pickup_lat      DOUBLE PRECISION NOT NULL,
  pickup_lng      DOUBLE PRECISION NOT NULL,
  pickup_address  TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'requested'
                  CHECK (status IN ('requested','assigned','en_route','arrived','transporting','completed','cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_at     TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One-time passcodes for phone-based auth. Codes are stored hashed, never plaintext.
CREATE TABLE IF NOT EXISTS otp_codes (
  id          SERIAL PRIMARY KEY,
  phone       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_status      ON calls(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_driver ON ambulances(driver_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone         ON otp_codes(phone, expires_at);

-- TODO (Phase 2): call_status_history table for response-time analytics, and
-- consider PostGIS (geography column + GiST index, KNN <-> ordering) to replace
-- the haversine query in services/dispatchService.js once volume grows.
