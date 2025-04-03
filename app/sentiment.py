from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

class SentimentModel:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=100)
        self.kmeans = KMeans(n_clusters=2, random_state=42)
        self.is_trained = False

    def train(self, tweets):
        # Trainieren des Modells
        X = self.vectorizer.fit_transform(tweets)
        self.kmeans.fit(X)
        self.is_trained = True

    def predict(self, tweets):
        if not self.is_trained:
            raise ValueError("Modell muss erst trainiert werden!")
        X = self.vectorizer.transform(tweets)
        return self.kmeans.predict(X)
