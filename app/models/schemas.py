from pydantic import BaseModel

class SentimentResponse(BaseModel):
    query: str
    sentiment_score: float
