from datetime import datetime

class BlockchainParser:
    def parse_transaction(self, blockchain, raw_data):
        if blockchain == "eth":
            return self._parse_eth_transaction(raw_data)
        elif blockchain == "btc":
            return self._parse_btc_transaction(raw_data)
        elif blockchain == "sol":
            return self._parse_sol_transaction(raw_data)
        else:
            raise ValueError(f"Unsupported blockchain: {blockchain}")
    
    def _parse_eth_transaction(self, raw_data):
        """Parse Ethereum transaction data from Etherscan API response."""
        # 1. Extrahiere grundlegende Transaktionsinformationen
        tx_hash = raw_data["hash"]
        timestamp = datetime.fromtimestamp(int(raw_data["timeStamp"]))
        
        # 2. Bestimme Quell- und Zieladressen
        from_address = raw_data["from"].lower()
        to_address = raw_data["to"].lower() if raw_data["to"] else None
        
        # 3. Berechne den übertragenen Betrag (in ETH)
        # Wert ist in Wei (10^-18 ETH)
        amount = float(raw_data["value"]) / 10**18
        
        # 4. Extrahiere Transaktionsstatus
        status = "success" if raw_data["isError"] == "0" and raw_data["txreceipt_status"] == "1" else "failed"
        
        # 5. Berechne die Gebühr
        gas = int(raw_data["gas"])
        gas_price = int(raw_data["gasPrice"])
        fee = (gas * gas_price) / 10**18  # in ETH
        
        # 6. Erstelle ein einheitliches Format für die Visualisierung
        return {
            "tx_hash": tx_hash,
            "chain": "eth",
            "timestamp": timestamp,
            "from_address": from_address,
            "to_address": to_address,
            "amount": amount,
            "currency": "ETH",
            "fee": fee,
            "status": status,
            "raw_data": raw_data
        }
    
    def _parse_btc_transaction(self, raw_data):
        """Parse Bitcoin transaction data from Blockchair API response."""
        # 1. Extrahiere grundlegende Transaktionsinformationen
        tx_hash = raw_data["data"]["hash"]
        timestamp = datetime.fromtimestamp(raw_data["data"]["time"])
        
        # 2. Verarbeite alle Inputs (Quelladressen)
        inputs = raw_data["data"]["inputs"]
        from_addresses = []
        total_input_value = 0
        
        for input in inputs:
            if "recipient" in input:
                from_addresses.append(input["recipient"])
            total_input_value += input["value"]
        
        # 3. Verarbeite alle Outputs (Zieladressen)
        outputs = raw_data["data"]["outputs"]
        to_addresses = []
        amounts = []
        total_output_value = 0
        
        for output in outputs:
            if "recipient" in output:
                to_addresses.append(output["recipient"])
                amounts.append(output["value"])
                total_output_value += output["value"]
        
        # 4. Berechne den übertragenen Betrag und die Gebühr
        # Die Gebühr ist die Differenz zwischen Input- und Output-Werten
        fee = (total_input_value - total_output_value) / 10**8  # in BTC
        amount = total_output_value / 10**8  # in BTC
        
        # 5. Bestimme die primäre Zieladresse (meist die erste mit Wert)
        to_address = None
        if outputs:
            for output in outputs:
                if "recipient" in output and output["value"] > 0:
                    to_address = output["recipient"]
                    break
        
        # 6. Erstelle ein einheitliches Format für die Visualisierung
        return {
            "tx_hash": tx_hash,
            "chain": "btc",
            "timestamp": timestamp,
            "from_address": from_addresses[0] if from_addresses else None,
            "to_address": to_address,
            "amount": amount,
            "currency": "BTC",
            "fee": fee,
            "status": "success",  # Bitcoin hat keinen expliziten Status
            "raw_data": raw_data
        }
    
    def _parse_sol_transaction(self, raw_data):
        """Parse Solana transaction data from Solana Web3 API response."""
        # 1. Extrahiere grundlegende Transaktionsinformationen
        tx_hash = raw_data["transaction"]["signatures"][0]
        block_time = raw_data["blockTime"]
        timestamp = datetime.fromtimestamp(block_time) if block_time else datetime.now()
        
        # 2. Extrahiere Account-Keys und Balances
        account_keys = [key["pubkey"] if isinstance(key, dict) else key for key in raw_data["transaction"]["message"]["accountKeys"]]
        pre_balances = raw_data["meta"]["preBalances"]
        post_balances = raw_data["meta"]["postBalances"]
        
        # 3. Bestimme Quell- und Zieladressen durch Balance-Vergleich
        from_address = None
        to_address = None
        amount = 0
        
        # Finde die Adresse mit Balance-Abnahme (Quelle)
        for i in range(len(account_keys)):
            if pre_balances[i] > post_balances[i]:
                from_address = account_keys[i]
                amount = (pre_balances[i] - post_balances[i]) / 1e9  # Lamports zu SOL
                break
        
        # Finde die Adresse mit Balance-Zunahme (Ziel)
        for i in range(len(account_keys)):
            if post_balances[i] > pre_balances[i]:
                to_address = account_keys[i]
                break
        
        # 4. Extrahiere Transaktionsstatus
        status = "failed" if raw_data["meta"]["err"] else "success"
        
        # 5. Berechne die Transaktionsgebühr
        fee = raw_data["meta"]["fee"] / 1e9  # Lamports zu SOL
        
        # 6. Erstelle ein einheitliches Format für die Visualisierung
        return {
            "tx_hash": tx_hash,
            "chain": "sol",
            "timestamp": timestamp,
            "from_address": from_address,
            "to_address": to_address,
            "amount": amount,
            "currency": "SOL",
            "fee": fee,
            "status": status,
            "raw_data": raw_data
        }
        
    def _get_next_transactions(self, blockchain, address, current_hash=None, limit=5):
        """
        Find next transactions in the chain for a given address.
        
        Args:
            blockchain: The blockchain type ('eth', 'btc', 'sol')
            address: The address to query
            current_hash: Optional current transaction hash to avoid duplicates
            limit: Maximum number of transactions to return
        
        Returns:
            List of transaction hashes
        """
        next_hashes = []
        
        if blockchain == "eth":
            # Für Ethereum: Verwende Etherscan API, um Transaktionen für die Adresse abzurufen
            # und finde Transaktionen, bei denen die Adresse als Absender auftaucht
            client = EtherscanETHClient()
            transactions = client.get_transactions_by_address(address, limit=limit)
            
            for tx in transactions:
                if current_hash and tx["hash"] == current_hash:
                    continue
                next_hashes.append(tx["hash"])
        
        elif blockchain == "btc":
            # Für Bitcoin: Verwende Blockchair API, um Transaktionen für die Adresse abzurufen
            # und finde Transaktionen, bei denen die Adresse als Input auftaucht
            client = BlockchairBTCClient()
            transactions = client.get_transactions_by_address(address, limit=limit)
            
            for tx in transactions:
                if current_hash and tx["hash"] == current_hash:
                    continue
                next_hashes.append(tx["hash"])
        
        elif blockchain == "sol":
            # Für Solana: Verwende Solana API, um Transaktionen für die Adresse abzurufen
            # und finde Transaktionen, bei denen die Adresse beteiligt ist
            client = SolanaAPIClient()
            transactions = client.get_transactions_by_address(address, limit=limit)
            
            for tx in transactions:
                if current_hash and tx["transaction"]["signatures"][0] == current_hash:
                    continue
                next_hashes.append(tx["transaction"]["signatures"][0])
        
        return next_hashes[:limit]
