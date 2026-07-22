from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/animedb"
    REDIS_URL: str = "redis://redis:6379/0"

    KEYCLOAK_URL: str = "http://keycloak:8080"
    KEYCLOAK_REALM: str = "anime-mixtape"
    KEYCLOAK_CLIENT_ID: str = "anime-frontend"

    # Confidential client used only server-side to call Keycloak's Admin API
    # (creating users on sign-up). Never exposed to the browser.
    KEYCLOAK_ADMIN_CLIENT_ID: str = "anime-backend"
    KEYCLOAK_ADMIN_CLIENT_SECRET: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
