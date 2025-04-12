import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import tweepy

class TwitterClient:
    def __init__(self):
        self.client = tweepy.Client(bearer_token="YOUR_TWITTER_BEARER_TOKEN")
        self.analyzer = SentimentIntensityAnalyzer()
        self.stop_words = set(stopwords.words("english"))

    @staticmethod
    def normalize_text(text):
        # Entfernen von URLs
        text = re.sub(r"http\S+|www\S+", "", text)
        # Entfernen von Sonderzeichen und Emojis
        text = re.sub(r"[^\w\s]", "", text)
        # Konvertieren in Kleinbuchstaben
        text = text.lower()
        return text

    @staticmethod
    def tokenize_and_remove_stopwords(text, stop_words):
        tokens = word_tokenize(text)
        filtered_tokens = [word for word in tokens if word not in stop_words]
        return " ".join(filtered_tokens)

    def fetch_tweets_by_user(self, username, count):
        try:
            user = self.client.get_user(username=username)
            user_id = user.data.id
            tweets = self.client.get_users_tweets(id=user_id, max_results=count)
            # Entfernen von leeren Tweets
            return [
                self.extract_tweet_attributes(tweet.text.strip())
                for tweet in tweets.data
                if tweet.text.strip()
            ] if tweets.data else []
        except Exception as e:
            print(f"Fehler beim Abrufen von Tweets: {e}")
            return []

    def extract_tweet_attributes(self, tweet_text):
        # Normalisieren des Textes
        normalized_text = self.normalize_text(tweet_text)

        # Tokenisieren und Entfernen von Stop-Wörtern
        processed_text = self.tokenize_and_remove_stopwords(normalized_text, self.stop_words)

        # Extrahieren von Schlüsselwörtern, Beträgen, Adressen, Hashtags und Links
        keywords = self.extract_keywords(processed_text)
        amount = self.extract_amount(tweet_text)
        addresses = self.extract_addresses(tweet_text)
        hashtags = self.extract_hashtags(tweet_text)
        links = self.extract_links(tweet_text)

        return {
            "text": tweet_text,
            "processed_text": processed_text,
            "keywords": keywords,
            "amount": amount,
            "addresses": addresses,
            "hashtags": hashtags,
            "links": links
        }

    def extract_keywords(self, text):
        # Extrahieren von relevanten Schlüsselwörtern
        relevant_keywords = [
            "solana", "ethereum", "btc", "transfer", "send", "receive",
            "wallet", "transaction", "mint", "burn", "staking", "nft"
        ]
        return [word for word in text.split() if word.lower() in relevant_keywords]

    def extract_amount(self, text):
        try:
            match = re.search(r"(\d+\.?\d*)\s?(SOL|ETH|BTC)", text.upper())
            return float(match.group(1)) if match else None
        except Exception as e:
            print(f"Fehler beim Extrahieren des Betrags: {e}")
            return None

    def extract_addresses(self, text):
        # Extrahieren von Wallet-Adressen (vereinfacht)
        return re.findall(r"0x[a-fA-F0-9]{40}", text)

    def extract_hashtags(self, text):
        # Extrahieren von Hashtags
        return re.findall(r"#\w+", text)

    def extract_links(self, text):
        # Extrahieren von URLs
        return re.findall(r"https?://[^\s]+", text)

    def analyze_sentiment(self, text):
        return self.analyzer.polarity_scores(text)
