from py2neo import Graph, Node, Relationship
from typing import Dict

class TransactionGraph:
    def __init__(self):
        self.graph = Graph("bolt://localhost:7687", auth=("neo4j", "password"))

    def create_transaction_node(self, tx: Dict):
        """Erstellt einen Transaktionsknoten im Graph"""
        tx_node = Node("Transaction", hash=tx["hash"], chain=tx["chain"], timestamp=tx["timestamp"])
        self.graph.create(tx_node)
        return tx_node

    def create_address_node(self, address: str, chain: str):
        """Erstellt einen Adressknoten"""
        addr_node = Node("Address", address=address, chain=chain)
        self.graph.merge(addr_node, "Address", "address")
        return addr_node

    def link_transaction_to_addresses(self, tx: Dict):
        """Verknüpft Transaktion mit Ein- und Ausgängen"""
        tx_node = self.create_transaction_node(tx)
        for inp in tx["parsed_data"]["inputs"]:
            addr_node = self.create_address_node(inp["address"], tx["chain"])
            self.graph.create(Relationship(addr_node, "SENDS_TO", tx_node))
        for out in tx["parsed_data"]["outputs"]:
            addr_node = self.create_address_node(out["address"], tx["chain"])
            self.graph.create(Relationship(tx_node, "SENDS_TO", addr_node))

# Beispiel-Nutzung:
if __name__ == "__main__":
    graph = TransactionGraph()
    parsed_tx = {
        "hash": "abc123...",
        "chain": "btc",
        "timestamp": "2025-07-23T12:00:00Z",
        "parsed_data": {
            "inputs": [{"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "value": 0.1}],
            "outputs": [{"address": "1HLoD9E4SDFFPDiYfNYk9R77p8A4k4qZV8", "value": 0.099}]
        }
    }
    graph.link_transaction_to_addresses(parsed_tx)
