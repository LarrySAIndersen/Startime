from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title="STAR Hub API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_base_url, "http://127.0.0.1:4319", "http://localhost:4319"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    return {"status": "ready"}


@app.get("/api/v1/me")
def me_dev() -> dict:
    """Dev stub until P0-02 JWT validation is wired."""
    return {
        "id": "00000000-0000-7000-8000-000000000001",
        "display_name": "Jan Vinding",
        "given_name": "Jan",
        "roles": ["employee", "manager", "admin"],
        "team": {"id": "t1", "name": "IT Operations"},
    }
