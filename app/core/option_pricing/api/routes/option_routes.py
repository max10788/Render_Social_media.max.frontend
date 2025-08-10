from fastapi import APIRouter, HTTPException
from .models import BasketOptionRequest, PricingResponse
from ..core.pricing import OptionPricingService
from ..utils.exceptions import PricingError, DataUnavailableError

router = APIRouter()
pricing_service = OptionPricingService()

@router.post("/calculate_basket_option", response_model=PricingResponse)
async def calculate_basket_option(request: BasketOptionRequest):
    try:
        result = pricing_service.calculate_basket_option_price(request.dict())
        return PricingResponse(**result)
    except DataUnavailableError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PricingError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "healthy"}
