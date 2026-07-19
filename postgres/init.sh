#!/bin/bash
set -e

# Keycloak gets its own database, separate from the app's data
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE keycloak;
    CREATE DATABASE animedb;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "animedb" <<-EOSQL
    CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        anime_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        username VARCHAR(128) NOT NULL,
        text TEXT NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_comments_anime_id ON comments (anime_id);
    CREATE INDEX IF NOT EXISTS idx_comments_anime_likes ON comments (anime_id, likes DESC);

    CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE (comment_id, user_id)
    );
EOSQL
