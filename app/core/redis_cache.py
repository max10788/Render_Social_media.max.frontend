import redis
import json
from app.core.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL)

def cache_result(key: str, data: dict, expire: int = 3600):
    redis_client.set(key, json.dumps(data), ex=expire)

def get_cached_result(key: str):
    cached_data = redis_client.get(key)
    return json.loads(cached_data) if cached_data else None
