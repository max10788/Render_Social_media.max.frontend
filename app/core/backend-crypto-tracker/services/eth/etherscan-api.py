def get_eth_transaction(tx_hash):
    url = BASE_URL.format(tx_hash=tx_hash)
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        # Beispiel: Sender, Empfänger, Wert extrahieren
        return {
            "from": data["result"]["from"],
            "to": data["result"]["to"],
            "value": int(data["result"]["value"], 16) / 1e18  # Wei in ETH
        }
    else:
        raise Exception(f"ETH-API Fehler: {response.status_code}")
