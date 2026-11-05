"""
Torneo — Smart Sports Tournament Management & DSA Visualization Platform
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
import app.models  # noqa: F401 — ensure all models are registered

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Sports Tournament Management & DSA Visualization Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.api.auth import router as auth_router
from app.api.tournaments import router as tournament_router
from app.api.teams import teams_router, tournament_teams_router
from app.api.matches import router as match_router, bracket_router, tree_router, graph_router
from app.api.misc import (
    rankings_router, venues_router, analytics_router,
    export_router, notifications_router,
)

PREFIX = settings.API_V1_STR

app.include_router(auth_router, prefix=f"{PREFIX}")
app.include_router(tournament_router, prefix=f"{PREFIX}")
app.include_router(teams_router, prefix=f"{PREFIX}")
app.include_router(tournament_teams_router, prefix=f"{PREFIX}")
app.include_router(match_router, prefix=f"{PREFIX}")
app.include_router(bracket_router, prefix=f"{PREFIX}")
app.include_router(tree_router, prefix=f"{PREFIX}")
app.include_router(graph_router, prefix=f"{PREFIX}")
app.include_router(rankings_router, prefix=f"{PREFIX}")
app.include_router(venues_router, prefix=f"{PREFIX}")
app.include_router(analytics_router, prefix=f"{PREFIX}")
app.include_router(export_router, prefix=f"{PREFIX}")
app.include_router(notifications_router, prefix=f"{PREFIX}")


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": "Every Match. Every Move. Every Champion.",
        "docs": "/api/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "version": settings.VERSION}
