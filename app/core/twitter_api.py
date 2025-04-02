import tweepy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.core.config import settings

class TwitterClient:
    def __init__(self):
        self.client = tweepy.Client(
            bearer_token=settings.TWITTER_BEARER_TOKEN,
            consumer_key=settings.TWITTER_API_KEY,
            consumer_secret=settings.TWITTER_API_SECRET,
            access_token=settings.TWITTER_ACCESS_TOKEN,
            access_token_secret=settings.TWITTER_ACCESS_SECRET
        )
        self.sentiment_analyzer = SentimentIntensityAnalyzer()

    def fetch_tweets(self, query: str, max_results: int = 10):
        response = self.client.search_recent_tweets(query=query, max_results=max_results)
        tweets = [tweet.text for tweet in response.data] if response.data else []
        return tweets

    def analyze_sentiment(self, text: str):
        return self.sentiment_analyzer.polarity_scores(text)
