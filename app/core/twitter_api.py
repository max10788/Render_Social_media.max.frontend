import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class TwitterClient:
    def __init__(self):
        self.client = tweepy.Client(bearer_token="YOUR_TWITTER_BEARER_TOKEN")
        self.analyzer = SentimentIntensityAnalyzer()

    def fetch_tweets_by_user(self, username, count):
        try:
            user = self.client.get_user(username=username)
            user_id = user.data.id
            tweets = self.client.get_users_tweets(id=user_id, max_results=count)
            return [self.extract_tweet_attributes(tweet.text) for tweet in tweets.data] if tweets.data else []
        except Exception as e:
            print(f"Fehler beim Abrufen von Tweets: {e}")
            return []

    def extract_tweet_attributes(self, tweet_text):
        # Extrahieren von Schlüsselwörtern, Beträgen, Adressen, Hashtags und Links
        keywords = self.extract_keywords(tweet_text)
        amount = self.extract_amount(tweet_text)
        addresses = self.extract_addresses(tweet_text)
        hashtags = self.extract_hashtags(tweet_text)
        links = self.extract_links(tweet_text)

        return {
            "text": tweet_text,
            "keywords": keywords,
            "amount": amount,
            "addresses": addresses,
            "hashtags": hashtags,
            "links": links
        }

    def extract_keywords(self, text):
        # Extrahieren von relevanten Schlüsselwörtern
        return [word for word in text.split() if word.lower() in ["solana", "ethereum", "btc", "transfer", "send", "receive"]]

    def extract_amount(self, text):
        # Extrahieren von Beträgen (z. B. "5 SOL", "10 ETH")
        match = re.search(r"(\d+\.?\d*)\s?(SOL|ETH|BTC)", text.upper())
        return float(match.group(1)) if match else None

    def extract_addresses(self, text):
        # Extrahieren von Wallet-Adressen (vereinfacht)
        match = re.findall(r"0x[a-fA-F0-9]{40}", text)
        return match

    def extract_hashtags(self, text):
        # Extrahieren von Hashtags
        return re.findall(r"#\w+", text)

    def extract_links(self, text):
        # Extrahieren von URLs
        return re.findall(r"https?://[^\s]+", text)

    def analyze_sentiment(self, text):
        return self.analyzer.polarity_scores(text)
