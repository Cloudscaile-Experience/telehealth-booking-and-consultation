# Telehealth Booking & Consultation

A monorepo for the Telehealth Booking & Consultation extension — virtual consultation booking, video sessions, and post-visit summaries.

| Directory | Role                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `py/`     | FastAPI REST API — slot availability, bookings, video tokens, consultations |
| `web/`    | React micro-frontend — provider directory, booking flow, consultation room  |

---

## Prerequisites

| Tool                    | Version            |
| ----------------------- | ------------------ |
| Python                  | 3.12               |
| uv                      | latest             |
| Node.js                 | ≥ 22               |
| npm                     | ≥ 10               |
| Docker & Docker Compose | any recent version |

---

## Quick Start

### Python Backend

```sh
cd py
cp .env.example .env          # fill in DATABASE_URL and secret keys
docker compose -f docker-compose.dev.yml up -d   # start PostgreSQL
uv sync                        # install dependencies
uv run alembic upgrade head    # apply migrations
uv run uvicorn telehealth.app.main:create_app --factory --reload
# → http://localhost:8000/docs
```

### Web Frontend

```sh
cd web
npm install
npm start
# → http://localhost:4000
```

---

## API Overview

| Route                                    | Description                                                      |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `GET /health`                            | Liveness probe                                                   |
| `GET /health/ready`                      | Readiness probe (checks DB)                                      |
| `GET /v1/providers`                      | List providers (filterable by specialty, language, availability) |
| `POST /v1/providers`                     | Create provider                                                  |
| `GET /v1/providers/{id}/availability`    | List available time slots                                        |
| `POST /v1/providers/{id}/availability`   | Add availability slot                                            |
| `DELETE /v1/availability/{id}`           | Remove availability slot                                         |
| `GET /v1/bookings`                       | List my bookings (auth required)                                 |
| `POST /v1/bookings`                      | Book a slot (auth required)                                      |
| `POST /v1/bookings/{id}/confirm`         | Confirm booking → creates consultation                           |
| `GET /v1/consultations/{id}`             | Get consultation details                                         |
| `POST /v1/consultations/{id}/start`      | Start consultation → issues video token                          |
| `POST /v1/consultations/{id}/end`        | End consultation                                                 |
| `GET /v1/consultations/{id}/video-token` | Refresh video token                                              |
| `PATCH /v1/consultations/{id}/notes`     | Update provider/patient notes                                    |
| `PATCH /v1/consultations/{id}/summary`   | Add post-visit summary                                           |

---

## Git Hooks (Lefthook)

Lefthook is the sole owner of `.git/hooks/pre-commit` and `.git/hooks/pre-push`, installed automatically via `npm install` inside `web/` (its `prepare` script runs `lefthook install`).

Reinstall manually:

```sh
npx lefthook install   # from web/, or: web/node_modules/.bin/lefthook install
```

| Hook         | Jobs                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `pre-commit` | repo-wide hygiene (secrets, large files, merge conflicts, YAML/TOML/JSON, whitespace); web: Biome + TypeScript; py: black + ruff (lint + imports) + mypy |
| `pre-push`   | js: Vitest; py: pytest unit tests                                    |

---

## Further Reading

- [Python Backend — `py/CLAUDE.md`](./py/CLAUDE.md)
- [Web Frontend — `web/README.md`](./web/README.md)
