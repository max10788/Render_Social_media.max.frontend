# app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from fastapi.responses import JSONResponse

# Importiere die Router
# Stelle sicher, dass dieser Importpfad korrekt ist.
# Wenn custom_analysis_routes.py direkt in routes liegt, könnte es sein, dass du
# from app.core.backend_crypto_tracker.api.routes import custom_analysis_routes
# und dann custom_analysis_routes.router verwenden musst.
# ODER wenn der Import unten korrekt ist, ist der Name 'router'
from app.core.backend_crypto_tracker.api.routes.custom_analysis_routes import router as custom_analysis_router
# ✅ Importiere den transaction_router (Stelle sicher, dass der Importpfad und der Name (.router) stimmen)
from app.core.backend_crypto_tracker.api.routes import transaction_routes
# Fehlt hier der Import für api_router?
# from app.api.api_v1.api import api_router # Beispiel, passe den Pfad an

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

# ***** WICHTIG: Erstelle die app-Instanz zuerst *****
app = FastAPI(
    title="Social Media & Blockchain Analysis",
    description="Enterprise-grade social media and blockchain analysis system",
    version="1.0.0",
    lifespan=lifespan
)
# ***** ENDE: Erstellung der app-Instanz *****

# CORS configuration - Jetzt ist 'app' definiert
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and templates - Jetzt ist 'app' definiert
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# ***** WICHTIG: Registriere die Router NACH der app-Erstellung *****
# Registriere den custom_analysis_router
app.include_router(custom_analysis_router) # <-- Dies sollte jetzt funktionieren

# Registriere andere Router
# Stelle sicher, dass 'api_router' importiert ist
# app.include_router(api_router, prefix="/api/v1", tags=["API"])
# app.include_router(api_router, prefix="/api")  # Optional: Legacy-Route

# Registriere den transaction_routes.router
# Stelle sicher, dass der Importpfad und der Name (.router) korrekt sind
app.include_router(transaction_routes.router, prefix="/api")
# ***** ENDE: Router-Registrierung *****

# Endpunkte
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Application root endpoint."""
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "social_analysis": "active",
            "blockchain_tracking": "active"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc) if app.debug else "An unexpected error occurred" # app ist jetzt im Scope
        }
    )
