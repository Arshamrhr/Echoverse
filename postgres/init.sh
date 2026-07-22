#!/bin/bash
set -e

# Only creates the databases themselves - this is a one-time Postgres-level
# thing Alembic can't do (a migration runs *inside* a database). Table
# schema lives in backend/migrations/ and is applied by the backend's
# entrypoint on every startup via `alembic upgrade head`.
#
# Written to be safe to re-run (checks existence first) instead of crashing
# with "database already exists" if the container restarts against a volume
# that was already initialized.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE keycloak' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec
    SELECT 'CREATE DATABASE Echoverse_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'Echoverse_db')\gexec
EOSQL
