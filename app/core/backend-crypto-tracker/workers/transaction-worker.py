@shared_task
def process_transaction_chain(chain: str, tx_hash: str, depth: int):
    """Asynchrone Verarbeitung von Transaktionsketten"""
    parser = BlockchainParser()
    db = SessionLocal()
    
    try:
        # 1. Transaktion abrufen
        if chain == "btc":
            client = BlockchairBTCClient()
        elif chain == "eth":
            client = EtherscanETHClient()
        elif chain == "sol":
            client = SolanaAPIClient()
        
        raw_data = client.get_transaction(tx_hash)
        parsed_data = parser.parse_transaction(chain, raw_data)
        
        # 2. In DB speichern
        db.add(Transaction(
            hash=parsed_data["tx_hash"],
            chain=parsed_data["chain"],
            timestamp=parsed_data["timestamp"],
            raw_data=raw_data,
            parsed_data=parsed_data
        ))
        db.commit()
        
        # 3. Rekursive Verarbeitung (falls depth > 1)
        if depth > 1 and parsed_data.get("next_hashes"):
            for next_hash in parsed_data["next_hashes"][:5]:  # Max. 5 nächste Transaktionen
                process_transaction_chain.delay(chain, next_hash, depth - 1)
                
    except Exception as e:
        logger.error(f"Fehler bei der Verarbeitung: {str(e)}")
    finally:
        db.close()
