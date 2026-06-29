import pytest
from freezegun import freeze_time  # noqa: F401 — re-exported for test modules


@pytest.fixture(autouse=True)  # type: ignore[misc]
def reset_settings_cache() -> None:
    """Clear the lru_cache on get_settings between tests so env overrides apply."""
    from telehealth.utils.config import get_settings

    get_settings.cache_clear()
