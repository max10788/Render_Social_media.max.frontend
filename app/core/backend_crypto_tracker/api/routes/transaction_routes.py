from fastapi import APIRouter

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

# Beispiel-Route
@router.get("/")
async def list_transactions():
    return {"message": "transaction routes stub"}
