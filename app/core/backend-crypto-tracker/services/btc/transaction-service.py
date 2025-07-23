def get_btc_transaction(tx_hash):
    url = BASE_URL.format(tx_hash=tx_hash)
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Beispiel: Transaktionsbetrag und Zeitstempel extrahieren
        return {
            "hash": tx_hash,
            "value": data["transactions"][0]["value"],
            "timestamp": data["transactions"][0]["time"]
        }
    else:
        raise Exception(f"BTC-API Fehler: {response.status_code}")
