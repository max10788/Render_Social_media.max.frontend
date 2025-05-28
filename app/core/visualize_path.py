import networkx as nx
import matplotlib.pyplot as plt

def visualize_transaction_path(transactions: list):
    G = nx.DiGraph()

    for tx in transactions:
        G.add_edge(tx.from_wallet, tx.to_wallet, label=f"{tx.amount:.4f} SOL", tx_hash=tx.tx_hash)

    pos = nx.spring_layout(G, seed=42)

    plt.figure(figsize=(12, 8))
    nx.draw(G, pos, with_labels=True, node_size=1000, node_color='skyblue', font_size=10, font_weight='bold', arrows=True)
    edge_labels = nx.get_edge_attributes(G, 'label')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)

    plt.title("Transaktionspfad")
    plt.tight_layout()
    plt.show()
