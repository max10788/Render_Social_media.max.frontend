import json
import os
import re
import asyncio
import aiohttp
import logging
from langdetect import detect
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.core.config import settings
import redis

# ==============================
# Logger und Redis-Initialisierung
# ==============================
logger = logging.getLogger(__name__)
redis_client = redis.from_url(settings.REDIS_URL)

# ==============================
# TwitterClient-Klasse
# ==============================
class TwitterClient:
    def __init__(self):
        self.client = None  # Wird bei Bedarf initialisiert
        self.analyzer = SentimentIntensityAnalyzer()

    # ==============================
    # Textverarbeitung
    # ==============================
    @staticmethod
    def normalize_text(text):
        """Entfernt URLs, Sonderzeichen, Emojis und konvertiert in Kleinbuchstaben."""
        text = re.sub(r"http\S+|www\S+", "", text)  # URLs entfernen
        text = re.sub(r"[^\w\s]", "", text)  # Sonderzeichen entfernen
        return text.lower()  # Kleinbuchstaben

    def tokenize_and_remove_stopwords(self, text, language="en"):
        """Tokenisiert den Text und entfernt Stop-Wörter basierend auf der Sprache."""
        try:
            stop_words = set(stopwords.words(language))
        except Exception:
            logger.warning(f"Sprache '{language}' nicht unterstützt. Fallback auf Englisch.")
            stop_words = set(stopwords.words("english"))

        tokens = word_tokenize(text)
        filtered_tokens = [word for word in tokens if word not in stop_words]
        return " ".join(filtered_tokens)

    # ==============================
    # Tweets abrufen
    # ==============================
    async def fetch_tweets_async(self, username, count):
        """Ruft Tweets asynchron ab."""
        url = f"https://api.twitter.com/2/users/by/username/{username}"
        headers = {"Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}"}
        params = {"user.fields": "id"}

        try:
            async with aiohttp.ClientSession() as session:
                # Step 1: Get User ID
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Fehler beim Abrufen der Benutzer-ID: Status {response.status}")
                        return []
                    user_data = await response.json()
                    user_id = user_data["data"]["id"]

                # Step 2: Get Tweets by User ID
                tweets_url = f"https://api.twitter.com/2/users/{user_id}/tweets"
                tweets_params = {"max_results": count, "tweet.fields": "created_at"}
                async with session.get(tweets_url, headers=headers, params=tweets_params) as tweets_response:
                    if tweets_response.status != 200:
                        logger.error(f"Fehler beim Abrufen von Tweets: Status {tweets_response.status}")
                        return []
                    tweets_data = await tweets_response.json()
                    return tweets_data.get("data", [])
        except Exception as e:
            logger.error(f"Fehler beim Abrufen von Tweets: {e}")
            return []

    # ==============================
    # Tweet-Attribute extrahieren
    # ==============================
    def extract_tweet_attributes(self, tweet_text):
        """Extrahiert relevante Attribute aus einem Tweet."""
        normalized_text = self.normalize_text(tweet_text)
        language = self.detect_language(normalized_text)
        processed_text = self.tokenize_and_remove_stopwords(normalized_text, language)

        return {
            "text": tweet_text,
            "processed_text": processed_text,
            "keywords": self.extract_keywords(processed_text),
            "amount": self.extract_amount(tweet_text),
            "addresses": self.extract_addresses(tweet_text),
            "hashtags": self.extract_hashtags(tweet_text),
            "links": self.extract_links(tweet_text)
        }

    def extract_keywords(self, text):
        """Extrahiert relevante Schlüsselwörter."""
        relevant_keywords = [
            "solana", "ethereum", "btc", "transfer", "send", "receive",
            "wallet", "transaction", "mint", "burn", "staking", "nft"
        ]
        return [word for word in text.split() if word.lower() in relevant_keywords]

    def extract_amount(self, text):
        """Extrahiert Beträge mit Einheiten (z. B. SOL, ETH, BTC)."""
        try:
            match = re.search(r"(\d+\.?\d*)\s?(SOL|ETH|BTC|USDT|USDC)", text.upper())
            return float(match.group(1)) if match else None
        except Exception as e:
            logger.error(f"Fehler beim Extrahieren des Betrags: {e}")
            return None

    def extract_addresses(self, text):
        """Extrahiert Ethereum- und Solana-Wallet-Adressen."""
        ethereum_addresses = re.findall(r"0x[a-fA-F0-9]{40}", text)
        solana_addresses = re.findall(r"[1-9A-HJ-NP-Za-km-z]{32,44}", text)
        return ethereum_addresses + solana_addresses

    def extract_hashtags(self, text):
        """Extrahiert Hashtags."""
        return re.findall(r"#\w+", text)

    def extract_links(self, text):
        """Extrahiert URLs."""
        return re.findall(r"https?://[^\s]+", text)

    # ==============================
    # Analysefunktionen
    # ==============================
    def analyze_sentiment(self, text):
        """Führt eine Sentiment-Analyse durch."""
        return self.analyzer.polarity_scores(text)

    def detect_language(self, text):
        """Erkennt die Sprache eines Textes."""
        try:
            return detect(text)
        except Exception:
            logger.warning("Spracherkennung fehlgeschlagen. Fallback auf Englisch.")
            return "en"

    # ==============================
    # Tweets mit Caching
    # ==============================
    async def fetch_and_cache_tweets(self, username, count):
        """
        Ruft Tweets ab und speichert sie im Cache.
        Args:
            username (str): Der Twitter-Benutzername.
            count (int): Die Anzahl der abzurufenden Tweets.
        Returns:
            list: Eine Liste verarbeiteter Tweets.
        """
        cache_key = f"tweets:{username}:{count}"
        cached_tweets = redis_client.get(cache_key)
        if cached_tweets:
            logger.info(f"Tweets für '{username}' aus dem Cache geladen.")
            return json.loads(cached_tweets)

        tweets = await self.fetch_tweets_async(username, count)
        processed_tweets = [self.extract_tweet_attributes(tweet["text"]) for tweet in tweets]

        redis_client.set(cache_key, json.dumps(processed_tweets), ex=3600)  # Cache für 1 Stunde
        logger.info(f"{len(processed_tweets)} Tweets für '{username}' gespeichert.")
        return processed_tweets

    # ==============================
    # Tweets ohne Caching
    # ==============================
    async def fetch_tweets_by_user(self, username, count):
        """
        Ruft Tweets für einen Benutzer ab, ohne Caching.
        Args:
            username (str): Der Twitter-Benutzername.
            count (int): Die Anzahl der abzurufenden Tweets.
        Returns:
            list: Eine Liste verarbeiteter Tweets.
        """
        # URL für den Abruf der Benutzer-ID
        user_url = f"https://api.twitter.com/2/users/by/username/{username}"
        headers = {"Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}"}
        params = {"user.fields": "id"}

        try:
            async with aiohttp.ClientSession() as session:
                # Step 1: Get User ID
                async with session.get(user_url, headers=headers, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Fehler beim Abrufen der Benutzer-ID: Status {response.status}")
                        return []
                    user_data = await response.json()
                    user_id = user_data["data"]["id"]

                # Step 2: Get Tweets by User ID
                tweets_url = f"https://api.twitter.com/2/users/{user_id}/tweets"
                tweets_params = {"max_results": count, "tweet.fields": "created_at"}
                async with session.get(tweets_url, headers=headers, params=tweets_params) as tweets_response:
                    if tweets_response.status != 200:
                        logger.error(f"Fehler beim Abrufen von Tweets: Status {tweets_response.status}")
                        return []
                    tweets_data = await tweets_response.json()
                    return tweets_data.get("data", [])
        except Exception as e:
            logger.error(f"Fehler beim Abrufen von Tweets: {e}")
            return []

# ==============================
# Hilfsfunktion: Tweets in Datei speichern
# ==============================
def save_tweets_to_file(tweets, save_path="data/tweets.json"):
    """Speichert Tweets im JSON-Format."""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(tweets, f, ensure_ascii=False, indent=4)
    logger.info(f"{len(tweets)} Tweets wurden gespeichert in {save_path}")
