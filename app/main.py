from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.api.endpoints import router as api_router  # Importieren Sie den API-Router

# Initialisieren der FastAPI-Anwendung
app = FastAPI(
    title="Social Sentiment Analysis",
    description="Eine Anwendung zur Analyse von On-Chain-Sentimenten aus Social Media.",
    version="1.0.0"
)

# Mounten der statischen Dateien (CSS, JS, Bilder)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Laden der HTML-Templates
templates = Jinja2Templates(directory="app/templates")

# API-Router integrieren
app.include_router(api_router, prefix="/api", tags=["API"])

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
