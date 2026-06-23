---
name: lint
description: Run all code quality tools (ruff, mypy, black, isort) via pre-commit.
---

# Instructions

Run all pre-commit hooks across the entire project:

```bash
uv run pre-commit run --all-files
```

### Run specific hooks

| Hook | Command |
|------|---------|
| Ruff (lint + fix) | `uv run pre-commit run ruff --all-files` |
| Black (format) | `uv run pre-commit run black --all-files` |
| isort (imports) | `uv run pre-commit run isort --all-files` |
| Mypy (types) | `uv run pre-commit run mypy --all-files` |

### Troubleshooting

If a formatting hook fails it auto-fixes the files. Stage the changes and re-run:

```bash
git add -u && uv run pre-commit run --all-files
```

Do NOT use flags like `--ruff` or `--mypy`. Always use `pre-commit run <hook-id>`.
