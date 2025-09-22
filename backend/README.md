FastAPI backend

Run locally:

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgres://app:PASS@HOST:PORT/app_1tky?sslmode=require"
export JWT_SECRET="change-me"
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Endpoints:
- POST /auth/register {email,password} -> {access_token}
- POST /auth/token (OAuth2PasswordRequestForm) -> {access_token}
- GET /todos (Bearer token)
- PUT /todos (Bearer token) body: Todo[]
- DELETE /todos (Bearer token)

