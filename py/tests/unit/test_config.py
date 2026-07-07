"""Unit tests for Settings configuration loading."""

import pytest

from telehealth.utils.config import Settings


@pytest.mark.unit
class TestSettingsServer:
    def test_default_port(self) -> None:
        s = Settings()
        assert s.PORT == 8000

    def test_port_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("PORT", "9090")
        s = Settings()
        assert s.PORT == 9090

    def test_default_host(self) -> None:
        s = Settings()
        assert s.HOST == "0.0.0.0"

    def test_host_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("HOST", "127.0.0.1")
        s = Settings()
        assert s.HOST == "127.0.0.1"


@pytest.mark.unit
class TestSettingsDatabaseUrl:
    def test_default_pg_db(self) -> None:
        s = Settings()
        assert s.PG_DB == "patient_portal_dev"

    def test_pg_db_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("PG_DB", "my_custom_db")
        s = Settings()
        assert s.PG_DB == "my_custom_db"

    def test_database_url_contains_pg_db(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("PG_DB", "test_db")
        s = Settings()
        assert s.database_url.endswith("/test_db")

    def test_database_url_format(self) -> None:
        s = Settings(
            PG_USERNAME="user",
            PG_PASSWORD="pass",
            PG_HOST="db-host",
            PG_PORT=5433,
            PG_DB="mydb",
        )
        assert s.database_url == "postgresql+asyncpg://user:pass@db-host:5433/mydb"
