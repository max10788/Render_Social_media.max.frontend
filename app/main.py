# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

# Router-Imports
from app.core.backend_crypto_tracker.api.routes.custom_analysis_routes import (
    router as custom_analysis_router,
)
from app.core.backend_crypto_tracker.api.routes import token_routes
from app.core.backend_crypto_tracker.api.routes import transaction_routes
from app.core.backend_crypto_tracker.api.routes import scanner_routes

# Konfiguration und Datenbank
from app.core.backend_crypto_tracker.config.database import database_config
from app.core.backend_crypto_tracker.processor.database.models.manager import DatabaseManager
from app.core.backend_crypto_tracker.utils.logger import get_logger

logger = get_logger(__name__)

# Frontend-Verzeichnisse konfigurieren
BASE_DIR = Path(__file__).resolve().parent  # app/
FRONTEND_DIR = BASE_DIR / "crypto-token-analysis-dashboard"  # app/crypto-token-analysis-dashboard
BUILD_DIR = FRONTEND_DIR / "dist"  # Next.js export directory
ASSETS_DIR = BUILD_DIR / "static"   # Changed from _next to static

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI application."""
    logger.info("Starting Low-Cap Token Analyzer")
    
    # Initialisiere die Datenbank
    try:
        db_manager = DatabaseManager()
        await db_manager.initialize()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.info("Continuing without database...")
    
    yield
    logger.info("Shutting down Low-Cap Token Analyzer")

# ------------------------------------------------------------------
# FastAPI-Instanz
# ------------------------------------------------------------------
app = FastAPI(
    title="Low-Cap Token Analyzer",
    description="Enterprise-grade low-cap cryptocurrency token analysis system",
    version="1.0.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------
# CORS (Anpassen für Production)
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In Production: spezifische Domain eintragen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Statische Dateien aus dem gebauten Frontend
# ------------------------------------------------------------------
# Update these paths in main.py
BUILD_DIR = FRONTEND_DIR / ".next"  # Next.js default build directory

# Serve static files from Next.js build
if (BUILD_DIR / "static").exists():
    app.mount("/_next/static", StaticFiles(directory=BUILD_DIR / "static"), name="next_static")

# Serve Next.js build files
if (BUILD_DIR).exists():
    templates = Jinja2Templates(directory=BUILD_DIR / "server/pages")
    
    @app.get("/{full_path:path}")
    async def serve_nextjs(request: Request, full_path: str):
        try:
            # Try to serve static files first
            static_path = BUILD_DIR / "static" / full_path
            if static_path.exists():
                return FileResponse(static_path)
            
            # Serve HTML pages
            if not full_path or full_path == "/":
                full_path = "index.html"
            elif not Path(full_path).suffix:
                full_path += ".html"
                
            page_path = BUILD_DIR / "server/pages" / full_path
            if page_path.exists():
                return templates.TemplateResponse(full_path, {"request": request})
                
            # Fallback to index.html for client-side routing
            index_path = BUILD_DIR / "server/pages/index.html"
            if index_path.exists():
                return templates.TemplateResponse("index.html", {"request": request})
                
            return JSONResponse({"error": "Page not found"}, status_code=404)
        except Exception as e:
            logger.error(f"Error serving page: {e}")
            return JSONResponse({"error": "Internal server error"}, status_code=500)
# ------------------------------------------------------------------
# Router
# ------------------------------------------------------------------
app.include_router(custom_analysis_router, prefix="/api/v1")
app.include_router(token_routes.router, prefix="/api/v1")
app.include_router(transaction_routes.router, prefix="/api/v1")
app.include_router(scanner_routes.router, prefix="/api/v1")

# ------------------------------------------------------------------
# API-Health-Check
# ------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "token_analyzer": "active",
            "blockchain_tracking": "active",
        },
        "database": {
            "host": database_config.db_host,
            "database": database_config.db_name,
            "schema": database_config.schema_name,
        }
    }

# ------------------------------------------------------------------
# SPA-Frontend ausliefern (mit Fehlerbehandlung)
# ------------------------------------------------------------------
@app.get("/", response_class=FileResponse)
async def serve_root():
    index_path = BUILD_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    else:
        logger.error(f"Frontend index.html not found at {index_path}")
        return JSONResponse(
            status_code=503,
            content={
                "error": "Service Unavailable",
                "message": "Frontend not built. Please run 'npm run build' in the frontend directory.",
                "build_directory": str(BUILD_DIR),
                "frontend_directory": str(FRONTEND_DIR)
            }
        )

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Prüfe, ob eine echte Datei existiert (z. B. /favicon.ico)
    file_path = BUILD_DIR / full_path
    
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Ansonsten index.html für React-Router
    index_path = BUILD_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    else:
        logger.error(f"Frontend index.html not found at {index_path}")
        return JSONResponse(
            status_code=503,
            content={
                "error": "Service Unavailable",
                "message": "Frontend not built. Please run 'npm run build' in the frontend directory.",
                "build_directory": str(BUILD_DIR),
                "frontend_directory": str(FRONTEND_DIR)
            }
        )

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
