import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from textblob import TextBlob
from datetime import datetime

from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from textblob import TextBlob
from datetime import datetime

def extract_features(tweets, transactions):
    vectorizer = TfidfVectorizer(max_features=50)
    tfidf_matrix = vectorizer.fit_transform([tweet["text"] for tweet in tweets])
    tfidf_features = tfidf_matrix.toarray()

    features = []
    for i, tweet in enumerate(tweets):
        sentiment_score = TextBlob(tweet["text"]).sentiment.polarity
        word_count = len(tweet["text"].split())
        has_amount = any(word.isdigit() for word in tweet["text"].split())

        for tx in transactions:
            time_since_tweet = (datetime.now() - datetime.fromtimestamp(tx["block_time"])).total_seconds() / 60
            combined_feature = np.concatenate([
                tfidf_features[i],
                [sentiment_score, word_count, has_amount, tx["amount"], time_since_tweet]
            ])
            features.append(combined_feature)
    return features

def generate_labels(tweets, transactions):
    labels = []
    for tweet in tweets:
        for tx in transactions:
            if validate_temporal_correlation(tweet["created_at"], tx["block_time"]) and validate_amount_correlation(tweet.get("amount"), tx["amount"]):
                labels.append(1)  # Korreliert
            else:
                labels.append(0)  # Nicht korreliert
    return labels

def validate_temporal_correlation(tweet_time, block_time, threshold_minutes=30):
    """Validiert die zeitliche Korrelation zwischen Tweet und Transaktion."""
    time_diff = abs((tweet_time - block_time).total_seconds() / 60)
    return time_diff <= threshold_minutes

def validate_amount_correlation(tweet_amount, transaction_amount, threshold=0.1):
    """Validiert die Betragskorrelation zwischen Tweet und Transaktion."""
    if tweet_amount is None or transaction_amount is None:
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
