from app.config import _normalize_db_url


def test_normalize_db_url_uses_installed_psycopg2_driver():
    assert _normalize_db_url("postgres://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"
    assert _normalize_db_url("postgresql://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"
    assert _normalize_db_url("postgresql+psycopg://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"
    assert _normalize_db_url("postgresql+psycopg2://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"
