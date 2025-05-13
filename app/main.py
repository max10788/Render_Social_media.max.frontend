from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router  # Importieren Sie den API-Router

app = FastAPI()

# CORS konfigurieren (optional, falls benötigt)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Erlaubt alle Ursprünge
    allow_credentials=True,
    allow_methods=["*"],  # Erlaubt alle HTTP-Methoden
    allow_headers=["*"],  # Erlaubt alle Header
)

# Mounten der statischen Dateien (CSS, JS, Bilder)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Laden der HTML-Templates
templates = Jinja2Templates(directory="app/templates")

app.include_router(api_router, prefix="/api", tags=["API"])  # Registers routes with /api prefix

# Route für die Startseite
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """
    Zeigt die Startseite der Anwendung an.
    """
    return templates.TemplateResponse("index.html", {"request": request})

# Optional: Health-Check-Endpunkt für Monitoring
@app.get("/health", response_model=dict)
async def health_check():
    """
    Einfacher Health-Check-Endpunkt, um den Status der Anwendung zu überprüfen.
    """
    return {"status": "ok"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred. Please try again later."},
    )
