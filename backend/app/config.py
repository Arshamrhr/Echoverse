from pydantic_settings import BaseSettings
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "postgres-service"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "Echoverse_db"

    REDIS_URL: str = "redis://redis-service:6379/0"

    KEYCLOAK_URL: str = "http://keycloak-service:8080"
    KEYCLOAK_REALM: str = "echoverse"
    KEYCLOAK_CLIENT_ID: str = "echoverse-frontend"

    # Confidential client used only server-side to call Keycloak's Admin API
    # (creating users on sign-up). Never exposed to the browser.
    KEYCLOAK_ADMIN_CLIENT_ID: str = "echoverse-backend"
    KEYCLOAK_ADMIN_CLIENT_SECRET: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    @property
    def DATABASE_URL(self) -> str:
        """
        Built with SQLAlchemy's URL.create() instead of a raw interpolated
        string. This automatically percent-encodes special characters in the
        password (@, :, /, etc.), so a password like "P@ssw0rd" can never be
        misparsed as user "..." + host "ssw0rd@postgres-service" - which is
        exactly what caused the "could not translate host name" error.
        """
        return URL.create(
            drivername="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        ).render_as_string(hide_password=False)


settings = Settings()
