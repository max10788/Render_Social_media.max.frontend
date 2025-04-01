import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

def test_analyze_sentiment(client):
    response = client.post("/analyze", json={"query": "Python programming"})
    assert response.status_code == 200
    data = response.json()
    assert "query" in data
    assert "sentiment_score" in data
