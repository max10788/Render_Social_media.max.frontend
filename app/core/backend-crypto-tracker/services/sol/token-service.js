def get_sol_transaction(tx_hash):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getConfirmedTransaction",
        "params": [tx_hash]
    }
    response = requests.post(SOLANA_RPC_URL, json=payload)
    if response.status_code == 200:
        result = response.json()["result"]
        # Beispiel: Signer und Token-Transfer extrahieren
        return {
            "signers": result["transaction"]["message"]["accountKeys"],
            "token_transfers": result["meta"]["postTokenBalances"]
        }
    else:
        raise Exception(f"SOL-API Fehler: {response.status_code}")
