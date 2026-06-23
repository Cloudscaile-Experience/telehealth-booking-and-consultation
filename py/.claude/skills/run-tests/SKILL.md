---
name: run-tests
description: Run the pytest suite for the telehealth backend.
---

# Instructions

Run the full test suite:

```bash
uv run pytest tests/ -v
```

Unit tests only (fast, no DB required):

```bash
uv run pytest tests/unit/ -v
```

Integration tests only:

```bash
uv run pytest tests/integration/ -v
```

Run with coverage report:

```bash
uv run pytest tests/ -v --cov=src/telehealth --cov-report=term-missing
```

Always use `uv run pytest` — never raw `pytest`.
