from fastapi import FastAPI
from app.api.endpoints import router

app = FastAPI()

# Registrieren der API-Routen
app.include_router(router)
