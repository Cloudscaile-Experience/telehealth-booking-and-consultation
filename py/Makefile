.PHONY: install dev lint precommit test

install:
	uv sync --group dev

dev:
	uv run uvicorn src.telehealth.main:app --reload --host 0.0.0.0 --port 8000

lint:
	uv run ruff check --fix src/ tests/
	uv run black src/ tests/
	uv run mypy src/

precommit:
	cd .. && web/node_modules/.bin/lefthook run pre-commit --all-files

test:
	uv run pytest
