---
name: lint
description: Run all code quality tools (ruff, mypy, black) via lefthook.
---

# Instructions

Run all lefthook `pre-commit` jobs across the entire project (from the repo root):

```bash
npx lefthook run pre-commit --all-files
```

### Run specific jobs

| Job | Command |
|------|---------|
| Ruff (lint + fix + imports) | `npx lefthook run pre-commit --job "py — ruff (lint + fix)" --all-files` |
| Black (format) | `npx lefthook run pre-commit --job "py — black (format)" --all-files` |
| Mypy (types) | `npx lefthook run pre-commit --job "py — mypy (types)" --all-files` |

There is no standalone isort — ruff's `I` ruleset owns import sorting. Do not add isort back; it disagrees with ruff on how to merge same-module imports and the two will fight each other on every commit.

### Troubleshooting

Jobs with `stage_fixed: true` (black, ruff, whitespace/EOF fixers) auto-fix files and re-stage them. Just re-run the command.

Do NOT run `uv run pre-commit ...` — pre-commit is no longer used in this repo. Lefthook (`lefthook.yml` at the repo root) is the only git-hook runner.
