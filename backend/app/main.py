from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import bets, challenges, health


def create_app() -> FastAPI:
    init_db()

    app = FastAPI(title="Challenge Market API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(challenges.router, prefix=settings.api_prefix)
    app.include_router(bets.router, prefix=settings.api_prefix)

    return app


app = create_app()
