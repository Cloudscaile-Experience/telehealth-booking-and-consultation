.PHONY: install dev lint test

install:
	uv sync --group dev
	uv run pre-commit install

dev:
	uv run uvicorn src.telehealth.main:app --reload --host 0.0.0.0 --port 8000

lint:
	uv run ruff check --fix src/ tests/
	uv run black src/ tests/
	uv run mypy src/

test:
	uv run pytest
