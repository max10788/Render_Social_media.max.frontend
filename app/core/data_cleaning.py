import json
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Globale Variablen
stop_words = set(stopwords.words("english"))

def clean_tweet(text):
    """
    Bereinigt einen Tweet-Text.
    
    Args:
        text: Der Text des Tweets.
    
    Returns:
        str: Der bereinigte Text.
    """
    # Entfernen von URLs
    text = re.sub(r"http\S+|www\S+", "", text)
    # Entfernen von Sonderzeichen und Emojis
    text = re.sub(r"[^\w\s]", "", text)
    # Konvertieren in Kleinbuchstaben
    text = text.lower()
    # Tokenisieren und Stop-Wörter entfernen
    tokens = word_tokenize(text)
    filtered_tokens = [word for word in tokens if word not in stop_words]
    return " ".join(filtered_tokens)

def extract_amount(text):
    """
    Extrahiert Beträge aus einem Tweet.
    
    Args:
        text: Der Text des Tweets.
    
    Returns:
        float: Der extrahierte Betrag oder None, wenn kein Betrag gefunden wurde.
    """
    match = re.search(r"(\d+\.?\d*)\s?(SOL|ETH|BTC)", text.upper())
    return float(match.group(1)) if match else None

def clean_and_enhance_tweets(input_path="data/tweets.json", output_path="data/cleaned_tweets.json"):
    """
    Bereinigt Tweets und speichert sie im JSON-Format.
    
    Args:
        input_path: Der Pfad zur Eingabedatei (Standard: data/tweets.json).
        output_path: Der Pfad zur Ausgabedatei (Standard: data/cleaned_tweets.json).
    """
    # Laden der Tweets aus der Datei
    with open(input_path, "r", encoding="utf-8") as f:
        tweets = json.load(f)

    # Bereinigen der Tweets
    cleaned_tweets = []
    for tweet in tweets:
        cleaned_text = clean_tweet(tweet["text"])
        amount = extract_amount(tweet["text"])
        cleaned_tweets.append({
            "text": cleaned_text,
            "amount": amount,
            "keywords": tweet.get("keywords", []),
            "addresses": tweet.get("addresses", []),
            "hashtags": tweet.get("hashtags", []),
            "links": tweet.get("links", [])
        })

    # Speichern der bereinigten Tweets
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_tweets, f, ensure_ascii=False, indent=4)
    print(f"{len(cleaned_tweets)} Tweets wurden bereinigt und gespeichert.")

def clean_on_chain_data(input_path="data/on_chain_data.json", output_path="data/cleaned_on_chain_data.json"):
    """
    Bereinigt On-Chain-Daten und speichert sie im JSON-Format.
    
    Args:
        input_path: Der Pfad zur Eingabedatei (Standard: data/on_chain_data.json).
        output_path: Der Pfad zur Ausgabedatei (Standard: data/cleaned_on_chain_data.json).
    """
    # Laden der On-Chain-Daten aus der Datei
    with open(input_path, "r", encoding="utf-8") as f:
        on_chain_data = json.load(f)

    # Bereinigen der On-Chain-Daten
    cleaned_data = []
    for tx in on_chain_data:
        # Standardisieren der Beträge
        amount = float(tx.get("amount", 0))
        block_time = int(tx.get("blockTime", 0))

        # Entfernen von fehlenden Daten
        if amount == 0 or block_time == 0:
            continue

        cleaned_data.append({
            "transaction_id": tx.get("signature", tx.get("hash")),
            "amount": amount,
            "block_time": block_time,
            "wallet_address": tx.get("wallet_address"),
            "description": tx.get("description", "")
        })

    # Speichern der bereinigten On-Chain-Daten
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=4)
    print(f"{len(cleaned_data)} Transaktionen wurden bereinigt und gespeichert.")

def merge_data(
    tweets_path="data/cleaned_tweets.json",
    on_chain_data_path="data/cleaned_on_chain_data.json",
    output_path="data/merged_data.json"
):
    """
    Führt Tweets und On-Chain-Daten basierend auf zeitlicher Korrelation zusammen.
    
    Args:
        tweets_path: Der Pfad zur bereinigten Tweets-Datei (Standard: data/cleaned_tweets.json).
        on_chain_data_path: Der Pfad zur bereinigten On-Chain-Daten-Datei (Standard: data/cleaned_on_chain_data.json).
        output_path: Der Pfad zur Ausgabedatei (Standard: data/merged_data.json).
    """
    # Laden der bereinigten Daten
    with open(tweets_path, "r", encoding="utf-8") as f:
        cleaned_tweets = json.load(f)
    with open(on_chain_data_path, "r", encoding="utf-8") as f:
        cleaned_on_chain_data = json.load(f)

    # Zusammenführen der Daten
    merged_data = []
    for tweet in cleaned_tweets:
        for tx in cleaned_on_chain_data:
            # Zeitliche Korrelation (innerhalb einer Stunde)
            if abs(tx["block_time"] - tweet.get("created_at", 0)) < 3600:
                merged_data.append({
                    "tweet_text": tweet["text"],
                    "tweet_amount": tweet["amount"],
                    "tx_id": tx["transaction_id"],
                    "tx_amount": tx["amount"],
                    "tx_time": tx["block_time"],
                    "wallet_address": tx["wallet_address"]
                })

    # Speichern der zusammengeführten Daten
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=4)
    print(f"{len(merged_data)} Datensätze wurden zusammengeführt und gespeichert.")
