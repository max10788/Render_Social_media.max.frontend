# app/routes/transaction_routes.py
from fastapi import APIRouter, Body
from app.controllers.transaction_controller import track_transaction

router = APIRouter()

@router.post("/track")
def track(hash: str = Body(...), blockchain: str = Body(...)):
    return track_transaction(hash, blockchain)
