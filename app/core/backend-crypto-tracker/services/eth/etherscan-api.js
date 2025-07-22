# app/services/eth/etherscan_api.py
import requests
import os

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")

def fetch_transaction(hash: str):
    url = "https://api.etherscan.io/api "
    params = {
        "module": "proxy",
        "action": "eth_getTransactionByHash",
        "txhash": hash,
        "apikey": ETHERSCAN_API_KEY
    }
    response = requests.get(url, params=params)
    return response.json().get("result")
