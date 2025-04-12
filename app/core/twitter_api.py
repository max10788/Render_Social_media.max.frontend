import tweepy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class TwitterClient:
    def __init__(self):
        self.client = tweepy.Client(bearer_token=settings.TWITTER_BEARER_TOKEN)
        self.analyzer = SentimentIntensityAnalyzer()

    def fetch_tweets_by_user(self, username, count):
        try:
            user = self.client.get_user(username=username)
            user_id = user.data.id
            tweets = self.client.get_users_tweets(id=user_id, max_results=count)
            return [tweet.text for tweet in tweets.data] if tweets.data else []
        except Exception as e:
            print(f"Fehler beim Abrufen von Tweets: {e}")
            return []

    def analyze_sentiment(self, text):
        return self.analyzer.polarity_scores(text)
