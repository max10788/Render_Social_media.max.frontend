import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from textblob import TextBlob
from datetime import datetime

def extract_features(tweets, transactions):
    """
    Extrahiert Features aus Tweets und Transaktionen.
    
    Args:
        tweets (list of dict): Liste von Tweets mit Text und Zeitstempel.
        transactions (list of dict): Liste von Transaktionen mit Betrag und Blockzeit.
    
    Returns:
        list: Eine Liste von kombinierten Feature-Vektoren.
    """
    # TF-IDF-Vektorisierung für Tweet-Texte
    vectorizer = TfidfVectorizer(max_features=50)
    tfidf_matrix = vectorizer.fit_transform([tweet["text"] for tweet in tweets])
    tfidf_features = tfidf_matrix.toarray()

    features = []
    for i, tweet in enumerate(tweets):
        # Sentiment-Score des Tweets
        sentiment_score = TextBlob(tweet["text"]).sentiment.polarity
        
        # Anzahl der Wörter im Tweet
        word_count = len(tweet["text"].split())
        
        # Überprüfen, ob der Tweet einen Betrag enthält
        has_amount = any(word.isdigit() for word in tweet["text"].split())

        for tx in transactions:
            # Zeitliche Nähe zwischen Tweet und Transaktion (in Minuten)
            time_since_tweet = (
                datetime.now() - datetime.fromtimestamp(tx["block_time"])
            ).total_seconds() / 60
            
            # Kombinierte Features für jedes Tweet-Transaktions-Paar
            combined_feature = np.concatenate([
                tfidf_features[i],
                [sentiment_score, word_count, has_amount, tx["amount"], time_since_tweet]
            ])
            features.append(combined_feature)
    return features


def generate_labels(tweets, transactions):
    """
    Generiert Labels basierend auf zeitlicher und betragsbezogener Korrelation.
    
    Args:
        tweets (list of dict): Liste von Tweets mit Text und Zeitstempel.
        transactions (list of dict): Liste von Transaktionen mit Betrag und Blockzeit.
    
    Returns:
        list: Eine Liste von Labels (1 = korreliert, 0 = nicht korreliert).
    """
    labels = []
    for tweet in tweets:
        for tx in transactions:
            if validate_temporal_correlation(tweet["created_at"], tx["block_time"]) and validate_amount_correlation(tweet.get("amount"), tx["amount"]):
                labels.append(1)  # Korreliert
            else:
                labels.append(0)  # Nicht korreliert
    return labels


def validate_temporal_correlation(tweet_time, block_time, threshold_minutes=30):
    """
    Validiert die zeitliche Korrelation zwischen einem Tweet und einer Transaktion.
    
    Args:
        tweet_time (datetime): Zeitpunkt des Tweets.
        block_time (float): Zeitpunkt der Transaktion als Unix-Timestamp.
        threshold_minutes (int): Maximal akzeptierte Zeitdifferenz in Minuten.
    
    Returns:
        bool: True, wenn die zeitliche Korrelation besteht, sonst False.
    """
    block_time = datetime.fromtimestamp(block_time)
    time_diff = abs((tweet_time - block_time).total_seconds() / 60)
    return time_diff <= threshold_minutes


def validate_amount_correlation(tweet_amount, transaction_amount, threshold=0.1):
    """
    Validiert die Betragskorrelation zwischen einem Tweet und einer Transaktion.
    
    Args:
        tweet_amount (float or None): Der Betrag im Tweet (falls vorhanden).
        transaction_amount (float): Der Betrag der Transaktion.
        threshold (float): Maximal akzeptierte Differenz zwischen den Beträgen.
    
    Returns:
        bool: True, wenn die Betragskorrelation besteht, sonst False.
    """
    if tweet_amount is None:
        return False
    return abs(tweet_amount - transaction_amount) <= threshold


def extract_amount(text):
    """
    Extrahiert einen Betrag aus einem Tweet-Text.
    
    Args:
        text (str): Der Text des Tweets.
    
    Returns:
        float or None: Der extrahierte Betrag oder None, falls kein Betrag gefunden wurde.
    """
    try:
        match = re.search(r"(\d+\.?\d*)\s?(SOL|ETH|BTC|USDT|USDC)", text.upper())
        return float(match.group(1)) if match else None
    except Exception:
        return None 
