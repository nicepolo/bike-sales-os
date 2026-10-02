import os


def _normalize_db_url(url: str) -> str:
    if not url:
        return url

    # Railway may expose postgres:// or explicitly select the psycopg v3 driver.
    # This project ships psycopg2-binary, so normalize both forms to psycopg2.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bike_sales_os")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "")

    LINE_CHANNEL_SECRET = os.environ.get("LINE_CHANNEL_SECRET", "")
    LINE_CHANNEL_ACCESS_TOKEN = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
