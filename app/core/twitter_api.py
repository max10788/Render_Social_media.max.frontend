import tweepy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class TwitterClient:
    def __init__(self):
        from app.core.config import settings
        self.client = tweepy.Client(
            bearer_token=settings.TWITTER_BEARER_TOKEN,
            consumer_key=settings.TWITTER_API_KEY,
            consumer_secret=settings.TWITTER_API_SECRET,
            access_token=settings.TWITTER_ACCESS_TOKEN,
            access_token_secret=settings.TWITTER_ACCESS_SECRET
        )
        self.sentiment_analyzer = SentimentIntensityAnalyzer()

    def fetch_user_tweets(self, username: str, max_results: int):
        user = self.client.get_user(username=username)
        user_id = user.data.id
        response = self.client.get_users_tweets(id=user_id, max_results=max_results)
        tweets = [tweet.text for tweet in response.data] if response.data else []
        return tweets

    def analyze_sentiment(self, text: str):
        return self.sentiment_analyzer.polarity_scores(text)
