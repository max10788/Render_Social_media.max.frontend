from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Initialisieren der FastAPI-Anwendung
app = FastAPI()

# Mounten der statischen Dateien (CSS, JS, Bilder)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Laden der HTML-Templates
templates = Jinja2Templates(directory="app/templates")

# Route für die Startseite
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Beispiel für einen API-Endpunkt
@app.post("/analyze")
async def analyze_sentiment(query: dict):
    # Beispiel: Sentiment-Analyse durchführen
    sentiment_score = 0.85  # Ersetzen Sie dies durch Ihre Logik
    return {"query": query.get("query"), "sentiment_score": sentiment_score}
