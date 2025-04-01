from app.core.twitter_api import TwitterClient

def test_fetch_tweets():
    client = TwitterClient()
    tweets = client.fetch_tweets("Python programming", max_results=5)
    assert isinstance(tweets, list)
    assert len(tweets) <= 5
