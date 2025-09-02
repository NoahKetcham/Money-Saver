# Money Saver Backend (FastAPI)

## Setup

1. Create and activate a Python virtual environment (optional).
2. Install dependencies:

```
pip install -r requirements.txt
```

3. Run the API in dev:

```
uvicorn app.main:app --reload --port 8000
```

- Default DB: SQLite file `money_saver.db` in backend root. Override with `DATABASE_URL`.
- CORS allows `http://localhost:5173`.

## Endpoints
- GET `/health`
- GET/POST/PATCH/DELETE `/accounts`
- GET/POST/DELETE `/transactions`

## SQL schema
See `schema.sql` to initialize tables manually.
