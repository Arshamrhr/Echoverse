#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
