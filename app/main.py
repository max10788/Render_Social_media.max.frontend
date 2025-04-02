import sys
import os

# Fügen Sie den Pfad zum Projektverzeichnis hinzu
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from fastapi import FastAPI
from api.endpoints import router

# Initialisieren der FastAPI-Anwendung
app = FastAPI()

# Optionale Wurzelroute für eine Willkommensnachricht
@app.get("/")
def read_root():
    return {"message": "Welcome to the Social Sentiment Analysis API!"}

# Registrieren der API-Routen
app.include_router(router)
