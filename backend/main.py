"""
ColdReach API — Consolidated FastAPI backend.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_URL
from database import init_db
from routers import auth_router, profile_router, contacts_router, smtp_router, campaign_router, dashboard_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    init_db()
    logging.getLogger(__name__).info("🚀 ColdReach API ready — DB initialized")
    yield


app = FastAPI(
    title="ColdReach API",
    description="AI-powered cold email automation backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api
app.include_router(auth_router.router, prefix="/api")
app.include_router(profile_router.router, prefix="/api")
app.include_router(contacts_router.router, prefix="/api")
app.include_router(smtp_router.router, prefix="/api")
app.include_router(campaign_router.router, prefix="/api")
app.include_router(dashboard_router.router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok", "service": "ColdReach API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
