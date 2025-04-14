from sklearn.feature_extraction.text import TfidfVectorizer
import json

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
