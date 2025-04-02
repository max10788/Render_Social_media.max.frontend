import sys
import os

# Fügen Sie den Pfad zum Projektverzeichnis hinzu
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from fastapi import FastAPI
from api.endpoints import router

app = FastAPI()

# Registrieren der API-Routen
app.include_router(router)
