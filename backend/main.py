import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
import psycopg

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-secret")
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MIN", "20160"))  # 14 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

app = FastAPI()


def get_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg.connect(DATABASE_URL, sslmode="require")


async def migrate():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                create table if not exists users (
                  id uuid default gen_random_uuid() primary key,
                  email text unique not null,
                  password_hash text not null,
                  created_at timestamptz not null default now()
                );
                create table if not exists todos (
                  id text primary key,
                  user_id uuid references users(id) on delete cascade,
                  text text not null,
                  priority text not null default 'medium',
                  completed boolean not null default false,
                  tags jsonb default '[]'::jsonb,
                  created_at timestamptz not null default now(),
                  completed_at timestamptz
                );
                """
            )
            conn.commit()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: str
    password: str


class Todo(BaseModel):
    id: str
    text: str
    priority: str = "medium"
    completed: bool = False
    tags: List[str] = []
    createdAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None


def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MIN)
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)


def verify_password(plain_password, password_hash):
    return pwd_context.verify(plain_password, password_hash)


def hash_password(password):
    return pwd_context.hash(password)


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


@app.on_event("startup")
async def on_startup():
    await migrate()


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    "insert into users (email, password_hash) values (%s, %s) returning id",
                    (user.email.strip().lower(), hash_password(user.password)),
                )
                user_id = cur.fetchone()[0]
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=400, detail="Email already registered") from e
    return Token(access_token=create_access_token(str(user_id)))


@app.post("/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email = form_data.username.strip().lower()
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("select id, password_hash from users where email=%s", (email,))
            row = cur.fetchone()
            if not row or not verify_password(form_data.password, row[1]):
                raise HTTPException(status_code=400, detail="Incorrect email or password")
            user_id = row[0]
    return Token(access_token=create_access_token(str(user_id)))


@app.get("/todos", response_model=List[Todo])
async def get_todos(user_id: str = Depends(get_current_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("select id, text, priority, completed, tags, created_at, completed_at from todos where user_id=%s order by created_at asc", (user_id,))
            rows = cur.fetchall()
            return [
                Todo(
                    id=r[0], text=r[1], priority=r[2], completed=r[3], tags=r[4] or [],
                    createdAt=r[5], completedAt=r[6]
                ) for r in rows
            ]


@app.put("/todos")
async def put_todos(items: List[Todo], user_id: str = Depends(get_current_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            try:
                cur.execute("delete from todos where user_id=%s", (user_id,))
                for t in items:
                    cur.execute(
                        """
                        insert into todos (id, user_id, text, priority, completed, tags, created_at, completed_at)
                        values (%s,%s,%s,%s,%s,%s,%s,%s)
                        on conflict (id) do update set
                          text=excluded.text,
                          priority=excluded.priority,
                          completed=excluded.completed,
                          tags=excluded.tags,
                          created_at=excluded.created_at,
                          completed_at=excluded.completed_at
                        """,
                        (
                            t.id,
                            user_id,
                            t.text,
                            t.priority,
                            t.completed,
                            list(t.tags or []),
                            t.createdAt or datetime.utcnow(),
                            t.completedAt,
                        ),
                    )
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise HTTPException(status_code=500, detail="Failed to save todos") from e
    return {"ok": True, "count": len(items)}


@app.delete("/todos")
async def clear_todos(user_id: str = Depends(get_current_user_id)):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("delete from todos where user_id=%s", (user_id,))
            conn.commit()
    return {"ok": True}


