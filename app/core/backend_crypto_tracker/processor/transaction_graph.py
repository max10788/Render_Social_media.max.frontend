"""
Erstellt einen gerichteten Graphen aus Transaktionen (NetworkX optional).
"""
import networkx as nx
from typing import List, Dict
from processor.database.models.transaction import Transaction

class TransactionGraph:
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_transaction(self, tx: Transaction):
        self.graph.add_edge(
            tx.from_address,
            tx.to_address,
            hash=tx.hash,
            value=float(tx.value),
            timestamp=tx.timestamp,
        )

    def get_neighbors(self, address: str, depth: int = 1) -> Dict:
        """Gibt {address: {neighbors}, …} bis Tiefe `depth`."""
        if not self.graph.has_node(address):
            return {}
        sub = nx.ego_graph(self.graph, address, radius=depth)
        return nx.node_link_data(sub)
