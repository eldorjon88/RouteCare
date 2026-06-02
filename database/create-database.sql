-- Creates the RouteCare application database.
-- Run this ONCE, connected to the default "postgres" maintenance database:
--   psql -U postgres -f database/create-database.sql
--
-- PostgreSQL has no "CREATE DATABASE IF NOT EXISTS"; if the database already
-- exists you'll get a harmless "already exists" error that you can ignore.
CREATE DATABASE routecare;
