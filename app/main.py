# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from fastapi.responses import JSONResponse

# Router-Imports
from app.core.backend_crypto_tracker.api.routes.custom_analysis_routes import (
    router as custom_analysis_router,
)
from app.core.backend_crypto_tracker.api.routes import transaction_routes

from app.core.config import Settings, get_settings
from app.core.database import init_db

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI application."""
    settings = get_settings()
    init_db()
    logger.info(f"Starting {settings.PROJECT_NAME}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")

# ------------------------------------------------------------------
# FastAPI-Instanz
# ------------------------------------------------------------------
app = FastAPI(
    title="Social Media & Blockchain Analysis",
    description="Enterprise-grade social media and blockchain analysis system",
    version="1.0.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------
# CORS (Render: nur notwendig, wenn du zusätzlich von extern zugreifst)
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # für Production lieber explizit setzen!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Statische Dateien aus dem gebauten Frontend
# ------------------------------------------------------------------
# Wichtig: "frontend/dist" muss Teil des Docker-Images / Render-Builds sein!
BUILD_DIR = "frontend/dist"
if not os.path.isdir(BUILD_DIR):
    logger.warning(f"Frontend build directory '{BUILD_DIR}' not found!")

# Assets (JS, CSS, Bilder)
app.mount("/assets", StaticFiles(directory=f"{BUILD_DIR}/assets"), name="assets")

# ------------------------------------------------------------------
# Router
# ------------------------------------------------------------------
app.include_router(custom_analysis_router, prefix="/api")
app.include_router(transaction_routes.router, prefix="/api")

# ------------------------------------------------------------------
# API-Health-Check
# ------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "social_analysis": "active",
            "blockchain_tracking": "active",
        },
    }

# ------------------------------------------------------------------
# SPA-Frontend ausliefern
# ------------------------------------------------------------------
@app.get("/", response_class=FileResponse)
async def serve_root():
    return FileResponse(f"{BUILD_DIR}/index.html")

@app.get("/{full_path:path}", response_class=FileResponse)
async def serve_spa(full_path: str):
    # Falls eine echte Datei existiert (z. B. /favicon.ico), dann die Datei liefern
    file_path = os.path.join(BUILD_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Ansonsten index.html für React-Router
    return FileResponse(f"{BUILD_DIR}/index.html")

# ------------------------------------------------------------------
# Globaler Exception-Handler
# ------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if app.debug else "An unexpected error occurred",
        },
    )
