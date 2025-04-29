import requests
import json

def analyze_blockchain_twitter(api_url):
    """
    Sendet eine POST-Anfrage an den FastAPI-Endpunkt zur Analyse.
    """
    # Anfrage-Daten
    payload = {
        "blockchain": "ethereum",
        "contract_address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        "keywords": ["Uniswap", "UNI", "DEX"],
        "start_date": "2023-01-01",
        "end_date": "2023-01-31",
        "tweet_limit": 2000
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # POST-Anfrage senden
    response = requests.post(
        f"{api_url}/analyze/rule-based",
        data=json.dumps(payload),
        headers=headers
    )
    
    # Ergebnis verarbeiten
    if response.status_code == 201:
        result = response.json()
        print("Analyse erfolgreich!")
        print(f"Analyse-ID: {result['analysis_id']}")
        print(f"Sentiment-Score: {result['sentiment_score']}")
        print(f"Korrelations-Score: {result['correlation_results']['correlation_score']}")
    else:
        print(f"Fehler: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    analyze_blockchain_twitter("http://localhost:8000")
