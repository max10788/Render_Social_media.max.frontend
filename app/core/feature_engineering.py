from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from scipy.sparse import hstack
import json
import numpy as np

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

def vectorize_tweets(input_path="data/cleaned_tweets.json", max_features=500):
    """
    Wandelt Tweets in numerische Vektoren um (TF-IDF).
    
    Args:
        input_path: Der Pfad zur bereinigten Tweets-Datei (Standard: data/cleaned_tweets.json).
        max_features: Maximale Anzahl von Features für TF-IDF (Standard: 500).
    
    Returns:
        tuple: Tupel aus den Tweet-Vektoren und dem Vectorizer.
    """
    # Laden der bereinigten Tweets
    with open(input_path, "r", encoding="utf-8") as f:
        cleaned_tweets = json.load(f)

    # Extrahieren der Tweet-Texte
    tweet_texts = [tweet["text"] for tweet in cleaned_tweets]

    # TF-IDF-Vektorisierung
    vectorizer = TfidfVectorizer(max_features=max_features)
    tweet_vectors = vectorizer.fit_transform(tweet_texts)

    return tweet_vectors, vectorizer


def normalize_numerical_features(features):
    """
    Normalisiert numerische Features.
    
    Args:
        features: Eine Liste oder ein Array mit numerischen Features.
    
    Returns:
        np.ndarray: Normalisierte Features.
    """
    scaler = MinMaxScaler()
    normalized_features = scaler.fit_transform(np.array(features).reshape(-1, 1))
    return normalized_features.flatten()


def combine_features(tweet_vectors, numerical_features):
    """
    Kombiniert textuelle und numerische Features.
    
    Args:
        tweet_vectors: Die TF-IDF-Vektoren der Tweets.
        numerical_features: Die normalisierten numerischen Features.
    
    Returns:
        scipy.sparse.csr_matrix: Kombinierte Features.
    """
    # Kombinieren der Features
    combined_features = hstack([tweet_vectors, numerical_features.reshape(-1, 1)])
    return combined_features
