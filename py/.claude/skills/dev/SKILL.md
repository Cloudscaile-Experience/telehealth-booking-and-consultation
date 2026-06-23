---
name: dev
description: Start the local FastAPI development server with hot reload.
---

# Instructions

Start the dev server (requires `.env` and a running PostgreSQL instance):

```bash
# Start the dev database only
docker compose -f docker-compose.dev.yml up -d

# Run the API with hot reload
uv run uvicorn telehealth.app.main:create_app --factory --reload --host 0.0.0.0 --port 8000
```

The server will be available at:
- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`
