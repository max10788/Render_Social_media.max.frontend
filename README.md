# Render Social Media & Blockchain Analysis

A comprehensive platform for analyzing social media interactions and blockchain transactions, with a focus on Solana blockchain tracking and social media sentiment analysis.

## Features

### Blockchain Analysis
- **Multi-Chain Support**
  - Primary support for Solana blockchain
  - Additional support for Ethereum, Binance, and Polygon networks
- **Transaction Tracking**
  - Detailed transaction history analysis
  - Transaction chain visualization
  - Real-time transaction monitoring
  - Caching system for improved performance
  - Support for SPL token transfers

### Social Media Analysis
- **Twitter Integration**
  - Tweet content analysis
  - Sentiment analysis using TextBlob
  - Keyword extraction and tracking
  - Language detection
  - Hashtag and link analysis

### Data Processing
- **Feature Engineering**
  - TF-IDF vectorization for text analysis
  - Sentiment scoring
  - Time-based analysis
  - Transaction pattern detection

### Real-time Currency Conversion
- Support for multiple currencies
- Exchange rate tracking
- Value conversion between cryptocurrencies

## Requirements

```python
# Core Dependencies
fastapi==0.95.2
uvicorn==0.23.1
gunicorn==21.2.0

# Web & HTTP
aiohttp==3.9.1
python-multipart==0.0.6
jinja2==3.1.2

# Twitter Analysis
tweepy==4.14.0
vaderSentiment==3.3.2
textblob==0.15.3
nltk==3.8.1
langdetect==1.0.9

# Database
sqlalchemy==2.0.20
psycopg2-binary==2.9.9
redis==4.6.0

# ML / Analysis
scikit-learn==1.3.0
numpy==1.23.5
pandas==2.0.3

# Blockchain Integration
web3==6.17.1
solana>=0.31.0
solders>=0.18.0
base58>=2.1.1
